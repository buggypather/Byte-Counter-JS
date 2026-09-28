export type RtfStats={rawBytes:number;controlWords:number;groups:number;hexEscapes:number;unicodeEscapes:number;pictures:number;objects:number;fontTableChars:number;colorTableChars:number;plainText:string}
const count=(s:string,r:RegExp)=>(s.match(r)||[]).length
export function inspectRtf(raw:string,rawBytes:number):RtfStats{
 const table=(name:string)=>{const m=raw.match(new RegExp('\\\\'+name+'[\\s\\S]*?\\}')); return m?.[0].length||0}
 let plain=raw
  .replace(/\{\\\*[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g,'')
  .replace(/\{\\(?:fonttbl|colortbl|stylesheet|info)[\s\S]*?\}/g,'')
  .replace(/\\par\b/g,'\n').replace(/\\line\b/g,'\n').replace(/\\tab\b/g,'\t')
  .replace(/\\u(-?\d+)\??/g,(_,n)=>String.fromCharCode((Number(n)+65536)%65536))
  .replace(/\\'([0-9a-f]{2})/gi,(_,h)=>String.fromCharCode(parseInt(h,16)))
  .replace(/\\[a-z]+-?\d* ?/gi,'').replace(/\\[{}\\]/g,m=>m.slice(1)).replace(/[{}]/g,'')
 return {rawBytes,controlWords:count(raw,/\\[a-z]+-?\d* ?/gi),groups:count(raw,/\{/g),hexEscapes:count(raw,/\\'[0-9a-f]{2}/gi),unicodeEscapes:count(raw,/\\u-?\d+\??/gi),pictures:count(raw,/\\pict\b/gi),objects:count(raw,/\\object\b/gi),fontTableChars:table('fonttbl'),colorTableChars:table('colortbl'),plainText:plain.trim()}
}

export type RtfComparison={rawByteDelta:number;visibleUtf8Delta:number;visibleGraphemeDelta:number;controlWordDelta:number;groupDelta:number;unicodeEscapeDelta:number;hexEscapeDelta:number;pictureDelta:number;objectDelta:number;fontTableDelta:number;colorTableDelta:number;lessons:string[]}
export function compareRtf(a:RtfStats,b:RtfStats):RtfComparison{
 const visibleA=new TextEncoder().encode(a.plainText).length, visibleB=new TextEncoder().encode(b.plainText).length
 const graphemeCount=(s:string)=>{try{return [...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(s)].length}catch{return [...s].length}}
 const d={rawByteDelta:b.rawBytes-a.rawBytes,visibleUtf8Delta:visibleB-visibleA,visibleGraphemeDelta:graphemeCount(b.plainText)-graphemeCount(a.plainText),controlWordDelta:b.controlWords-a.controlWords,groupDelta:b.groups-a.groups,unicodeEscapeDelta:b.unicodeEscapes-a.unicodeEscapes,hexEscapeDelta:b.hexEscapes-a.hexEscapes,pictureDelta:b.pictures-a.pictures,objectDelta:b.objects-a.objects,fontTableDelta:b.fontTableChars-a.fontTableChars,colorTableDelta:b.colorTableChars-a.colorTableChars}
 const lessons:string[]=[]
 if(d.rawByteDelta!==d.visibleUtf8Delta) lessons.push('The file-size change is not the same as the visible UTF-8 text change. RTF stores markup, tables, escapes, and possibly embedded data in addition to readable text.')
 if(d.controlWordDelta) lessons.push(`Control words changed by ${d.controlWordDelta}. RTF control words describe formatting or document behavior; this count alone does not prove which visual formatting changed.`)
 if(d.unicodeEscapeDelta||d.hexEscapeDelta) lessons.push('Character escape usage changed. The same visible character can occupy different amounts of RTF source depending on how it is represented.')
 if(d.fontTableDelta||d.colorTableDelta) lessons.push('A font or color table changed. Table growth can increase file size even when little or no visible text is added.')
 if(d.pictureDelta||d.objectDelta) lessons.push('Embedded-content markers changed. Pictures and objects can dominate RTF file size, so marker counts should be interpreted alongside the raw byte delta.')
 if(!lessons.length) lessons.push('The tracked RTF structural counts did not change. Raw bytes may still differ in text, parameters, whitespace, or structures this lightweight inspector does not classify.')
 return {...d,lessons}
}
