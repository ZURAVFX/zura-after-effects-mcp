import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const files=readdirSync('tests').filter(file=>file.endsWith('.test.mjs')).sort().map(file=>'tests/'+file);
if(!files.length)throw Error('No test files found.');
const result=spawnSync(process.execPath,['--test',...files],{stdio:'inherit',windowsHide:true});
if(result.error)throw result.error;
process.exit(result.status??1);
