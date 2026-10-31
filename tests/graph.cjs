'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), Module=require('node:module');
class Modal { constructor(app){this.app=app;} open(){} close(){this.onClose?.();} }
const load=Module._load;
Module._load=function(id,...args){return id==='obsidian'?{Plugin:class{},PluginSettingTab:class{},Setting:class{},MarkdownView:class{},Menu:class{},Modal,Notice:class{}}:load.call(this,id,...args);};
const Tool=require('../main.js');Module._load=load;
const {categories,queryFor,graphPlan,existingCategory}=Tool.graphTools;
const clone=x=>JSON.parse(JSON.stringify(x));
function setup(){
 global.document={body:{classList:{contains:name=>name==='theme-dark'}}};
 const p=new Tool();p.settings=Tool.normalize({typewriter:true,width:'standard',hideInlineTitle:false,followOmarchyColors:false});p.queue=Promise.resolve();p.dialogs=new Set();p.notice=m=>p.notices.push(m);p.notices=[];p.applySettings=()=>{};p.syncEditor=()=>{};
 let persisted=clone(p.settings);p.saves=0;p.saveData=async v=>{p.saves++;persisted=clone(v);};p.loadData=async()=>clone(persisted);
 const foreign={query:'tag:#active',color:{a:1,rgb:16098941}};
 let options={colorGroups:[foreign],search:'unchanged',showTags:false,forces:{strength:3},scale:.7};
 const leaf={getViewState:()=>({type:'graph'})},view={leaf,containerEl:{isConnected:true,ownerDocument:document}};leaf.view=view;
 const engine={view,getOptions:()=>clone(options),setOptions:partial=>{p.parts.push(clone(partial));options={...options,...clone(partial)};},onOptionsChange:()=>{}};view.dataEngine=engine;
 p.parts=[];p.app={workspace:{activeLeaf:leaf,getLeavesOfType:()=>[leaf]}};
 return {p,leaf,view,engine,get:()=>clone(options),set:v=>{options=clone(v);},foreign,get persisted(){return clone(persisted);}};
}
test('keys, names, colours and case-insensitive uniqueness are validated; query regex is literal and whole-value',()=>{
 assert.equal(queryFor('note'),'["mounty-graph":/^note$/]');
 assert.equal(queryFor('a/b\\c.*[x](y)+?^${z}|'), '["mounty-graph":/^a\\/b\\\\c\\.\\*\\[x\\]\\(y\\)\\+\\?\\^\\$\\{z\\}\\|$/]');
 for(const key of ['note','a/b\\c.*[x](y)+?^${z}|','notebook']){
  const source=queryFor(key).slice('["mounty-graph":/'.length,-2);
  const regex=new RegExp(source,'i');assert.ok(regex.test(key));assert.ok(!regex.test(key+'book'));
 }
 for(const key of ['', '   ','x'.repeat(65),'x\ny','x"/ ] OR tag:#private'])assert.throws(()=>queryFor(key));
 const c={key:'note',name:'Note',dark:'#39d0fc',light:'#006cac'};
 assert.throws(()=>categories([c,{...c,key:'NOTE'}]));
 assert.throws(()=>categories([{...c,dark:'red'}]));assert.throws(()=>categories([{...c,name:'  '} ]));
 assert.throws(()=>categories(null));
 assert.deepEqual(categories(Array.from({length:30},(_,i)=>({...c,key:'key'+i}))).length,30);
});
test('exact owned snapshots only, prepend new rules, repeat apply, edited/foreign rules and conflicts',()=>{
 const ctx=setup(),p=ctx.p,cats=categories(p.settings.graphCategories);
 const first=graphPlan(ctx.get().colorGroups,[],cats,'dark','apply');
 assert.equal(first.groups[0].color.rgb,3789052);assert.equal(first.groups[1].color.rgb,8639924);
 assert.deepEqual(first.groups.at(-1),ctx.foreign);
 assert.deepEqual(graphPlan(first.groups,first.owned,cats,'dark','apply').groups,first.groups);
 const changed=clone(first.groups);changed[0].color.rgb=123;
 assert.throws(()=>graphPlan(changed,first.owned,cats,'dark','apply'),/foreign or edited/);
 const removed=graphPlan(changed,first.owned,cats,'dark','remove');
 assert.deepEqual(removed.groups,[changed[0],ctx.foreign]);
 const lookalike={query:'["mounty-graph":/^foreign$/]',color:{a:1,rgb:7}};
 assert.deepEqual(graphPlan([lookalike],[],cats,'dark','remove').groups,[lookalike]);
 assert.throws(()=>graphPlan([first.owned[0]],[],cats,'dark','apply'),/foreign/);
 assert.throws(()=>graphPlan([first.owned[0],first.owned[0]],first.owned,cats,'dark','remove'),/ambiguous/);
});
test('preview/cancel does not write; apply/remove preserve all non-group options and durable ownership',async()=>{
 const c=setup(),p=c.p,baseline=c.get();
 p.previewGraph('apply');assert.equal(p.saves,0);assert.equal(p.parts.length,0);
 await p.applyGraphPreview(p.previewGraph('apply'));
 assert.equal(c.get().colorGroups.length,3);assert.equal(p.saves,1);assert.deepEqual(c.persisted.graphOwnership,p.settings.graphOwnership);
 assert.deepEqual({...c.get(),colorGroups:[]},{...baseline,colorGroups:[]});
 assert.ok(p.parts.every(v=>Object.keys(v).join()==='colorGroups'));
 await p.applyGraphPreview(p.previewGraph('apply'));assert.equal(c.get().colorGroups.length,3);
 // Simulate reload: records survive and allow exact removal.
 p.settings=Tool.normalize(c.persisted);await p.applyGraphPreview(p.previewGraph('remove'));
 assert.deepEqual(c.get(),baseline);assert.deepEqual(p.settings.graphOwnership,[]);
 assert.equal(p.settings.typewriter,true);assert.equal(p.settings.width,'standard');
});
test('stale groups/categories/scheme/active target/engine and unsupported/local graph refuse before mutations',async()=>{
 for(const mutate of [c=>c.set({...c.get(),search:'new'}),c=>{c.p.settings.graphCategories[0].dark='#123456';},c=>{document.body.classList.contains=n=>n==='theme-light';},c=>{c.p.app.workspace.activeLeaf={};},c=>{c.view.dataEngine={...c.engine};}]){
  const c=setup(),preview=c.p.previewGraph('apply');mutate(c);await assert.rejects(c.p.applyGraphPreview(preview),/changed|unsupported/);assert.equal(c.p.parts.length,0);assert.equal(c.p.saves,0);
 }
 const c=setup();c.leaf.getViewState=()=>({type:'localgraph'});assert.throws(()=>c.p.previewGraph('apply'),/GLOBAL/);
 c.leaf.getViewState=()=>({type:'graph'});c.engine.setOptions=null;assert.throws(()=>c.p.previewGraph('apply'),/unsupported/);
});
test('core errors/save rejection roll back only own output; newer user state is never overwritten',async()=>{
 const c=setup(),before=c.get();c.p.saveData=async()=>{throw new Error('disk full');};
 await assert.rejects(c.p.applyGraphPreview(c.p.previewGraph('apply')),/failed/);assert.deepEqual(c.get(),before);assert.equal(c.p.notices.length,1);
 const newer=setup();let count=0;
 newer.engine.onOptionsChange=()=>{if(!count++){newer.set({...newer.get(),search:'user changed'});throw new Error('core failed');}};
 await assert.rejects(newer.p.applyGraphPreview(newer.p.previewGraph('apply')),/newer/);
 assert.equal(newer.get().search,'user changed');assert.equal(newer.p.parts.length,1);
 const silent=setup();silent.engine.setOptions=()=>{};await assert.rejects(silent.p.applyGraphPreview(silent.p.previewGraph('apply')),/did not confirm/);assert.equal(silent.p.saves,0);
});
function noteSetup(value){
 const c=setup(),p=c.p;const file={path:'Selected.md',extension:'md',stat:{mtime:10,size:90}};
 let current=file;let fm={other:{keep:['all',3]},...(value===undefined?{}:{'mounty-graph':value})};let writes=0;
 p.app.workspace.getActiveFile=()=>file;p.app.vault={getAbstractFileByPath:()=>current};p.app.metadataCache={getFileCache:()=>({frontmatter:clone(fm)})};
 p.app.fileManager={processFrontMatter:async(target,fn)=>{assert.equal(target,file);const draft=clone(fm);fn(draft);fm=draft;writes++;}};
 return {...c,file,getFM:()=>clone(fm),setFM:v=>{fm=clone(v);},replace:()=>{current={...file};},writes:()=>writes};
}
test('one explicit note assignment and clear preserve all other properties; cancel and refusal write nothing',async()=>{
 const c=noteSetup();const before=c.getFM();const snap=c.p.captureNote();assert.equal(c.writes(),0);
 await c.p.assignCategory(snap,'note');assert.deepEqual(c.getFM(),{...before,'mounty-graph':'note'});
 await c.p.assignCategory(c.p.captureNote(),null);assert.deepEqual(c.getFM(),before);
 for(const bad of [[],{},1,null,'bad\nvalue']){
  const invalid=noteSetup(bad);assert.throws(()=>invalid.p.captureNote());assert.equal(invalid.writes(),0);
 }
 const unknown=noteSetup();await assert.rejects(unknown.p.assignCategory(unknown.p.captureNote(),'missing'));assert.equal(unknown.writes(),0);
 for(const mutate of [n=>{n.file.path='Renamed.md';},n=>n.replace(),n=>{n.file.extension='txt';},n=>{n.file.stat.mtime++;},n=>n.setFM({'mounty-graph':'restaurant'})]){
  const n=noteSetup(),snapshot=n.p.captureNote();mutate(n);await assert.rejects(n.p.assignCategory(snapshot,'note'));assert.equal(n.writes(),0);
 }
 const malformed=noteSetup();malformed.p.app.fileManager.processFrontMatter=async()=>{throw new Error('Malformed YAML');};await assert.rejects(malformed.p.assignCategory(malformed.p.captureNote(),'note'),/Malformed YAML/);assert.equal(malformed.writes(),0);
});
test('settings edits are serialized, key-stable and Graph/note-free; rejected saves preserve settings',async()=>{
 const c=setup(),p=c.p;const old=categories(p.settings.graphCategories);
 await p.editCategory({...old[0],key:'silently-renamed',name:'Renamed label',dark:'#112233'},'note',old,false);
 assert.equal(p.settings.graphCategories[0].key,'note');assert.equal(p.parts.length,0);
 await Promise.all([p.change('width','wide'),p.change('hideInlineTitle',true)]);assert.equal(p.settings.width,'wide');assert.equal(p.settings.hideInlineTitle,true);assert.equal(p.settings.typewriter,true);
 const snapshot=clone(p.settings);p.saveData=async()=>{throw new Error('denied');};await assert.rejects(p.change('width','narrow'));assert.deepEqual(p.settings,snapshot);
 const invalid=Tool.normalize({graphCategories:'broken',typewriter:true});assert.equal(invalid.graphCategories,'broken');assert.equal(invalid.typewriter,true);
 assert.throws(()=>existingCategory({'mounty-graph':['note']}));
});

test('overlapping own Graph/preferences saves retain latest writing values and ownership; future group shapes deny',async()=>{
 const c=setup(),p=c.p;
 const preview=p.previewGraph('apply');
 await Promise.all([p.change('width','wide'),p.applyGraphPreview(preview)]);
 assert.equal(p.settings.width,'wide');assert.equal(c.persisted.width,'wide');assert.equal(c.persisted.graphOwnership.length,2);
 const old=categories(p.settings.graphCategories);await p.editCategory({...old[0],dark:'#112233'},'note',old,false);
 await p.applyGraphPreview(p.previewGraph('apply'));assert.equal(c.get().colorGroups.length,3);assert.equal(c.get().colorGroups[0].color.rgb,0x112233);
 const after=categories(p.settings.graphCategories);await p.editCategory(after[1],'restaurant',after,true);
 assert.equal(c.get().colorGroups.length,3); // settings deletion never mutates Graph automatically
 const future=setup();future.set({...future.get(),colorGroups:[{...future.foreign,futureField:1}]});
 assert.throws(()=>future.p.previewGraph('apply'),/Unsupported/);assert.equal(future.p.parts.length,0);
});
