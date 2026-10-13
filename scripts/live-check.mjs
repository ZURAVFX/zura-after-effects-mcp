// Explicitly invoked host integration check. Never run during installation.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import { mkdirSync,writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const output=resolve('artifacts/live-check');mkdirSync(output,{recursive:true});
const receipts=[];
const client=new Client({name:'zura-live-check',version:'1'});
await client.connect(new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../dist/index.js',import.meta.url))],stderr:'inherit'}));
async function call(op,args={}){const reply=await client.callTool({name:op,arguments:args});const result=JSON.parse(reply.content[0].text);receipts.push({operation:op,result});writeFileSync(resolve(output,'receipts.json'),JSON.stringify(receipts,null,2));console.log(op,result.status);if(!result.success)throw Error(result.error||op+' failed');if(result.status==='committed_unverified')throw Error(op+' readback is unverified');return result.data;}
try {
const project=await call('get_project');
const guard=project.path?{expected_project_path:project.path}:{};
const compAt=process.argv.indexOf('--comp-id');
const comp=compAt>=0?{item:{id:Number(process.argv[compAt+1])}}:await call('create_composition',{...guard,name:'Zura MCP validation '+new Date().toISOString().replace(/[:.]/g,'-'),width:1080,height:1920,duration:3,frame_rate:24});
const comp_id=comp.item.id;
const text=await call('create_text',{...guard,comp_id,text:'Zura MCP',name:'Zura test text',font_size:100,colour:[0.686,1,0.255]});
const layer_id=text.layer.id;
await call('list_properties',{...guard,comp_id,layer_id,property_path:['ADBE Transform Group']});
await call('set_property',{...guard,comp_id,layer_id,property_path:['ADBE Transform Group','ADBE Position'],value:[260,980,0]});
await call('set_keyframes',{...guard,comp_id,layer_id,property_path:['ADBE Transform Group','ADBE Opacity'],keys:[{time:0,value:0},{time:0.5,value:100},{time:2.5,value:100},{time:3,value:0}]});
await call('set_temporal_ease',{...guard,comp_id,layer_id,property_path:['ADBE Transform Group','ADBE Opacity'],key_index:2,in_ease:[{speed:0,influence:70}],out_ease:[{speed:0,influence:70}]});
await call('add_effect',{...guard,comp_id,layer_id,match_name:'ADBE Gaussian Blur 2'});
await call('create_shape',{...guard,comp_id,name:'Zura test shape',shape:'rectangle',size:[150,150],colour:[0.686,1,0.255]});
await call('get_render_templates',{...guard,comp_id});
await call('export_frame',{...guard,comp_id,path:resolve(output,'frame.png'),time:1,overwrite:true});
await call('get_composition',{...guard,comp_id});
console.log('Live host receipts saved to',output);
} finally {await client.close();}
