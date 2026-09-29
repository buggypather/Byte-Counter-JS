
export type RtfFont={index:number;name:string;family:string|null;charset:number|null}
export type RtfColor={index:number;red:number;green:number;blue:number}
function balancedGroup(raw:string,control:string){const start=raw.search(new RegExp('\\{\\\\'+control+'\\b','i'));if(start<0)return '';let depth=0,escaped=false;for(let i=start;i<raw.length;i++){const ch=raw[i];if(escaped){escaped=false;continue}if(ch==='\\'){escaped=true;continue}if(ch==='{')depth++;else if(ch==='}'&&--depth===0)return raw.slice(start,i+1)}return ''}
export function parseFontTable(raw:string):RtfFont[]{const g=balancedGroup(raw,'fonttbl');if(!g)return [];const out:RtfFont[]=[];const re=/\{\\f(\d+)([\s\S]*?);}/g;let m:RegExpExecArray|null;while((m=re.exec(g))){const body=m[2];const family=body.match(/\\f(?:nil|roman|swiss|modern|script|decor|tech|bidi)\b/i)?.[0].slice(2).toLowerCase()||null;const charset=body.match(/\\fcharset(\d+)/i);const name=body.replace(/\\[a-z]+-?\d* ?/gi,'').replace(/[{}]/g,'').trim();out.push({index:Number(m[1]),name:name||'Font '+m[1],family,charset:charset?Number(charset[1]):null})}return out}
export function parseColorTable(raw:string):RtfColor[]{const g=balancedGroup(raw,'colortbl');if(!g)return [];const body=g.replace(/^\{\\colortbl\s*/i,'').replace(/}[\s]*$/,'');const out:RtfColor[]=[];body.split(';').forEach((entry,index)=>{const r=entry.match(/\\red(\d+)/i),gg=entry.match(/\\green(\d+)/i),b=entry.match(/\\blue(\d+)/i);if(r||gg||b)out.push({index,red:Number(r?.[1]||0),green:Number(gg?.[1]||0),blue:Number(b?.[1]||0)})});return out}

export type RtfFormatting={bold:number;italic:number;underline:number;font:number;fontSize:number;foregroundColor:number;backgroundColor:number;alignLeft:number;alignCenter:number;alignRight:number;alignJustify:number;paragraphs:number;lists:number}

