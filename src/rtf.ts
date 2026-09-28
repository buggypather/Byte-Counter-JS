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
