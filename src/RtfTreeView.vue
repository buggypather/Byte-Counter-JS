<script setup lang="ts">
import {computed,defineComponent,h,ref,type PropType,type VNode} from 'vue'
import {parseRtfTree,type RtfNode} from './rtfParser'

const props=defineProps<{source:string;selectedStart:number|null;selectedEnd:number|null}>()
const emit=defineEmits<{select:[start:number,end:number]}>()
const open=ref(new Set<string>(['0']))
const tree=computed(()=>parseRtfTree(props.source))

function key(n:RtfNode){return n.start+':'+n.end}
function toggle(n:RtfNode){const k=key(n),s=new Set(open.value);s.has(k)?s.delete(k):s.add(k);open.value=s}

const TreeNode=defineComponent({
 name:'TreeNode',
 props:{
  node:{type:Object as PropType<RtfNode>,required:true},
  depth:{type:Number,required:true},
  open:{type:Object as PropType<Set<string>>,required:true},
  selectedStart:{type:Number as PropType<number|null>,default:null},
  selectedEnd:{type:Number as PropType<number|null>,default:null}
 },
 emits:{
  toggle:(node:RtfNode)=>!!node,
  select:(start:number,end:number)=>Number.isFinite(start)&&Number.isFinite(end)
 },
 setup(p,{emit:emitNode}):()=>VNode{
  return ():VNode=>{
   const n=p.node,k=key(n),isOpen=p.open.has(k)
   const sel=p.selectedStart!==null&&p.selectedEnd!==null&&n.start<=p.selectedStart&&n.end>=p.selectedEnd
   let nodeLabel:string
   if(n.type==='group'){
    const first=n.children.find(x=>x.type==='token'&&x.token.type==='control-word')
    nodeLabel=first&&first.type==='token'?'{ \\'+first.token.word+(first.token.parameter??'')+' … }':'{ group … }'
   }else{
    nodeLabel=n.token.type==='text'
     ? JSON.stringify(n.token.raw.length>34?n.token.raw.slice(0,34)+'…':n.token.raw)
     : (n.token.raw.trim()||n.token.type)
   }
   const row=h('button',{
    class:['tree-row',{selected:sel}],
    style:{paddingLeft:(8+p.depth*16)+'px'},
    onClick:()=>emitNode('select',n.start,n.end)
   },[
    n.type==='group'
     ? h('span',{class:'twisty',onClick:(e:Event)=>{e.stopPropagation();emitNode('toggle',n)}},isOpen?'▾':'▸')
     : h('span',{class:'twisty'},'·'),
    h('code',nodeLabel),
    h('small',n.start+'–'+n.end)
   ])
   const children=n.type==='group'&&isOpen
    ? h('div',n.children.map(child=>h(TreeNode,{
       node:child,depth:p.depth+1,open:p.open,selectedStart:p.selectedStart,selectedEnd:p.selectedEnd,
       onToggle:(node:RtfNode)=>emitNode('toggle',node),
       onSelect:(start:number,end:number)=>emitNode('select',start,end)
      })))
    : null
   return h('div',[row,children])
  }
 }
})
</script>

<template>
 <div class="rtf-tree">
  <div class="tree-title">DOCUMENT TREE <span>{{tree.tokens.length}} tokens</span></div>
  <div v-if="tree.diagnostics.length" class="tree-diagnostics">
   <span v-for="d in tree.diagnostics" :key="d.start+':'+d.message">{{d.severity}}: {{d.message}} @ {{d.start}}</span>
  </div>
  <TreeNode
   v-for="n in tree.children"
   :key="key(n)"
   :node="n"
   :depth="0"
   :open="open"
   :selected-start="selectedStart"
   :selected-end="selectedEnd"
   @toggle="toggle"
   @select="(start:number,end:number)=>emit('select',start,end)"
  />
 </div>
</template>