export type RtfRunStyle={bold:boolean;italic:boolean;underline:boolean;font:number|null;fontSizeHalfPoints:number|null;foregroundColor:number|null;backgroundColor:number|null;alignment:'left'|'center'|'right'|'justify'}
export type RtfControl={word:string;parameter:number|null;sourceStart:number;sourceEnd:number;raw:string;explanation:string}
export type RtfRun={text:string;start:number;end:number;sourceStart:number;sourceEnd:number;style:RtfRunStyle;controls:RtfControl[]}
const defaultStyle=():RtfRunStyle=>({bold:false,italic:false,underline:false,font:null,fontSizeHalfPoints:null,foregroundColor:null,backgroundColor:null,alignment:'left'})
const sameStyle=(a:RtfRunStyle,b:RtfRunStyle)=>JSON.stringify(a)===JSON.stringify(b)
export function parseRtfRuns(raw:string):RtfRun[]{
 const runs:RtfRun[]=[]; const stack:{style:RtfRunStyle;skip:boolean;controls:RtfControl[]}[]=[]; let style=defaultStyle(),skip=false,pos=0,i=0,controls:RtfControl[]=[]
 const emit=(s:string,sourceStart=i,sourceEnd=i+1)=>{if(!s||skip)return; const last=runs[runs.length-1]; if(last&&sameStyle(last.style,style)&&last.end===pos&&last.sourceEnd===sourceStart){last.text+=s;last.end+=s.length;last.sourceEnd=sourceEnd}else runs.push({text:s,start:pos,end:pos+s.length,sourceStart,sourceEnd,style:{...style},controls:[...controls]});pos+=s.length}
 while(i<raw.length){
  const ch=raw[i]
  if(ch==='{'){stack.push({style:{...style},skip,controls:[...controls]});i++;continue}
  if(ch==='}'){const prev=stack.pop();if(prev){style=prev.style;skip=prev.skip;controls=prev.controls}i++;continue}
  if(ch!=='\\'){emit(ch,i,i+1);i++;continue}
  if(i+1>=raw.length){i++;continue}
  const n=raw[i+1]
  if(n==='\\'||n==='{'||n==='}'){emit(n,i,i+2);i+=2;continue}
  if(n==="'"){const h=raw.slice(i+2,i+4);if(/^[0-9a-f]{2}$/i.test(h)){emit(String.fromCharCode(parseInt(h,16)),i,i+4);i+=4;continue}}
  if(n==='*'){skip=true;i+=2;continue}
  const m=raw.slice(i).match(/^\\([a-z]+)(-?\d+)? ?/i)
  if(!m){i+=2;continue}
  const controlStart=i, word=m[1].toLowerCase(), param=m[2]===undefined?null:Number(m[2]); i+=m[0].length
  const explain:Record<string,string>={b:'Bold text on/off',i:'Italic text on/off',ul:'Underline text on/off',ulnone:'Underline off',f:'Select font-table entry',fs:'Font size in half-points',cf:'Select foreground color-table entry',highlight:'Select highlight color-table entry',cb:'Select background color-table entry',ql:'Left paragraph alignment',qc:'Center paragraph alignment',qr:'Right paragraph alignment',qj:'Justified paragraph alignment',plain:'Reset character formatting',pard:'Reset paragraph formatting',par:'Paragraph break',line:'Line break',tab:'Tab',u:'Unicode UTF-16 code unit'}
  if(explain[word]){const ctl={word,parameter:param,sourceStart:controlStart,sourceEnd:i,raw:m[0],explanation:explain[word]}; controls=[...controls.filter(x=>!((['b','i','ul','ulnone','f','fs','cf','highlight','cb','ql','qc','qr','qj'].includes(word))&&x.word===word)),ctl]}
  if(['fonttbl','colortbl','stylesheet','info','pict','object','header','footer'].includes(word)){skip=true;continue}
  if(word==='b')style.bold=param!==0
  else if(word==='i')style.italic=param!==0
  else if(word==='ul')style.underline=param!==0
  else if(word==='ulnone')style.underline=false
  else if(word==='f'&&param!==null)style.font=param
  else if(word==='fs'&&param!==null)style.fontSizeHalfPoints=param
  else if(word==='cf'&&param!==null)style.foregroundColor=param
  else if((word==='highlight'||word==='cb')&&param!==null)style.backgroundColor=param
  else if(word==='ql')style.alignment='left'
  else if(word==='qc')style.alignment='center'
  else if(word==='qr')style.alignment='right'
  else if(word==='qj')style.alignment='justify'
  else if(word==='plain')style={...defaultStyle(),alignment:style.alignment}
  else if(word==='pard')style={...style,alignment:'left'}
  else if(word==='par'||word==='line')emit('\n',controlStart,i)
  else if(word==='tab')emit('\t',controlStart,i)
  else if(word==='u'&&param!==null){emit(String.fromCharCode((param+65536)%65536),controlStart,i); if(i<raw.length&&raw[i]!=='\\'&&raw[i]!=='{'&&raw[i]!=='}')i++}
 }
 return runs.filter(r=>r.text.length>0)
}

