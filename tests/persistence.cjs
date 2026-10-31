'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),Module=require('node:module');
const load=Module._load;
Module._load=function(id,...args){return id==='obsidian'?{Plugin:class{},PluginSettingTab:class{},Setting:class{},MarkdownView:class{},Menu:class{},Modal:class{},Notice:class{}}:load.call(this,id,...args);};
const Tool=require('../main.js');Module._load=load;
const clone=x=>structuredClone(x);
const settled=p=>p.then(()=>({ok:true}),error=>({ok:false,error}));
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
function fixture(pauses=[1]){
 const p=new Tool();p.queue=Promise.resolve();p.settings=Tool.normalize({});p.notices=[];p.notice=m=>p.notices.push(m);
 let disk=clone(p.settings),count=0;const gates=new Map(pauses.map(i=>[i,{start:deferred(),finish:deferred()}]));
 p.paint=[];p.applySettings=()=>{assert.ok(!p.unloaded,'never repaint after unload');p.paint.push(clone(p.settings));};p.syncEditor=p.warnGraphSettings=()=>{};
 p.saveData=async data=>{const index=++count,gate=gates.get(index);if(gate){gate.start.resolve(clone(data));await gate.finish.promise;}disk=clone(data);};
 p.loadData=async()=>clone(disk);
 return {p,gates,get disk(){return clone(disk);},get count(){return count;},external(raw){disk=clone(raw);return settled(p.onExternalSettingsChange());}};
}
function incoming(f,label='Externally edited label'){
 const raw=f.disk;raw.typewriter=true;raw.graphCategories[0].name=label;raw.externalUnknown={retain:['all',7]};return raw;
}
function graph(f){
 global.document={body:{classList:{contains:c=>c==='theme-dark'}}};
 let options={colorGroups:[{query:'tag:#foreign',color:{a:1,rgb:123}}],search:'keep',scale:.7};
 const leaf={getViewState:()=>({type:'graph'})},view={leaf,containerEl:{isConnected:true,ownerDocument:document}};leaf.view=view;
 const engine={view,getOptions:()=>clone(options),setOptions:p=>{options={...options,...clone(p)};},onOptionsChange:()=>{}};view.dataEngine=engine;
 f.p.app={workspace:{activeLeaf:leaf,getLeavesOfType:()=>[leaf]}};
 return {leaf,engine,get options(){return clone(options);},set options(value){options=clone(value);}};
}
test('delivered external writing/category/unknown edits survive pending own writing and category saves; own operation rejects',async()=>{
 for(const kind of ['writing','category']){
  const f=fixture(),before=clone(f.p.settings);
  const own=settled(kind==='writing'?f.p.change('width','wide'):f.p.editCategory({...before.graphCategories[0],name:'Own label'},'note',before.graphCategories,false));
  await f.gates.get(1).start.promise;
  const raw=incoming(f),refresh=f.external(raw);
  f.gates.get(1).finish.resolve();const result=await own;await refresh;
  assert.equal(result.ok,false);assert.match(result.error.message,/External settings/);
  assert.deepEqual(f.disk,raw);assert.deepEqual(f.p.settings,Tool.normalize(raw));
  assert.equal(f.disk.width,'standard');assert.equal(f.disk.typewriter,true);assert.equal(f.disk.graphCategories[0].name,'Externally edited label');
  await f.p.change('hideInlineTitle',true);assert.deepEqual(f.disk.externalUnknown,raw.externalUnknown);assert.equal(f.disk.typewriter,true);
 }
});
test('newer incoming snapshot wins even when delivered while restoring an older captured snapshot',async()=>{
 const f=fixture([1,2]);const own=settled(f.p.change('width','wide'));await f.gates.get(1).start.promise;
 const first=incoming(f,'First external');const refresh1=f.external(first);f.gates.get(1).finish.resolve();
 await f.gates.get(2).start.promise;
 const latest=clone(first);latest.graphCategories[0].name='Latest external';latest.followOmarchyColors=true;
 const refresh2=f.external(latest);f.gates.get(2).finish.resolve();
 assert.equal((await own).ok,false);await Promise.all([refresh1,refresh2]);assert.deepEqual(f.disk,latest);assert.deepEqual(f.p.settings,Tool.normalize(latest));
 assert.equal(f.count,3);
});
test('out-of-order capture completion cannot adopt the older notification',async()=>{
 const f=fixture(),oldRead=deferred();const own=settled(f.p.change('width','wide'));await f.gates.get(1).start.promise;
 const first=incoming(f,'Old external');f.p.loadData=()=>oldRead.promise;
 const oldRefresh=f.external(first);
 f.p.loadData=async()=>clone(latest);
 const latest=incoming(f,'New external'),newRefresh=f.external(latest);
 f.gates.get(1).finish.resolve();await own;await newRefresh;
 oldRead.resolve(first);await oldRefresh;
 assert.deepEqual(f.disk,latest);assert.deepEqual(f.p.settings,Tool.normalize(latest));
});
test('failed capture blocks further writes without defaults; a new valid capture recovers explicitly',async()=>{
 const f=fixture();const own=settled(f.p.change('width','wide'));await f.gates.get(1).start.promise;
 f.p.loadData=async()=>{throw new Error('read denied');};const refresh=f.external(incoming(f));
 f.gates.get(1).finish.resolve();assert.equal((await own).ok,false);assert.equal((await refresh).ok,false);
 const count=f.count;await assert.rejects(f.p.change('hideInlineTitle',true),/capture/);assert.equal(f.count,count);
 assert.ok(f.p.notices.some(m=>m.includes('blocked')));
 const recovered=incoming(f,'Recovered incoming');f.p.loadData=async()=>clone(recovered);
 await f.external(recovered);assert.deepEqual(f.disk,recovered);assert.equal(f.p.pendingExternalRecovery,false);
});
test('failed restoration is visible/blocked; unload does not repaint stale markers while finishing captured recovery',async()=>{
 const f=fixture();const save=f.p.saveData;f.p.saveData=async v=>{if(f.count>=1)throw new Error('restore denied');return save(v);};
 const own=settled(f.p.change('width','wide'));await f.gates.get(1).start.promise;
 const refresh=f.external(incoming(f));f.gates.get(1).finish.resolve();assert.equal((await own).ok,false);assert.equal((await refresh).ok,false);
 assert.ok(f.p.pendingExternalRecovery);assert.ok(f.p.notices.some(m=>m.includes('restoration failed')));
 const u=fixture([1,2]);const pending=settled(u.p.change('width','wide'));await u.gates.get(1).start.promise;
 const raw=incoming(u),sync=u.external(raw);u.gates.get(1).finish.resolve();await u.gates.get(2).start.promise;
 u.p.unloaded=true;u.gates.get(2).finish.resolve();assert.equal((await pending).ok,false);await sync;
 assert.deepEqual(u.disk,raw);assert.equal(u.p.paint.length,0);
});
test('Graph ownership conflict preserves incoming ownership/preferences, restores only own live groups and invalidates stale preview',async()=>{
 const f=fixture(),g=graph(f),before=g.options,p=f.p,preview=p.previewGraph('apply');
 const own=settled(p.applyGraphPreview(preview));await f.gates.get(1).start.promise;
 const raw=incoming(f);raw.graphOwnership=[{query:'tag:#externally-owned',color:{a:1,rgb:42}}];const refresh=f.external(raw);
 f.gates.get(1).finish.resolve();assert.equal((await own).ok,false);await refresh;
 assert.deepEqual(f.disk,raw);assert.deepEqual(g.options,before);assert.deepEqual(p.settings.graphOwnership,raw.graphOwnership);
 await assert.rejects(p.applyGraphPreview(preview),/changed/);
});
test('an external event during the Graph ownership rollback save is not overwritten by old settings',async()=>{
 const f=fixture([2]),g=graph(f),originalGet=g.engine.getOptions,save=f.p.saveData;let failCheck=false;
 g.engine.getOptions=()=>{if(failCheck){failCheck=false;throw new Error('post-save verification failed');}return originalGet();};
 f.p.saveData=async value=>{await save(value);if(f.count===1)failCheck=true;};
 const own=settled(f.p.applyGraphPreview(f.p.previewGraph('apply')));await f.gates.get(2).start.promise;
 const raw=incoming(f,'External during rollback');raw.graphOwnership=[];const refresh=f.external(raw);
 f.gates.get(2).finish.resolve();assert.equal((await own).ok,false);await refresh;
 assert.deepEqual(f.disk,raw);assert.equal(f.p.settings.typewriter,true);assert.equal(f.p.settings.graphCategories[0].name,'External during rollback');
});
