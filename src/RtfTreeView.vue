<script setup lang="ts">
import {computed,ref} from 'vue'
import {parseRtfTree,type RtfNode} from './rtfParser'
const props=defineProps<{source:string;selectedStart:number|null;selectedEnd:number|null}>()
const emit=defineEmits<{select:[start:number,end:number]}>()
const open=ref(new Set<string>(['0']))
const tree=computed(()=>parseRtfTree(props.source))
function key(n:RtfNode){return n.start+':'+n.end}
function toggle(n:RtfNode){const k=key(n),s=new Set(open.value);s.has(k)?s.delete(k):s.add(k);open.value=s}
function label(n:RtfNode){if(n.type==='group'){const first=n.children.find(x=>x.type==='token'&&x.token.type==='control-word');return first&&first.type==='token'?'{ '+String.raw`\`+first.token.word+(first.token.parameter??'')+' … }':'{ group … }'}const t=n.token;if(t.type==='text')return JSON.stringify(t.raw.length>34?t.raw.slice(0,34)+'…':t.raw);return t.raw.trim()||t.type}
function selected(n:RtfNode){return props.selectedStart!==null&&n.start<=props.selectedStart!&&n.end>=props.selectedEnd!}
</script>
<template><div class="rtf-tree"><div class="tree-title">DOCUMENT TREE <span>{{tree.tokens.length}} tokens</span></div><div v-if="tree.diagnostics.length" class="tree-diagnostics"><span v-for="d in tree.diagnostics">{{d.severity}}: {{d.message}} @ {{d.start}}</span></div><template v-for="n in tree.children" :key="key(n)"><TreeNode :node="n" :depth="0" :open="open" :selected-start="selectedStart" :selected-end="selectedEnd" @toggle="toggle" @select="(a,b)=>emit('select',a,b)"/></template></div></template>
<script lang="ts">
import {defineComponent,h,type PropType} from 'vue'
import type {RtfNode} from './rtfParser'
const TreeNode=defineComponent({name:'TreeNode',props:{node:{type:Object as PropType<RtfNode>,required:true},depth:{type:Number,required:true},open:{type:Object as PropType<Set<string>>,required:true},selectedStart:{type:Number as PropType<number|null>,default:null},selectedEnd:{type:Number as PropType<number|null>,default:null}},emits:['toggle','select'],setup(p,{emit}){return()=>{const n=p.node,k=n.start+':'+n.end,isOpen=p.open.has(k),sel=p.selectedStart!==null&&n.start<=p.selectedStart!&&n.end>=p.selectedEnd!;let label='';if(n.type==='group'){const f=n.children.find(x=>x.type==='token'&&x.token.type==='control-word');label=f&&f.type==='token'?'{ \\'+f.token.word+(f.token.parameter??'')+' … }':'{ group … }'}else label=n.token.type==='text'?JSON.stringify(n.token.raw.length>34?n.token.raw.slice(0,34)+'…':n.token.raw):(n.token.raw.trim()||n.token.type);const row=h('button',{class:['tree-row',{selected:sel}],style:{paddingLeft:(8+p.depth*16)+'px'},onClick:()=>emit('select',n.start,n.end)},[n.type==='group'?h('span',{class:'twisty',onClick:(e:Event)=>{e.stopPropagation();emit('toggle',n)}},isOpen?'▾':'▸'):h('span',{class:'twisty'},'·'),h('code',label),h('small',n.start+'–'+n.end)]);return h('div',[row,n.type==='group'&&isOpen?h('div',n.children.map(c=>h(TreeNode,{node:c,depth:p.depth+1,open:p.open,selectedStart:p.selectedStart,selectedEnd:p.selectedEnd,onToggle:(x:RtfNode)=>emit('toggle',x),onSelect:(a:number,b:number)=>emit('select',a,b)}))):null])}}})
export {TreeNode}
</script>