import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { definitions } from '../dist/tools.js';
import { literal } from '../dist/bridge/script-builder.js';
import { z } from 'zod';
const source=readFileSync(new URL('../src/host.jsx',import.meta.url),'utf8');
function host(){
  const context=vm.createContext({});
  vm.runInContext(`
  function CompItem(){this.id=3;this.name="Test";this.width=1080;this.height=1920;this.frameRate=24;this.duration=3;this.numLayers=1;this.layer=function(){return layer;};}
  function FootageItem(){} function Shape(){} function TextDocument(){}
  function File(path){this.fsName=path;this.exists=true;}
  var prop={name:"Opacity",matchName:"ADBE Opacity",propertyType:1,propertyValueType:2,value:50,numKeys:0,canSetExpression:true,setValue:function(v){this.value=v;},setValueAtTime:function(t,v){this.value=v;this.numKeys++;},valueAtTime:function(){return this.value;}};
  var layer={id:9,index:1,name:"Layer",enabled:true,locked:false,threeDLayer:false,parent:null,inPoint:0,outPoint:3,startTime:0,property:function(){return prop;}};
  var comp=new CompItem(); var begins=0,ends=0;
  var app={version:"26",project:{file:new File("/test.aep"),numItems:1,activeItem:comp,item:function(){return comp;}},beginUndoGroup:function(){begins++;},endUndoGroup:function(){ends++;}};
  var PropertyType={PROPERTY:1};var PropertyValueType={NO_VALUE:0,CUSTOM_VALUE:9};
  `,context);
  vm.runInContext(source,context);
  return {context,run:(op,args,mutating=false)=>JSON.parse(vm.runInContext(`__zuraRun(${literal(op)},${literal(args)},${mutating})`,context))};
}
test('ES3 host source contains no modern syntax and parses',()=>{assert.doesNotMatch(source,/\b(?:const|let)\s|=>|`/);new vm.Script(source);});
test('safe literals preserve hostile paths and unicode without creating host code',()=>{const text='";throw Error("bad");\u2028\ud800\n';assert.equal(vm.runInNewContext(literal(text)),text);});
test('project guard fails before mutation and undo begins',()=>{const h=host();const result=h.run('set_property',{layer_id:9,property_path:['ADBE Opacity'],value:75,expected_project_path:'/other.aep'},true);assert.equal(result.status,'failed');assert.equal(vm.runInContext('begins',h.context),0);});
test('property mutation reports actual readback and closes undo group',()=>{const h=host();const result=h.run('set_property',{layer_id:9,property_path:['ADBE Opacity'],value:75},true);assert.equal(result.status,'verified');assert.equal(result.data.property.value,75);assert.equal(vm.runInContext('begins===ends',h.context),true);});
test('host coercion does not report verified',()=>{const h=host();vm.runInContext('prop.setValue=function(v){this.value=60;}',h.context);const result=h.run('set_property',{layer_id:9,property_path:['ADBE Opacity'],value:75},true);assert.equal(result.status,'committed_unverified');});
test('batch stops at first failure and reports partial mutation without retry',()=>{const h=host();const result=h.run('batch_edit',{steps:[{operation:'set_property',args:{layer_id:9,property_path:['ADBE Opacity'],value:75}},{operation:'get_layer',args:{layer_id:999}}]},true);assert.equal(result.status,'possibly_modified');assert.equal(result.failed_step,1);assert.equal(result.steps[0].status,'verified');assert.equal(result.retry_safe,false);assert.equal(vm.runInContext('begins===ends',h.context),true);});
test('bulk keyframes are one dispatcher call with readback',()=>{const h=host();const result=h.run('set_keyframes',{layer_id:9,property_path:['ADBE Opacity'],keys:[{time:0,value:0},{time:1,value:100}]},true);assert.equal(result.data.num_keys,2);assert.equal(result.status,'verified');});
test('tool validation rejects invalid dimensions and destructive unknown settings',()=>{assert.throws(()=>z.object(definitions.create_composition.schema).parse({name:'x',width:0,height:10,duration:1,frame_rate:24}));assert.throws(()=>z.object(definitions.set_layer.schema).parse({layer_id:9,settings:{unexpected:true}}));});
test('bridge targets AE only and defaults to its private directory',()=>{const bridge=readFileSync(new URL('../src/bridge/file-bridge.ts',import.meta.url),'utf8');assert.match(bridge,/AFTER_EFFECTS_MCP_TEMP_DIR/);assert.doesNotMatch(bridge,/process\.env\.PREMIERE/);assert.match(bridge,/ZuraAfterEffectsMCP/);});
