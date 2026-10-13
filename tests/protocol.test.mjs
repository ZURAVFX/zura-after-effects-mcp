import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
test('real stdio server advertises validated tools with unsafe scripting disabled',async()=>{
  const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../dist/index.js',import.meta.url))],stderr:'pipe'});
  const client=new Client({name:'test',version:'1'});
  try {await client.connect(transport);const list=await client.listTools();assert.ok(list.tools.some(t=>t.name==='batch_edit'));assert.ok(list.tools.some(t=>t.name==='set_temporal_ease'));assert.ok(!list.tools.some(t=>t.name==='set_expression'));const capabilities=await client.callTool({name:'get_capabilities',arguments:{}});assert.match(capabilities.content[0].text,/zura|Zura/);}
  finally{await client.close();}
});
