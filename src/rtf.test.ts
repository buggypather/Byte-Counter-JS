import { describe,expect,it } from 'vitest'
import { compareRtf,inspectRtf } from './rtf'
describe('RTF comparison',()=>{
 it('separates raw growth from visible text growth',()=>{const a='{\\rtf1 Hello}',b='{\\rtf1\\b Hello world\\b0}'; const d=compareRtf(inspectRtf(a,a.length),inspectRtf(b,b.length)); expect(d.rawByteDelta).toBeGreaterThan(d.visibleUtf8Delta); expect(d.controlWordDelta).toBeGreaterThan(0); expect(d.lessons.length).toBeGreaterThan(0)})
 it('tracks escape representation changes',()=>{const a='{\\rtf1 A}',b="{\\rtf1 \\'e9}"; const d=compareRtf(inspectRtf(a,a.length),inspectRtf(b,b.length)); expect(d.hexEscapeDelta).toBe(1)})
 it('does not call every byte difference formatting',()=>{const a='{\\rtf1 cat}',b='{\\rtf1 dog}'; const d=compareRtf(inspectRtf(a,a.length),inspectRtf(b,b.length)); expect(d.controlWordDelta).toBe(0)})
})
