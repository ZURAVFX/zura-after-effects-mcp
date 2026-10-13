#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { definitions } from './tools.js';
import { sendCommand, getTempDir } from './bridge/file-bridge.js';
import { literal } from './bridge/script-builder.js';
import { z } from 'zod';
import { readFileSync, statSync, readdirSync, writeFileSync, unlinkSync, lstatSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
const capabilities = new Set((process.env.AFTER_EFFECTS_MCP_CAPABILITIES || 'inspect,edit,export,filesystem').split(',').map(s=>s.trim()));
const server=new McpServer({name:'zura-after-effects-mcp',version:'1.0.1'},{instructions:'Operate on the currently open After Effects project through the local CEP connector. Discover stable item/layer IDs and property match names. Supply expected_project_path on edits when saved. Reuse inspected IDs; do not guess indices. Verify results; committed_unverified and possibly_modified need inspection before retry. Never launch another AE instance or perform hidden/headless project edits. Native property expressions use the normal edit capability. Inspect expression errors after applying or repairing an expression. No separate opt-in is needed for expressions within an authorised edit. Prefer native tools over Computer Use. Render output and visual quality require inspection of the actual exported file.'});
server.registerTool('get_capabilities',{description:'Discover enabled operations and local bridge directory.',inputSchema:{}},async()=>({content:[{type:'text',text:JSON.stringify({capabilities:[...capabilities],tools:Object.keys(definitions).filter(n=>capabilities.has(definitions[n].capability)),bridge_directory:getTempDir()})}]}));
for(const [op,def] of Object.entries(definitions)) {
  if(!capabilities.has(def.capability))continue;
  server.registerTool(op,{description:def.description,inputSchema:def.schema,annotations:{readOnlyHint:!def.mutating,destructiveHint:['remove_layer','remove_property','remove_keyframe'].includes(op),idempotentHint:!def.mutating,openWorldHint:false}},async(args)=>{
    try {
      if(op==='batch_edit') {
        const batch=args as {steps:{operation:string;args:Record<string,unknown>}[];expected_project_path?:string};
        for(const step of batch.steps){const operation=definitions[step.operation];if(!operation||step.operation==='batch_edit'||operation.capability!=='edit')throw Error('Batch permits only non-nested edit operations.');step.args=z.object(operation.schema).strict().parse(step.args);if(step.args.expected_project_path && step.args.expected_project_path!==batch.expected_project_path)throw Error('Use one project guard for the whole batch.');}
      }
      if(op==='set_shape_path') { const a=args as {vertices:unknown[];in_tangents:unknown[];out_tangents:unknown[]};if(a.vertices.length!==a.in_tangents.length||a.vertices.length!==a.out_tangents.length)throw Error('Shape tangent lengths must match vertices.'); }
      const started=Date.now();
      if(op==='export_frame') (args as Record<string,unknown>).render_path=join(dirname(String(args.path)),'.zura-preview-'+randomUUID()+'.png');
      const result=await sendCommand('__zuraRun('+literal(op)+','+literal(args)+','+def.mutating+');',{requireHeartbeat:true,hostLabel:'After Effects',mutating:def.mutating,mutationOnTimeout:def.mutating,timeoutMs:op==='render_queue_item'?3600000:30000});
      if(op==='export_frame'&&result.success){
        const frame=result.data as {path:string;rendered_prefix?:string;width:number;height:number;verified:boolean};
        for(let attempt=0;attempt<50;attempt++){
          try {
            const candidates=frame.rendered_prefix?readdirSync(dirname(frame.rendered_prefix)).filter(n=>n.startsWith(basename(frame.rendered_prefix!))).map(n=>join(dirname(frame.rendered_prefix!),n)):[frame.path];
            for(const candidate of candidates){const stat=lstatSync(candidate);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>64*1024*1024)continue;const bytes=readFileSync(candidate);if(stat.mtimeMs>=started-1000&&bytes.length>=24&&bytes.toString('hex',0,8)==='89504e470d0a1a0a'&&bytes.readUInt32BE(16)===frame.width&&bytes.readUInt32BE(20)===frame.height){if(frame.rendered_prefix){writeFileSync(frame.path,bytes);unlinkSync(candidate);}frame.verified=true;(result as typeof result&{status:string}).status='verified';break;}}
            if(frame.verified)break;
          }catch{}
          await new Promise(resolve=>setTimeout(resolve,100));
        }
      }
      return {content:[{type:'text',text:JSON.stringify(result)}],isError:!result.success};
    } catch(error) { return {content:[{type:'text',text:JSON.stringify({success:false,error:String(error)})}],isError:true}; }
  });
}
await server.connect(new StdioServerTransport());
