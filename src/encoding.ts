export type EncodingName = 'UTF-8'|'UTF-16 LE'|'UTF-16 BE'|'UTF-32 LE'|'UTF-32 BE'|'ASCII'|'Latin-1'
export type ByteResult = { bytes: Uint8Array; valid: boolean; unrepresentable: number }
const te = new TextEncoder()
export const codePoints=(s:string)=>[...s]
export const graphemes=(s:string)=>{ try { return [...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(s)].map(x=>x.segment) } catch { return codePoints(s) } }
export const cpLabel=(s:string)=>codePoints(s).map(c=>'U+'+(c.codePointAt(0)??0).toString(16).toUpperCase().padStart(4,'0')).join(' + ')
export function encode(s:string, enc:EncodingName):ByteResult {
  if(enc==='UTF-8') return {bytes:te.encode(s),valid:true,unrepresentable:0}
  const out:number[]=[]; let bad=0
  for(const ch of codePoints(s)){
    const cp=ch.codePointAt(0)!
    if(enc==='ASCII'||enc==='Latin-1') { const max=enc==='ASCII'?0x7f:0xff; if(cp<=max) out.push(cp); else bad++; continue }
    if(enc.startsWith('UTF-32')) { const le=enc.endsWith('LE'); const b=[cp>>>24,(cp>>>16)&255,(cp>>>8)&255,cp&255]; out.push(...(le?b.reverse():b)); continue }
    const units:number[]=[]
    if(cp<=0xffff) units.push(cp); else { const n=cp-0x10000; units.push(0xd800+(n>>>10),0xdc00+(n&0x3ff)) }
    const le=enc.endsWith('LE'); for(const u of units) out.push(...(le?[u&255,u>>>8]:[u>>>8,u&255]))
  }
  return {bytes:new Uint8Array(out),valid:bad===0,unrepresentable:bad}
}
export const byteCount=(s:string,e:EncodingName)=>encode(s,e).bytes.length
export const hexBytes=(s:string,e:EncodingName)=>[...encode(s,e).bytes].map(b=>b.toString(16).padStart(2,'0').toUpperCase()).join(' ')
export const bitBytes=(s:string,e:EncodingName)=>[...encode(s,e).bytes].map(b=>b.toString(2).padStart(8,'0')).join(' ')
export function analyze(s:string){
 const sizes=Object.fromEntries((['UTF-8','UTF-16 LE','UTF-16 BE','UTF-32 LE','UTF-32 BE','ASCII','Latin-1'] as EncodingName[]).map(e=>[e,encode(s,e)])) as Record<EncodingName,ByteResult>
 const gs=graphemes(s); let largest=''; let largestBytes=-1
 for(const g of gs){const n=byteCount(g,'UTF-8'); if(n>largestBytes){largest=g;largestBytes=n}}
 return {graphemes:gs.length,codepoints:codePoints(s).length,utf16Units:s.length,sizes,largest,largestBytes}
}
export function bom(enc:EncodingName):Uint8Array { if(enc==='UTF-8') return new Uint8Array([0xef,0xbb,0xbf]); if(enc==='UTF-16 LE')return new Uint8Array([0xff,0xfe]); if(enc==='UTF-16 BE')return new Uint8Array([0xfe,0xff]); if(enc==='UTF-32 LE')return new Uint8Array([0xff,0xfe,0,0]); if(enc==='UTF-32 BE')return new Uint8Array([0,0,0xfe,0xff]); return new Uint8Array() }
export function normalizeNewlines(s:string, style:'Preserve'|'LF'|'CRLF'|'CR'){ if(style==='Preserve')return s; const clean=s.replace(/\r\n|\r|\n/g,'\n'); return style==='LF'?clean:style==='CR'?clean.replace(/\n/g,'\r'):clean.replace(/\n/g,'\r\n') }
