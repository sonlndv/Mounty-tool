'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),Module=require('node:module'),fs=require('node:fs'),path=require('node:path');
class Element {
 constructor(tag='div',options={}) { this.tag=tag;this.textContent=options.text||'';this.attrs={};this.children=[];this.classes=new Set(options.cls?[options.cls]:[]); }
 setAttribute(k,v){this.attrs[k]=v;}
 createDiv(options){return this.createEl('div',options);}
 createEl(tag,options){const el=new Element(tag,options);this.children.push(el);return el;}
}
class Setting {
 constructor(el){this.settingEl=el.createDiv({cls:'setting-item'});this.settingEl.setting=this;this.controls=[];}
 setName(value){this.name=value;return this;}
 setDesc(value){this.desc=value;return this;}
 setHeading(){return this;}
 setClass(value){this.settingEl.classes.add(value);return this;}
 component(kind){
  const input=new Element('input');input.attrs.type=kind==='colour'?'color':'text';
  const c={kind,inputEl:input,colorPickerEl:input,setValue(v){this.value=v;return this;},setPlaceholder(v){this.placeholder=v;return this;},onChange(fn){this.callback=fn;return this;},emit(v){this.value=v;this.callback(v);}};
  this.controls.push(c);return c;
 }
 addText(fn){fn(this.component('text'));return this;}
 addColorPicker(fn){fn(this.component('colour'));return this;}
 addButton(fn){const c={kind:'button',setButtonText(v){this.text=v;return this;},onClick(fn){this.click=fn;return this;}};this.controls.push(c);fn(c);return this;}
}
const original=Module._load;
Module._load=function(id,...args){return id==='obsidian'?{Plugin:class{},PluginSettingTab:class{},Setting,MarkdownView:class{},Menu:class{},Modal:class{},Notice:class{}}:original.call(this,id,...args);};
const Tool=require('../main.js');Module._load=original;
function fixture(){
 const p=new Tool();p.settings=Tool.normalize({});const container=new Element();const saved=[];
 p.editCategory=async(...args)=>{saved.push(structuredClone(args));};
 p.categorySettings(container,()=>{});
 return {container,saved,cards:container.children.filter(el=>el.classes.has('mounty-tool-category-editor'))};
}
const row=(card,name)=>card.children.map(el=>el.setting).find(s=>s?.name===name);
test('owned category cards expose named accessible text/picker fields, immutable existing keys and draft-only editing',async()=>{
 const {cards,saved}=fixture();assert.equal(cards.length,3);
 for(const card of cards){
  assert.equal(card.attrs.role,'group');assert.ok(card.attrs['aria-label']);
  for(const name of ['Category label','Dark colour','Light colour','Actions']){
   const field=row(card,name);assert.ok(field);assert.ok(field.settingEl.classes.has('mounty-tool-category-row'));
   for(const c of field.controls.filter(c=>c.kind!=='button'))assert.ok(c.inputEl.attrs['aria-label']);
  }
  for(const name of ['Dark colour','Light colour'])assert.deepEqual(row(card,name).controls.map(c=>c.kind),['text','colour']);
 }
 assert.equal(row(cards[0],'Stable key'),undefined); // no editable key for an existing category
 const addKey=row(cards[2],'Stable key');assert.equal(addKey.controls[0].inputEl.attrs['aria-label'],'Stable key for new category');
 const dark=row(cards[0],'Dark colour'),light=row(cards[0],'Light colour');
 dark.controls[0].emit('#123456');assert.equal(dark.controls[1].value,'#123456');
 light.controls[1].emit('#abcdef');assert.equal(light.controls[0].value,'#abcdef');
 dark.controls[0].emit('invalid');assert.equal(dark.controls[1].value,'#123456'); // invalid draft not coerced away
 row(cards[0],'Category label').controls[0].emit('Edited label');
 assert.equal(saved.length,0); // inputs and pickers never save/apply automatically
 await row(cards[0],'Actions').controls[0].click();assert.equal(saved.length,1);
 assert.equal(saved[0][0].key,'note');assert.equal(saved[0][0].dark,'invalid');assert.equal(saved[0][0].light,'#abcdef');
 assert.equal(saved[0][0].name,'Edited label');assert.equal(saved[0][1],'note');assert.equal(saved[0][3],false);
 await row(cards[0],'Actions').controls[1].click();assert.equal(saved[1][3],true);
 addKey.controls[0].emit('new-category');await row(cards[2],'Actions').controls[0].click();assert.equal(saved[2][0].key,'new-category');
});
test('new layout safeguards are scoped, wrapping and shrinkable without overflow masking or text reduction',()=>{
 const css=fs.readFileSync(path.join(__dirname,'../styles.css'),'utf8');
 const addition=css.slice(css.indexOf('/* Category editor only:'));
 assert.ok(addition.includes('flex-wrap: wrap'));
 for(const selector of ['.mounty-tool-category-editor','.mounty-tool-category-editor .mounty-tool-category-row .setting-item-control','.mounty-tool-category-editor .mounty-tool-category-row input[type="text"]']){
  const body=addition.slice(addition.indexOf(selector)).split('}')[0];assert.ok(body.includes('min-width: 0'),selector);
 }
 assert.ok(addition.includes('white-space: normal'));
 assert.ok(addition.includes('max-width: 100%'));
 assert.ok(!/overflow(?:-x)?\s*:\s*(hidden|clip)|font-size\s*:/.test(addition));
 const selectors=[...addition.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{/g)].map(m=>m[1].trim());
 assert.ok(selectors.every(s=>s.startsWith('.mounty-tool-category-editor')));
});
