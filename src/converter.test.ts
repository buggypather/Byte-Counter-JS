import { describe,expect,it } from 'vitest'
import { decodeRepresentations,toHtmlDecimal,toHtmlHex,toJsEscapes,toUnicodeCodePoints } from './converter'
describe('representation converter',()=>{
 it('writes Unicode code points',()=>expect(toUnicodeCodePoints('A😀')).toBe('U+0041 U+1F600'))
 it('writes JavaScript escapes',()=>expect(toJsEscapes('A😀')).toBe('\\u0041\\u{1F600}'))
 it('writes numeric HTML entities',()=>{expect(toHtmlDecimal('😀')).toBe('&#128512;');expect(toHtmlHex('😀')).toBe('&#x1F600;')})
 it('decodes supported representations',()=>{expect(decodeRepresentations('U+1F600')).toBe('😀');expect(decodeRepresentations('&#x1F600;')).toBe('😀');expect(decodeRepresentations('\\u{1F600}')).toBe('😀')})
})
