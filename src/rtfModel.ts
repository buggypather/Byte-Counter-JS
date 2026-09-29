import {parseRtfTree,type RtfNode,type RtfDiagnostic} from './rtfParser'
import type {RtfToken} from './rtfLexer'
export type RtfModelFont={index:number;name:string}
export type RtfModelColor={index:number;red:number;green:number;blue:number}
export type RtfStyleProperty=keyof RtfComputedStyle
export type RtfProvenanceKind='applied'|'reset'|'override'|'restored'
export type RtfPropertyOrigin={property:RtfStyleProperty;value:RtfComputedStyle[RtfStyleProperty];control:string;sourceStart:number;sourceEnd:number;kind:'applied'|'reset'}
export type RtfProvenanceEvent={property:RtfStyleProperty;value:RtfComputedStyle[RtfStyleProperty];previousValue:RtfComputedStyle[RtfStyleProperty];control:string;sourceStart:number;sourceEnd:number;kind:RtfProvenanceKind;groupStart:number;groupEnd:number|null}
export type RtfComputedStyle={bold:boolean;italic:boolean;underline:boolean;font:number|null;fontSizeHalfPoints:number|null;foregroundColor:number|null;backgroundColor:number|null;alignment:'left'|'center'|'right'|'justify'}
export type RtfModelRun={text:string;start:number;end:number;sourceStart:number;sourceEnd:number;style:RtfComputedStyle;origins:Partial<Record<RtfStyleProperty,RtfPropertyOrigin>>;history:Partial<Record<RtfStyleProperty,RtfProvenanceEvent[]>>;sourceTokens:RtfToken[]}
export type RtfParagraph={index:number;start:number;end:number;sourceStart:number;sourceEnd:number;runs:RtfModelRun[];alignment:RtfComputedStyle['alignment']}
export type RtfDestination={name:string;sourceStart:number;sourceEnd:number;ignorable:boolean}
export type RtfModel={source:string;paragraphs:RtfParagraph[];runs:RtfModelRun[];destinations:RtfDestination[];fonts:RtfModelFont[];colors:RtfModelColor[];diagnostics:RtfDiagnostic[]}
type State={style:RtfComputedStyle;origins:Partial<Record<RtfStyleProperty,RtfPropertyOrigin>>;history:Partial<Record<RtfStyleProperty,RtfProvenanceEvent[]>>;groupStart:number;groupEnd:number|null;skip:boolean;destination:string|null;uc:number}
const base=():RtfComputedStyle=>({bold:false,italic:false,underline:false,font:null,fontSizeHalfPoints:null,foregroundColor:null,backgroundColor:null,alignment:'left'})
const destinationWords=new Set(['fonttbl','colortbl','stylesheet','info','pict','object','header','footer','headerl','headerr','footerl','footerr','listtable','listoverridetable','generator'])
const same=(a:RtfComputedStyle,b:RtfComputedStyle)=>JSON.stringify(a)===JSON.stringify(b)
const sameOrigins=(a:State['origins'],b:State['origins'])=>JSON.stringify(a)===JSON.stringify(b)
const origin=(state:State,property:RtfStyleProperty,value:RtfComputedStyle[RtfStyleProperty],t:RtfToken,kind:RtfPropertyOrigin['kind']='applied')=>{const previousValue=state.style[property],previous=state.origins[property];const eventKind:RtfProvenanceKind=kind==='reset'?'reset':previous?'override':'applied';state.origins[property]={property,value,control:t.raw.trim(),sourceStart:t.start,sourceEnd:t.end,kind};state.history[property]=[...(state.history[property]||[]),{property,value,previousValue,control:t.raw.trim(),sourceStart:t.start,sourceEnd:t.end,kind:eventKind,groupStart:state.groupStart,groupEnd:state.groupEnd}]}
export function buildRtfModel(source:string):RtfModel{
 const tree=parseRtfTree(source),runs:RtfModelRun[]=[],destinations:RtfDestination[]=[];let textPos=0
 const emit=(text:string,tokens:RtfToken[],style:RtfComputedStyle,origins:State['origins'],history:State['history'])=>{if(!text)return;const ss=tokens[0]?.start??0,se=tokens.at(-1)?.end??ss,last=runs.at(-1);if(last&&same(last.style,style)&&sameOrigins(last.origins,origins)&&last.end===textPos&&last.sourceEnd===ss){last.text+=text;last.end+=text.length;last.sourceEnd=se;last.sourceTokens.push(...tokens)}else runs.push({text,start:textPos,end:textPos+text.length,sourceStart:ss,sourceEnd:se,style:{...style},origins:{...origins},history:Object.fromEntries(Object.entries(history).map(([k,v])=>[k,[...(v||[])]])),sourceTokens:[...tokens]});textPos+=text.length}
 const walk=(nodes:RtfNode[],incoming:State)=>{const state:State={style:{...incoming.style},origins:{...incoming.origins},history:Object.fromEntries(Object.entries(incoming.history).map(([k,v])=>[k,[...(v||[])]])),groupStart:incoming.groupStart,groupEnd:incoming.groupEnd,skip:incoming.skip,destination:incoming.destination,uc:incoming.uc};let star=false
  for(const node of nodes){
   if(node.type==='group'){const before=destinations.length;const child:State={...state,style:{...state.style},origins:{...state.origins},history:Object.fromEntries(Object.entries(state.history).map(([k,v])=>[k,[...(v||[])]])),groupStart:node.start,groupEnd:node.end};walk(node.children,child);for(let di=before;di<destinations.length;di++)if(destinations[di].sourceEnd===destinations[di].sourceStart||destinations[di].sourceEnd===node.children[0]?.end)destinations[di].sourceEnd=node.end;continue}
   const t=node.token
   if(t.type==='control-symbol'){if(t.symbol==='*'){star=true;continue}if(!state.skip&&['\\','{','}'].includes(t.symbol||''))emit(t.symbol!,[t],state.style,state.origins,state.history);else if(!state.skip&&t.symbol==='~')emit('\u00a0',[t],state.style,state.origins,state.history);continue}
   if(t.type==='control-word'){const w=t.word!,p=t.parameter
    if(destinationWords.has(w)){state.destination=w;state.skip=true;destinations.push({name:w,sourceStart:t.start,sourceEnd:t.end,ignorable:star});star=false;continue}
    if(star){state.destination=w;state.skip=true;destinations.push({name:w,sourceStart:t.start,sourceEnd:t.end,ignorable:true});star=false;continue}
    if(w==='uc'&&p!==null){state.uc=Math.max(0,p);continue}
    if(state.skip)continue
    if(w==='b'){state.style.bold=p!==0;origin(state,'bold',state.style.bold,t)}else if(w==='i'){state.style.italic=p!==0;origin(state,'italic',state.style.italic,t)}else if(w==='ul'){state.style.underline=p!==0;origin(state,'underline',state.style.underline,t)}else if(w==='ulnone'){state.style.underline=false;origin(state,'underline',false,t)}
    else if(w==='f'&&p!==null){state.style.font=p;origin(state,'font',p,t)}else if(w==='fs'&&p!==null){state.style.fontSizeHalfPoints=p;origin(state,'fontSizeHalfPoints',p,t)}else if(w==='cf'&&p!==null){state.style.foregroundColor=p;origin(state,'foregroundColor',p,t)}else if((w==='highlight'||w==='cb')&&p!==null){state.style.backgroundColor=p;origin(state,'backgroundColor',p,t)}
    else if(w==='ql'){state.style.alignment='left';origin(state,'alignment','left',t)}else if(w==='qc'){state.style.alignment='center';origin(state,'alignment','center',t)}else if(w==='qr'){state.style.alignment='right';origin(state,'alignment','right',t)}else if(w==='qj'){state.style.alignment='justify';origin(state,'alignment','justify',t)}
    else if(w==='plain'){const alignment=state.style.alignment;state.style={...base(),alignment};for(const property of ['bold','italic','underline','font','fontSizeHalfPoints','foregroundColor','backgroundColor'] as RtfStyleProperty[])origin(state,property,state.style[property],t,'reset')}else if(w==='pard'){state.style.alignment='left';origin(state,'alignment','left',t,'reset')}
    else if(w==='par'||w==='line')emit('\n',[t],state.style,state.origins,state.history);else if(w==='tab')emit('\t',[t],state.style,state.origins,state.history)
    else if(w==='u'&&p!==null)emit(String.fromCharCode((p+65536)%65536),[t],state.style,state.origins,state.history)
    continue
   }
   if(state.skip)continue
   if(t.type==='hex-byte')emit(String.fromCharCode(t.hex!),[t],state.style,state.origins,state.history)
   else if(t.type==='text')emit(t.raw,[t],state.style,state.origins,state.history)
  }
 }
 walk(tree.children,{style:base(),origins:{},history:{},groupStart:0,groupEnd:source.length,skip:false,destination:null,uc:1})
 const paragraphs:RtfParagraph[]=[];let current:RtfModelRun[]=[]
 const flush=()=>{if(!current.length)return;const first=current[0],last=current.at(-1)!;paragraphs.push({index:paragraphs.length,start:first.start,end:last.end,sourceStart:first.sourceStart,sourceEnd:last.sourceEnd,runs:current,alignment:first.style.alignment});current=[]}
 for(const run of runs){current.push(run);if(run.text.includes('\n'))flush()}flush()
 const fontGroup=findDestinationGroup(tree.children,'fonttbl'),colorGroup=findDestinationGroup(tree.children,'colortbl')
 return {source,paragraphs,runs,destinations,fonts:fontGroup?parseFonts(source.slice(fontGroup.start,fontGroup.end)):[],colors:colorGroup?parseColors(source.slice(colorGroup.start,colorGroup.end)):[],diagnostics:tree.diagnostics}
}
function findDestinationGroup(nodes:RtfNode[],name:string):Extract<RtfNode,{type:'group'}>|null{for(const n of nodes)if(n.type==='group'){if(n.children.some(x=>x.type==='token'&&x.token.type==='control-word'&&x.token.word===name))return n;const f=findDestinationGroup(n.children,name);if(f)return f}return null}
function parseFonts(s:string):RtfModelFont[]{const out:RtfModelFont[]=[];for(const m of s.matchAll(/\{\\f(\d+)[\s\S]*? ([^;{}]+);}/g))out.push({index:Number(m[1]),name:m[2].trim()});return out}
function parseColors(s:string):RtfModelColor[]{const out:RtfModelColor[]=[];s.replace(/^\{\\colortbl\s*/,'').replace(/}.*$/s,'').split(';').forEach((e,index)=>{const r=e.match(/\\red(\d+)/),g=e.match(/\\green(\d+)/),b=e.match(/\\blue(\d+)/);if(r||g||b)out.push({index,red:Number(r?.[1]||0),green:Number(g?.[1]||0),blue:Number(b?.[1]||0)})});return out}
