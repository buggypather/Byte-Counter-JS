import { describe,expect,it } from 'vitest'
import { compareRtf,inspectRtf } from './rtf'
describe('RTF comparison',()=>{
 it('separates raw growth from visible text growth',()=>{const a='{\\rtf1 Hello}',b='{\\rtf1\\b Hello world\\b0}'; const d=compareRtf(inspectRtf(a,a.length),inspectRtf(b,b.length)); expect(d.rawByteDelta).toBeGreaterThan(d.visibleUtf8Delta); expect(d.controlWordDelta).toBeGreaterThan(0); expect(d.formattingChanges.some(x=>x.includes('Bold'))).toBe(true); expect(d.lessons.length).toBeGreaterThan(0) it('classifies common formatting controls',()=>{const a='{\\rtf1 plain}',b='{\\rtf1\\b bold\\b0 \\i italic\\i0 \\ul under\\ul0 \\fs28 size \\cf1 red \\qc centered\\par}'; const s=inspectRtf(b,b.length); expect(s.formatting.bold).toBeGreaterThan(0); expect(s.formatting.italic).toBeGreaterThan(0); expect(s.formatting.underline).toBeGreaterThan(0); expect(s.formatting.fontSize).toBe(1); expect(s.formatting.foregroundColor).toBe(1); expect(s.formatting.alignCenter).toBe(1); expect(compareRtf(inspectRtf(a,a.length),s).formattingChanges.length).toBeGreaterThan(4)})
})
 it('tracks escape representation changes',()=>{const a='{\\rtf1 A}',b="{\\rtf1 \\'e9}"; const d=compareRtf(inspectRtf(a,a.length),inspectRtf(b,b.length)); expect(d.hexEscapeDelta).toBe(1)})
 it('does not call every byte difference formatting',()=>{const a='{\\rtf1 cat}',b='{\\rtf1 dog}'; const d=compareRtf(inspectRtf(a,a.length),inspectRtf(b,b.length)); expect(d.controlWordDelta).toBe(0)})
})
