import { describe, expect, it } from 'vitest'
import { analyze, bom, byteCount, encode, graphemes, hexBytes, normalizeNewlines } from './encoding'
describe('Unicode encoding engine',()=>{
 it('encodes ASCII consistently',()=>{ expect(byteCount('A','UTF-8')).toBe(1); expect(hexBytes('A','UTF-8')).toBe('41'); expect(byteCount('A','UTF-16 LE')).toBe(2); expect(byteCount('A','UTF-32 LE')).toBe(4) })
 it('encodes multi-byte Unicode exactly',()=>{ expect(hexBytes('é','UTF-8')).toBe('C3 A9'); expect(hexBytes('世','UTF-8')).toBe('E4 B8 96'); expect(hexBytes('😀','UTF-8')).toBe('F0 9F 98 80') })
 it('encodes UTF-16 surrogate pairs in both byte orders',()=>{ expect(hexBytes('😀','UTF-16 LE')).toBe('3D D8 00 DE'); expect(hexBytes('😀','UTF-16 BE')).toBe('D8 3D DE 00') })
 it('encodes UTF-32 in both byte orders',()=>{ expect(hexBytes('😀','UTF-32 LE')).toBe('00 F6 01 00'); expect(hexBytes('😀','UTF-32 BE')).toBe('00 01 F6 00') })
 it('reports unrepresentable ASCII and Latin-1 input',()=>{ expect(encode('é','ASCII').valid).toBe(false); expect(encode('é','Latin-1').valid).toBe(true); expect(encode('世','Latin-1').valid).toBe(false) })
 it('keeps grapheme clusters distinct from code points',()=>{ const family='👨‍👩‍👧‍👦'; expect(graphemes(family).length).toBe(1); expect(analyze(family).codepoints).toBeGreaterThan(1) })
 it('handles combining marks as a displayed grapheme',()=>{ expect(graphemes('e\u0301').length).toBe(1); expect(analyze('e\u0301').codepoints).toBe(2) })
 it('recognizes BOM sizes',()=>{ expect(bom('UTF-8').length).toBe(3); expect(bom('UTF-16 LE').length).toBe(2); expect(bom('UTF-32 BE').length).toBe(4); expect(bom('ASCII').length).toBe(0) })
 it('normalizes newline styles',()=>{ expect(normalizeNewlines('a\r\nb\rc\nd','LF')).toBe('a\nb\nc\nd'); expect(normalizeNewlines('a\nb','CRLF')).toBe('a\r\nb') })
})
