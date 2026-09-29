import {describe,expect,it} from 'vitest'
import {tokenizeRtf} from './rtfLexer'
import {parseRtfTree} from './rtfParser'
describe('lossless RTF lexer',()=>{
 it('tokenizes groups, controls, symbols, hex bytes and text with exact offsets',()=>{const s="{\\rtf1 A \\'e9 {\\b bold}\\~x}";const t=tokenizeRtf(s);expect(t.map(x=>x.raw).join('')).toBe(s);expect(t.find(x=>x.type==='control-word'&&x.word==='rtf')?.parameter).toBe(1);expect(t.find(x=>x.type==='hex-byte')?.hex).toBe(0xe9);expect(t.find(x=>x.type==='control-symbol'&&x.symbol==='~')).toBeTruthy();for(const x of t)expect(s.slice(x.start,x.end)).toBe(x.raw)})
 it('preserves signed parameters and delimiter spaces',()=>{const s='\\u-10179?\\fs28 text';const t=tokenizeRtf(s);expect(t[0]).toMatchObject({word:'u',parameter:-10179,raw:'\\u-10179'});expect(t.find(x=>x.type==='control-word'&&x.word==='fs')).toMatchObject({parameter:28,raw:'\\fs28 '})})
})
describe('RTF syntax tree',()=>{
 it('builds nested groups without losing source',()=>{const s='{\\rtf1 outer {\\b inner} tail}';const d=parseRtfTree(s);const outer=d.children[0];expect(outer.type).toBe('group');if(outer.type==='group'){expect(s.slice(outer.start,outer.end)).toBe(s);expect(outer.children.some(x=>x.type==='group')).toBe(true);expect(outer.unclosed).toBe(false)}expect(d.tokens.map(x=>x.raw).join('')).toBe(s);expect(d.diagnostics).toEqual([])})
 it('reports unmatched and unclosed braces while preserving tokens',()=>{const s='{\\rtf1 broken}}';const d=parseRtfTree(s);expect(d.diagnostics.some(x=>x.message==='Unmatched closing brace')).toBe(true);expect(d.tokens.map(x=>x.raw).join('')).toBe(s);const u=parseRtfTree('{\\rtf1 open');expect(u.diagnostics.some(x=>x.message==='Unclosed group')).toBe(true)})
})
