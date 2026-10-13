#!/usr/bin/env node
import { existsSync, mkdirSync, cpSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const run=(bin,args)=>execFileSync(bin,args,{cwd:root,stdio:'inherit',windowsHide:true});
const win=process.platform==='win32';
if(!win&&process.platform!=='darwin')throw Error('Supported installer hosts are Windows and macOS.');
const [major,minor]=process.versions.node.split('.').map(Number);
if(major<20||(major===20&&minor<19))throw Error('Run the platform installer: it installs a compatible Node runtime automatically.');
if(process.env.CODEX_HOME&&!isAbsolute(process.env.CODEX_HOME))throw Error('CODEX_HOME must be an absolute path.');
process.env.npm_config_fetch_retries='1';
process.env.npm_config_fetch_timeout='60000';
const panelOnly=process.argv.includes('--panel-only');
const runtime=win?join(process.env.LOCALAPPDATA||join(homedir(),'AppData','Local'),'Adobe','ZuraAfterEffectsMCP'):join(homedir(),'Library','Application Support','Adobe','ZuraAfterEffectsMCP');
const npmCli=join(dirname(process.execPath),'node_modules','npm','bin','npm-cli.js');
function npm(args,cwd=root){if(existsSync(npmCli))execFileSync(process.execPath,[npmCli,...args],{cwd,stdio:'inherit',windowsHide:true});else if(!win)execFileSync('npm',args,{cwd,stdio:'inherit'});else throw Error('npm is missing from this Node runtime. Use Node.js LTS with npm.');}
const hash=value=>createHash('sha256').update(value).digest('hex');
const dependencyHash=hash(readFileSync(join(root,'package-lock.json'))+process.version);
function tree(directory){return readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).map(e=>e.name+(e.isDirectory()?tree(join(directory,e.name)):readFileSync(join(directory,e.name),'utf8'))).join('\n');}
function state(file){try{return JSON.parse(readFileSync(file,'utf8'));}catch{return {};}}
if(!panelOnly){
  if(JSON.parse(readFileSync(join(root,'package.json'),'utf8')).name!=='zura-after-effects-mcp')throw Error('Wrong source package.');
  const stamp=join(root,'.zura-build-state.json');const previous=state(stamp);const buildHash=hash(tree(join(root,'src'))+readFileSync(join(root,'scripts','copy-host.mjs'),'utf8')+dependencyHash);
  if(previous.dependencies!==dependencyHash||!existsSync(join(root,'node_modules','typescript','package.json')))npm(['ci','--no-audit','--no-fund']);
  if(previous.build!==buildHash||!existsSync(join(root,'dist','host.jsx')))npm(['run','build']);
  writeFileSync(stamp,JSON.stringify({dependencies:dependencyHash,build:buildHash}));
}
if(win)run('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',join(root,'scripts','install-cep.ps1')]);
else run('/bin/bash',[join(root,'scripts','install-cep.sh'),'--copy']);
if(!panelOnly){
  const serverRoot=join(runtime,'server');mkdirSync(serverRoot,{recursive:true});
  cpSync(join(root,'dist'),join(serverRoot,'dist'),{recursive:true});
  for(const file of ['package.json','package-lock.json'])cpSync(join(root,file),join(serverRoot,file));
  const serverStamp=join(serverRoot,'.zura-install-state.json');
  if(state(serverStamp).dependencies!==dependencyHash||!existsSync(join(serverRoot,'node_modules','@modelcontextprotocol','sdk','package.json')))npm(['ci','--omit=dev','--no-audit','--no-fund'],serverRoot);
  writeFileSync(serverStamp,JSON.stringify({dependencies:dependencyHash}));
  let cli=process.env.ZURA_CODEX_CLI;
  if(cli&&!existsSync(cli))throw Error('ZURA_CODEX_CLI does not exist.');
  if(!cli)cli=[join(dirname(process.execPath),'node_modules','@openai','codex','bin','codex.js'),join(process.env.APPDATA||join(homedir(),'AppData','Roaming'),'npm','node_modules','@openai','codex','bin','codex.js'),join(runtime,'codex','node_modules','@openai','codex','bin','codex.js')].find(existsSync);
  if(!cli){const cliRoot=join(runtime,'codex');mkdirSync(cliRoot,{recursive:true});npm(['install','--prefix',cliRoot,'--no-audit','--no-fund','@openai/codex']);cli=join(cliRoot,'node_modules','@openai','codex','bin','codex.js');}
  const entry=join(serverRoot,'dist','index.js');
  run(process.execPath,[cli,'mcp','add','zura-after-effects-mcp','--',process.execPath,entry]);
  const registered=JSON.parse(execFileSync(process.execPath,[cli,'mcp','get','zura-after-effects-mcp','--json'],{encoding:'utf8',windowsHide:true}));
  if(registered.enabled===false||registered.transport?.command!==process.execPath||registered.transport?.args?.[0]!==entry)throw Error('Codex registration readback did not match the installed runtime.');
  const skillRoot=join(process.env.CODEX_HOME||join(homedir(),'.codex'),'skills','zura-after-effects');
  const marker=join(skillRoot,'.zura-managed.json');
  if(existsSync(join(skillRoot,'SKILL.md'))&&!existsSync(marker))throw Error('An existing unmanaged zura-after-effects skill was found. MCP registration succeeded; preserve that skill and resolve its ownership before installing the bundled skill.');
  mkdirSync(skillRoot,{recursive:true});cpSync(join(root,'skills','zura-after-effects'),skillRoot,{recursive:true});
  writeFileSync(marker,JSON.stringify({product:'zura-after-effects-mcp',version:JSON.parse(readFileSync(join(root,'package.json'),'utf8')).version}));
  const {Client}=await import('@modelcontextprotocol/sdk/client/index.js');
  const {StdioClientTransport}=await import('@modelcontextprotocol/sdk/client/stdio.js');
  const client=new Client({name:'zura-installer',version:'1'});
  try{await client.connect(new StdioClientTransport({command:process.execPath,args:[entry],stderr:'inherit'}));const catalogue=await client.listTools();if(!catalogue.tools.some(t=>t.name==='get_project'))throw Error('Installed MCP did not advertise its project inspection tool.');console.log('Installed MCP startup verified.');}finally{await client.close();}
  const report={product:'zura-after-effects-mcp',version:JSON.parse(readFileSync(join(root,'package.json'),'utf8')).version,status:'installed_verified',node:process.execPath,entrypoint:entry,skill:skillRoot,registration_verified:true,mcp_startup_verified:true,live_adobe_connection_verified:false,next_step:'If After Effects was open, save and restart it. Open a new Codex chat and inspect the current project using Zura After Effects MCP.'};
  const reportPath=join(runtime,'installation.json');
  writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
  console.log('Installation receipt:',reportPath);
  console.log('Codex registration verified with absolute paths:',entry);
}
console.log('Panel installed. Restart After Effects if it was open, then open a new Codex chat and run get_project. This installer does not restart Adobe applications.');