export type RtfStats={rawBytes:number;controlWords:number;groups:number;hexEscapes:number;unicodeEscapes:number;pictures:number;objects:number;fontTableChars:number;colorTableChars:number;plainText:string;formatting:RtfFormatting;runs:RtfRun[];fonts:RtfFont[];colors:RtfColor[]}
const count=(s:string,r:RegExp)=>(s.match(r)||[]).length
export function inspectRtf(raw:string,rawBytes:number):RtfStats{
 const table=(name:string)=>{const m=raw.match(new RegExp('\\\\'+name+'[\\s\\S]*?\\}')); return m?.[0].length||0}
 let plain=raw
  .replace(/\{\\\*[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g,'')
  .replace(/\{\\(?:fonttbl|colortbl|stylesheet|info)[\s\S]*?\}/g,'')
  .replace(/\\par\b/g,'\n').replace(/\\line\b/g,'\n').replace(/\\tab\b/g,'\t')
  .replace(/\\u(-?\d+)\??/g,(_,n)=>String.fromCharCode((Number(n)+65536)%65536))
  .replace(/\\'([0-9a-f]{2})/gi,(_,h)=>String.fromCharCode(parseInt(h,16)))
  .replace(/\\[a-z]+-?\d* ?/gi,'').replace(/\\[{}\\]/g,m=>m.slice(1)).replace(/[{}]/g,'')
 const formatting:RtfFormatting={bold:count(raw,/\\b(?:0)?\b/g),italic:count(raw,/\\i(?:0)?\b/g),underline:count(raw,/\\ul(?:none|0)?\b/g),font:count(raw,/\\f\d+\b/g),fontSize:count(raw,/\\fs\d+\b/g),foregroundColor:count(raw,/\\cf\d+\b/g),backgroundColor:count(raw,/\\(?:highlight|cb)\d+\b/g),alignLeft:count(raw,/\\ql\b/g),alignCenter:count(raw,/\\qc\b/g),alignRight:count(raw,/\\qr\b/g),alignJustify:count(raw,/\\qj\b/g),paragraphs:count(raw,/\\par\b/g),lists:count(raw,/\\(?:listtext|ls\d+)\b/g)}
 return {rawBytes,controlWords:count(raw,/\\[a-z]+-?\d* ?/gi),groups:count(raw,/\{/g),hexEscapes:count(raw,/\\'[0-9a-f]{2}/gi),unicodeEscapes:count(raw,/\\u-?\d+\??/gi),pictures:count(raw,/\\pict\b/gi),objects:count(raw,/\\object\b/gi),fontTableChars:table('fonttbl'),colorTableChars:table('colortbl'),plainText:plain.trim(),formatting,runs:parseRtfRuns(raw),fonts:parseFontTable(raw),colors:parseColorTable(raw)}
}

export type RtfComparison={formattingChanges:string[];rawByteDelta:number;visibleUtf8Delta:number;visibleGraphemeDelta:number;controlWordDelta:number;groupDelta:number;unicodeEscapeDelta:number;hexEscapeDelta:number;pictureDelta:number;objectDelta:number;fontTableDelta:number;colorTableDelta:number;lessons:string[]}
export function compareRtf(a:RtfStats,b:RtfStats):RtfComparison{
 const visibleA=new TextEncoder().encode(a.plainText).length, visibleB=new TextEncoder().encode(b.plainText).length
 const graphemeCount=(s:string)=>{try{return [...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(s)].length}catch{return [...s].length}}
 const d={rawByteDelta:b.rawBytes-a.rawBytes,visibleUtf8Delta:visibleB-visibleA,visibleGraphemeDelta:graphemeCount(b.plainText)-graphemeCount(a.plainText),controlWordDelta:b.controlWords-a.controlWords,groupDelta:b.groups-a.groups,unicodeEscapeDelta:b.unicodeEscapes-a.unicodeEscapes,hexEscapeDelta:b.hexEscapes-a.hexEscapes,pictureDelta:b.pictures-a.pictures,objectDelta:b.objects-a.objects,fontTableDelta:b.fontTableChars-a.fontTableChars,colorTableDelta:b.colorTableChars-a.colorTableChars}
 const formattingChanges:string[]=[]
 const labels:[keyof RtfFormatting,string][]=[['bold','Bold controls'],['italic','Italic controls'],['underline','Underline controls'],['font','Font selections'],['fontSize','Font-size controls'],['foregroundColor','Text-color controls'],['backgroundColor','Background/highlight controls'],['alignLeft','Left alignment'],['alignCenter','Center alignment'],['alignRight','Right alignment'],['alignJustify','Justified alignment'],['paragraphs','Paragraph breaks'],['lists','List controls']]
 for(const [key,label] of labels){const delta=b.formatting[key]-a.formatting[key];if(delta)formattingChanges.push(`${label}: ${delta>0?'+':''}${delta}`)}
 const lessons:string[]=[]
 if(d.rawByteDelta!==d.visibleUtf8Delta) lessons.push('The file-size change is not the same as the visible UTF-8 text change. RTF stores markup, tables, escapes, and possibly embedded data in addition to readable text.')
 if(d.controlWordDelta) lessons.push(`Control words changed by ${d.controlWordDelta}. RTF control words describe formatting or document behavior; this count alone does not prove which visual formatting changed.`)
 if(formattingChanges.length) lessons.push('Specific formatting control counts changed: '+formattingChanges.join('; ')+'. These are observed RTF control changes; surrounding groups and document state determine exactly which text they affect.')
 if(d.unicodeEscapeDelta||d.hexEscapeDelta) lessons.push('Character escape usage changed. The same visible character can occupy different amounts of RTF source depending on how it is represented.')
 if(d.fontTableDelta||d.colorTableDelta) lessons.push('A font or color table changed. Table growth can increase file size even when little or no visible text is added.')
 if(d.pictureDelta||d.objectDelta) lessons.push('Embedded-content markers changed. Pictures and objects can dominate RTF file size, so marker counts should be interpreted alongside the raw byte delta.')
 if(!lessons.length) lessons.push('The tracked RTF structural counts did not change. Raw bytes may still differ in text, parameters, whitespace, or structures this lightweight inspector does not classify.')
 return {...d,formattingChanges,lessons}
}
