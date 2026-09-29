export type RtfTokenType='group-start'|'group-end'|'control-word'|'control-symbol'|'hex-byte'|'text'
export type RtfToken={type:RtfTokenType;raw:string;start:number;end:number;word?:string;parameter?:number|null;symbol?:string;hex?:number}
export function tokenizeRtf(source:string):RtfToken[]{
 const out:RtfToken[]=[];let i=0
 const push=(t:RtfToken)=>out.push(t)
 while(i<source.length){
  const start=i,ch=source[i]
  if(ch==='{'){push({type:'group-start',raw:ch,start,end:++i});continue}
  if(ch==='}'){push({type:'group-end',raw:ch,start,end:++i});continue}
  if(ch!=='\\'){while(i<source.length&&!['{','}','\\'].includes(source[i]))i++;push({type:'text',raw:source.slice(start,i),start,end:i});continue}
  i++
  if(i>=source.length){push({type:'control-symbol',raw:'\\',start,end:i,symbol:'\\'});continue}
  if(source[i]==="'"&&/^[0-9a-f]{2}$/i.test(source.slice(i+1,i+3))){i+=3;const raw=source.slice(start,i);push({type:'hex-byte',raw,start,end:i,hex:parseInt(raw.slice(2),16)});continue}
  if(/[a-z]/i.test(source[i])){
   const ws=i;while(i<source.length&&/[a-z]/i.test(source[i]))i++;const word=source.slice(ws,i).toLowerCase()
   let sign=1;if(source[i]==='-'){sign=-1;i++}
   const ns=i;while(i<source.length&&/\d/.test(source[i]))i++;const parameter=i>ns?sign*Number(source.slice(ns,i)):null
   if(source[i]===' ')i++
   push({type:'control-word',raw:source.slice(start,i),start,end:i,word,parameter});continue
  }
  const symbol=source[i++];push({type:'control-symbol',raw:source.slice(start,i),start,end:i,symbol})
 }
 return out
}
