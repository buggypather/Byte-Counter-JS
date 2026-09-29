import {tokenizeRtf,type RtfToken} from './rtfLexer'
export type RtfGroupNode={type:'group';start:number;end:number;open:RtfToken|null;close:RtfToken|null;children:RtfNode[];unclosed:boolean}
export type RtfTokenNode={type:'token';start:number;end:number;token:RtfToken}
export type RtfNode=RtfGroupNode|RtfTokenNode
export type RtfDocument={type:'document';start:number;end:number;children:RtfNode[];tokens:RtfToken[];diagnostics:RtfDiagnostic[]}
export type RtfDiagnostic={message:string;start:number;end:number;severity:'warning'|'error'}
export function parseRtfTree(source:string):RtfDocument{
 const tokens=tokenizeRtf(source),diagnostics:RtfDiagnostic[]=[]
 const root:RtfDocument={type:'document',start:0,end:source.length,children:[],tokens,diagnostics}
 const stack:{children:RtfNode[];group:RtfGroupNode|null}[]=[{children:root.children,group:null}]
 for(const token of tokens){
  if(token.type==='group-start'){const group:RtfGroupNode={type:'group',start:token.start,end:token.end,open:token,close:null,children:[],unclosed:true};stack.at(-1)!.children.push(group);stack.push({children:group.children,group});continue}
  if(token.type==='group-end'){if(stack.length===1){diagnostics.push({message:'Unmatched closing brace',start:token.start,end:token.end,severity:'error'});stack[0].children.push({type:'token',start:token.start,end:token.end,token});continue}const entry=stack.pop()!;entry.group!.close=token;entry.group!.end=token.end;entry.group!.unclosed=false;continue}
  stack.at(-1)!.children.push({type:'token',start:token.start,end:token.end,token})
 }
 while(stack.length>1){const entry=stack.pop()!;entry.group!.end=source.length;diagnostics.push({message:'Unclosed group',start:entry.group!.start,end:source.length,severity:'error'})}
 return root
}
