import { codePoints } from './encoding'

export type ConversionMode='Unicode code points'|'JavaScript escapes'|'HTML decimal'|'HTML hexadecimal'|'UTF-8 hex'

export function toUnicodeCodePoints(s:string){return codePoints(s).map(c=>'U+'+c.codePointAt(0)!.toString(16).toUpperCase().padStart(4,'0')).join(' ')}
export function toJsEscapes(s:string){return codePoints(s).map(c=>{const cp=c.codePointAt(0)!; return cp<=0xFFFF?'\\u'+cp.toString(16).toUpperCase().padStart(4,'0'):'\\u{'+cp.toString(16).toUpperCase()+'}'}).join('')}
export function toHtmlDecimal(s:string){return codePoints(s).map(c=>'&#'+c.codePointAt(0)+';').join('')}
export function toHtmlHex(s:string){return codePoints(s).map(c=>'&#x'+c.codePointAt(0)!.toString(16).toUpperCase()+';').join('')}
export function decodeRepresentations(s:string){
 return s
  .replace(/&#x([0-9a-f]+);?/gi,(_,h)=>String.fromCodePoint(parseInt(h,16)))
  .replace(/&#([0-9]+);?/g,(_,d)=>String.fromCodePoint(parseInt(d,10)))
  .replace(/\\u\{([0-9a-f]+)\}/gi,(_,h)=>String.fromCodePoint(parseInt(h,16)))
  .replace(/\\u([0-9a-f]{4})/gi,(_,h)=>String.fromCharCode(parseInt(h,16)))
  .replace(/U\+([0-9a-f]{4,6})/gi,(_,h)=>String.fromCodePoint(parseInt(h,16)))
}
