'use strict';
const { Plugin, PluginSettingTab, Setting, MarkdownView, Menu, Modal, Notice } = require('obsidian');
const SEEDS = [{key:'note',name:'Note',dark:'#39d0fc',light:'#006cac'}, {key:'restaurant',name:'Restaurant (example)',dark:'#83d5b4',light:'#22684e'}];
const DEFAULTS = Object.freeze({ typewriter: false, width: 'standard', hideInlineTitle: false, followOmarchyColors: false, graphCategories: SEEDS, graphOwnership: [] });
function normalize(data) {
  data = data && typeof data === 'object' ? data : {};
  return { typewriter: data.typewriter === true,
    width: ['narrow', 'standard', 'wide'].includes(data.width) ? data.width : 'standard',
    hideInlineTitle: data.hideInlineTitle === true,
    followOmarchyColors: data.followOmarchyColors === true,
    graphCategories: copy(data.graphCategories === undefined ? SEEDS : data.graphCategories),
    graphOwnership: copy(data.graphOwnership === undefined ? [] : data.graphOwnership) };
}
const PROPERTY = 'mounty-graph';
const copy = value => JSON.parse(JSON.stringify(value));
function stable(value) {
  if (Array.isArray(value)) return '['+value.map(stable).join(',')+']';
  if (value && typeof value === 'object') return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
const same = (a,b) => stable(a) === stable(b);
function keyValue(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 64 || /[\x00-\x1f\x7f\u2028\u2029"']/.test(value)) throw new Error('Use a nonempty category key of at most 64 characters, without quotes/control characters.');
  return value.trim();
}
function categories(value) {
  if (!Array.isArray(value)) throw new Error('Category settings are malformed. Repair or explicitly reset categories in settings.');
  const seen = new Set();
  return value.map(c => {
    if (!c || typeof c !== 'object') throw new Error('Invalid category entry. Repair category settings.');
    const key = keyValue(c.key);
    if (key !== c.key || seen.has(key.toLowerCase())) throw new Error('Category keys must be trimmed and unique ignoring case.');
    seen.add(key.toLowerCase());
    if (typeof c.name !== 'string' || !c.name.trim() || c.name.trim().length > 80 || /[\x00-\x1f\x7f]/.test(c.name)) throw new Error('Use a category label of 1–80 visible characters.');
    if (![c.dark,c.light].every(v => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v))) throw new Error('Use full six-digit hex colours, for example #39d0fc.');
    return {key, name:c.name.trim(), dark:c.dark.toLowerCase(), light:c.light.toLowerCase()};
  });
}
function queryFor(key) {
  const escaped = keyValue(key).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  return '["mounty-graph":/^'+escaped+'$/]';
}
function groupShape(g) {
  return g && typeof g === 'object' && same(Object.keys(g).sort(),['color','query']) && typeof g.query === 'string' && g.color && same(Object.keys(g.color).sort(),['a','rgb']) &&
    typeof g.color.a === 'number' && Number.isFinite(g.color.a) && g.color.a >= 0 && g.color.a <= 1 &&
    Number.isInteger(g.color.rgb) && g.color.rgb >= 0 && g.color.rgb <= 0xffffff;
}
function ownership(value) {
  if (!Array.isArray(value) || !value.every(groupShape) || new Set(value.map(stable)).size !== value.length) throw new Error('Ownership records are malformed. Do not apply until settings are repaired.');
  return copy(value);
}
function graphPlan(groups, owned, cats, scheme, action) {
  if (!Array.isArray(groups) || !groups.every(groupShape)) throw new Error('Unsupported native Graph group shape. No Graph changes made.');
  owned = ownership(owned);
  const indices = new Set();
  for (const record of owned) {
    const matches = groups.map((g,i)=>same(g,record)?i:-1).filter(i=>i>=0);
    if (matches.length > 1) throw new Error('Duplicate exact owned rules are ambiguous. Resolve them in native Graph, then preview again.');
    matches.forEach(i=>indices.add(i));
  }
  const retained = groups.filter((_g,i)=>!indices.has(i));
  const rules = action === 'apply' ? categories(cats).map(c=>({query:queryFor(c.key),color:{a:1,rgb:parseInt(c[scheme].slice(1),16)}})) : [];
  if (rules.some(rule=>retained.some(g=>g.query.toLowerCase()===rule.query.toLowerCase()))) throw new Error('A foreign or edited rule already uses a category query. Resolve that conflict in native Graph; nothing was overwritten.');
  return {groups:copy([...rules,...retained]), owned:copy(rules), retained:retained.length, removed:indices.size, rules};
}
function existingCategory(fm) {
  if (!fm || typeof fm !== 'object' || Array.isArray(fm)) throw new Error('Frontmatter is not a property object. Repair YAML manually first.');
  if (!Object.prototype.hasOwnProperty.call(fm,PROPERTY)) return undefined;
  if (typeof fm[PROPERTY] !== 'string') throw new Error('mounty-graph must be one string, not a list/object/number. Repair it manually before assigning or clearing.');
  const value = keyValue(fm[PROPERTY]);
  if (value !== fm[PROPERTY]) throw new Error('Trim the existing mounty-graph value manually first.');
  return value;
}
class ToolDialog extends Modal {
  constructor(plugin) { super(plugin.app); this.plugin=plugin; plugin.dialogs.add(this); }
  onClose() { this.plugin.dialogs.delete(this); this.contentEl.empty(); }
  text(tag,text) { return this.contentEl.createEl(tag,{text}); }
  cancelButton() { new Setting(this.contentEl).addButton(b=>b.setButtonText('Cancel').onClick(()=>this.close())); }
}
class AssignDialog extends ToolDialog {
  constructor(plugin, snapshot) { super(plugin); this.snapshot=snapshot; }
  onOpen() {
    this.text('h2','Assign one note category');
    this.text('p','Target: '+this.snapshot.path);
    this.text('p','Existing mounty-graph: '+(this.snapshot.category === undefined ? '(not assigned)' : this.snapshot.category));
    this.text('p','Only this property changes. Obsidian may normalize frontmatter formatting. Cancel makes no writes.');
    this.cancelButton();
    let choice='';
    new Setting(this.contentEl).setName('One category').addDropdown(d=>{
      d.addOption('','Choose a category');
      this.snapshot.categories.forEach((c,i)=>d.addOption(String(i),c.name+' ['+c.key+']'));
      d.onChange(v=>{choice=v;});
    });
    const commit = async key => {
      try { await this.plugin.assignCategory(this.snapshot,key); this.close(); this.plugin.notice('Category saved for '+this.snapshot.path); }
      catch (_error) { /* run() already reports a visible failure; keep target pinned. */ }
    };
    new Setting(this.contentEl).addButton(b=>b.setButtonText('Assign selected').onClick(()=>{
      if (choice==='') return this.plugin.notice('Choose a category first.');
      commit(this.snapshot.categories[Number(choice)].key);
    })).addButton(b=>b.setButtonText('Clear mounty-graph').onClick(()=>commit(null)));
    this.contentEl.querySelector('button')?.focus();
  }
}
class GraphDialog extends ToolDialog {
  constructor(plugin,preview) { super(plugin); this.preview=preview; }
  onOpen() {
    const p=this.preview;
    this.text('h2',p.action==='apply'?'Preview Graph category colours':'Preview removing owned Graph rules');
    this.text('p','Global Graph '+p.targetLabel+' · '+p.scheme+' scheme. Retain '+p.plan.retained+' existing groups.');
    this.text('p','Category rules take priority over overlapping old rules. Search, filters, forces, zoom and layout are not changed. Apply again after changing colours or scheme.');
    for (const rule of p.plan.rules) {
      const row=this.contentEl.createDiv({cls:'mounty-tool-rule'});
      const swatch=row.createSpan({cls:'mounty-tool-swatch'});swatch.style.backgroundColor='#'+rule.color.rgb.toString(16).padStart(6,'0');
      row.createSpan({text:rule.query});
    }
    if (p.action==='remove') this.text('p','Remove '+p.plan.removed+' exact unedited owned rules. Edited/foreign rules remain.');
    this.cancelButton();
    new Setting(this.contentEl).addButton(b=>b.setButtonText(p.action==='apply'?'Apply category colours':'Remove exact owned rules').onClick(async()=>{
      try { await this.plugin.applyGraphPreview(p); this.close(); this.plugin.notice('Live Graph groups confirmed. Native core persistence may complete asynchronously.'); }
      catch (_error) { /* Visible failure, never success. */ }
    }));
    this.contentEl.querySelector('button')?.focus();
  }
}

class WritingSettings extends PluginSettingTab {
  display() {
    this.containerEl.empty();
    new Setting(this.containerEl).setName('Writing').setHeading();
    new Setting(this.containerEl).setName('Follow Omarchy colours')
      .setDesc('Off protects the fixed palette immediately. On permits live colours on the next desktop Omarchy theme application; it does not switch the OS theme or confirm phone sync.')
      .addToggle(c => c.setValue(this.plugin.settings.followOmarchyColors).onChange(v => this.plugin.change('followOmarchyColors', v).catch(()=>{})));
    new Setting(this.containerEl).setName('Typewriter during Zen editing')
      .setDesc('Keep the cursor near the center after typing or keyboard movement. Off by default.')
      .addToggle(c => c.setValue(this.plugin.settings.typewriter).onChange(v => this.plugin.change('typewriter', v).catch(()=>{})));
    new Setting(this.containerEl).setName('Markdown reading width')
      .setDesc('Uses native readable-line length. Does not change other plugin views.')
      .addDropdown(c => c.addOptions({ narrow: 'Narrow', standard: 'Standard', wide: 'Wide' })
        .setValue(this.plugin.settings.width).onChange(v => this.plugin.change('width', v).catch(()=>{})));
    new Setting(this.containerEl).setName('Hide filename title')
      .setDesc('Hide only Markdown inline filename titles; keep your own H1. Off by default.')
      .addToggle(c => c.setValue(this.plugin.settings.hideInlineTitle).onChange(v => this.plugin.change('hideInlineTitle', v).catch(()=>{})));
    this.plugin.categorySettings(this.containerEl, () => this.display());
  }
}
class OmarchyWriting extends Plugin {
  async onload() {
    this.queue = Promise.resolve();
    this.dialogs = new Set();
    this.settings = normalize(await this.loadData());
    this.zen = false; this.frame = null; this.cleanups = []; this.composing = false;
    this.body = document.body;
    this.previous = new Map(['data-ow-width', 'data-ow-hide-title', 'data-ow-zen', 'data-ow-palette'].map(k => [k, this.body.getAttribute(k)]));
    this.cssRef = this.app.workspace.on('css-change', () => this.applyPalette());
    this.applySettings(); this.warnGraphSettings();
    this.addCommand({ id: 'toggle-zen', name: 'Toggle Zen', callback: () => this.setZen(!this.zen) });
    this.addCommand({ id: 'toggle-typewriter', name: 'Toggle typewriter', callback: () => this.change('typewriter', !this.settings.typewriter).catch(()=>{}) });
    this.addCommand({ id: 'open-writing-tools', name: 'Open writing tools', callback: () => this.openTools() });
    this.addCommand({ id: 'assign-graph-category', name: 'Assign or clear graph category for current note', callback: () => this.openAssignment() });
    this.addCommand({ id: 'preview-graph-categories', name: 'Preview applying graph category colours', callback: () => this.openGraphPreview('apply') });
    this.addCommand({ id: 'preview-remove-graph-categories', name: 'Preview removing unedited tool-owned graph rules', callback: () => this.openGraphPreview('remove') });
    this.addRibbonIcon('pen-tool', 'Open writing tools', event => this.openTools(event));
    this.addSettingTab(new WritingSettings(this.app, this));
  }
  warnGraphSettings() {
    try { categories(this.settings.graphCategories); ownership(this.settings.graphOwnership); }
    catch(error) { this.notice(error.message); }
  }
  categorySettings(container, redraw) {
    new Setting(container).setName('Graph categories').setHeading();
    new Setting(container).setDesc('Manual mounty-graph assignments only; one string per note. Editing labels/colours never edits notes or Graph. Removing a category leaves unmatched note properties until you change them.');
    let cats;
    try { cats=categories(this.settings.graphCategories); ownership(this.settings.graphOwnership); }
    catch (error) {
      new Setting(container).setName('Graph settings need attention').setDesc(error.message);
      new Setting(container).addButton(b=>b.setButtonText('Reset categories only (explicit)').onClick(()=>this.change('graphCategories',SEEDS).then(redraw).catch(()=>{})));
      return;
    }
    const editRow = (original) => {
      const draft=original?{...original}:{key:'',name:'',dark:'#39d0fc',light:'#006cac'};
      const card=container.createDiv({cls:'mounty-tool-category-editor'});
      card.setAttribute('role','group');
      card.setAttribute('aria-label',original?'Edit category '+original.name+' ['+original.key+']':'Add graph category');
      card.createEl('h4',{text:original?original.name:'Add category'});
      if (original) card.createEl('p',{text:'Stable key: '+original.key+' (unchanged by label or colour edits)'});
      const context=original?original.key:'new category';
      const field = name => new Setting(card).setClass('mounty-tool-category-row').setName(name);
      if (!original) field('Stable key').setDesc('Used by mounty-graph; cannot be renamed after creation.')
        .addText(t=>{
          t.inputEl.setAttribute('aria-label','Stable key for new category');
          t.setPlaceholder('For example restaurant').onChange(v=>{draft.key=v;});
        });
      field('Category label').addText(t=>{
        t.inputEl.setAttribute('aria-label','Category label for '+context);
        t.setValue(draft.name).onChange(v=>{draft.name=v;});
      });
      for (const [key,label] of [['dark','Dark colour'],['light','Light colour']]) {
        let hex, picker;
        field(label).addText(t=>{
          hex=t; t.inputEl.setAttribute('aria-label',label+' hex value for '+context);
          t.setPlaceholder('#rrggbb').setValue(draft[key]).onChange(value=>{
            draft[key]=value;
            if (/^#[0-9a-fA-F]{6}$/.test(value)) picker.setValue(value);
          });
        }).addColorPicker(c=>{
          picker=c; c.colorPickerEl.setAttribute('aria-label',label+' picker for '+context);
          c.setValue(draft[key]).onChange(value=>{draft[key]=value;hex.setValue(value);});
        });
      }
      const actions=field('Actions').setClass('mounty-tool-category-actions');
      actions.addButton(b=>b.setButtonText(original?'Save edits':'Add').onClick(()=>this.editCategory(draft,original?.key,cats,false).then(redraw).catch(()=>{})));
      if (original) actions.addButton(b=>b.setButtonText('Remove category').onClick(()=>this.editCategory(draft,original.key,cats,true).then(redraw).catch(()=>{})));
    };
    cats.forEach(editRow);editRow(null);
    new Setting(container).addButton(b=>b.setButtonText('Assign / clear current note').onClick(()=>this.openAssignment()));
    new Setting(container).addButton(b=>b.setButtonText('Preview Apply to global Graph').onClick(()=>this.openGraphPreview('apply')))
      .addButton(b=>b.setButtonText('Preview remove owned rules').onClick(()=>this.openGraphPreview('remove')));
  }
  editCategory(draft, oldKey, expected, remove) {
    return this.run(async()=>{
      const current=categories(this.settings.graphCategories);
      if (!same(current,expected)) throw new Error('Categories changed. Reopen settings before editing.');
      const candidate=oldKey ? current.filter(c=>c.key!==oldKey) : [...current];
      if (!remove) {
        const clean={...draft,key:oldKey || keyValue(draft.key)};
        if (oldKey) candidate.splice(current.findIndex(c=>c.key===oldKey),0,clean); else candidate.push(clean);
      }
      const next=normalize({...this.settings,graphCategories:categories(candidate)});
      await this.saveData(next);this.settings=next;
    });
  }
  captureNote(file=this.app.workspace.getActiveFile()) {
    const path=file?.path;
    if (!file || file.extension!=='md' || typeof path!=='string' || this.app.vault.getAbstractFileByPath(path)!==file) throw new Error('Select an existing Markdown note first.');
    const cache=this.app.metadataCache.getFileCache(file);
    if (!cache) throw new Error('Note metadata is not ready. Wait for Obsidian to parse it and try again.');
    return {file,path,mtime:file.stat?.mtime,size:file.stat?.size,category:existingCategory(cache.frontmatter || {}),categories:categories(this.settings.graphCategories)};
  }
  assertNote(snapshot) {
    if (this.unloaded) throw new Error('Tool unloaded. Cancel and reopen after enabling.');
    const f=snapshot.file;
    if (f.path!==snapshot.path || f.extension!=='md' || this.app.vault.getAbstractFileByPath(snapshot.path)!==f || f.stat?.mtime!==snapshot.mtime || f.stat?.size!==snapshot.size) throw new Error('Target note changed, moved or disappeared. Cancel and select it again.');
    if (!same(categories(this.settings.graphCategories),snapshot.categories)) throw new Error('Categories changed. Open a fresh note assignment.');
  }
  openAssignment() {
    try { new AssignDialog(this,this.captureNote()).open(); }
    catch(error) { this.notice(error.message); }
  }
  assignCategory(snapshot,key) {
    return this.run(async()=>{
      this.assertNote(snapshot);
      if (key!==null && !categories(this.settings.graphCategories).some(c=>c.key===key)) throw new Error('Unknown category. Reopen the assignment and choose an existing key.');
      await this.app.fileManager.processFrontMatter(snapshot.file,fm=>{
        this.assertNote(snapshot);
        if (existingCategory(fm)!==snapshot.category) throw new Error('mounty-graph changed since preview. Open a fresh assignment.');
        if (key===null) delete fm[PROPERTY]; else fm[PROPERTY]=key;
      });
    });
  }
  graphContext(leaf) {
    const leaves=this.app.workspace.getLeavesOfType('graph');
    if (!leaf || !leaves.includes(leaf) || leaf.getViewState?.().type!=='graph') throw new Error('Open an attached native GLOBAL Graph first, then preview again. Local Graph is not supported.');
    const view=leaf.view, engine=view?.dataEngine;
    if (view?.leaf!==leaf || !view.containerEl?.isConnected || view.containerEl.ownerDocument!==document || engine?.view!==view ||
        typeof engine.getOptions!=='function' || typeof engine.setOptions!=='function' || typeof engine.onOptionsChange!=='function') throw new Error('This Graph engine is unsupported. No writes made; validated interop targets Obsidian 1.14.5 main window.');
    const options=copy(engine.getOptions());
    if (!options || typeof options!=='object' || !Array.isArray(options.colorGroups) || !options.colorGroups.every(groupShape)) throw new Error('Unsupported Graph options. No changes made.');
    return {leaf,view,engine,options};
  }
  scheme() {
    if (document.body.classList.contains('theme-dark')) return 'dark';
    if (document.body.classList.contains('theme-light')) return 'light';
    throw new Error('Cannot identify the current light/dark scheme. Preview later.');
  }
  previewGraph(action) {
    if (!['apply','remove'].includes(action)) throw new Error('Unknown Graph action.');
    const leaves=this.app.workspace.getLeavesOfType('graph');
    const leaf=leaves.includes(this.app.workspace.activeLeaf)?this.app.workspace.activeLeaf:leaves[0];
    const ctx=this.graphContext(leaf), scheme=this.scheme();
    const cats=categories(this.settings.graphCategories), owned=ownership(this.settings.graphOwnership);
    const preview={...ctx,scheme,action,categories:copy(cats),ownership:owned,activeLeaf:this.app.workspace.activeLeaf,
      targetLabel:String(leaves.indexOf(leaf)+1),plan:graphPlan(ctx.options.colorGroups,owned,cats,scheme,action)};
    this.currentGraphPreview=preview;
    return preview;
  }
  openGraphPreview(action) {
    try { new GraphDialog(this,this.previewGraph(action)).open(); }
    catch(error) {
      this.notice(error.message);
      const menu=new Menu(); if (this.menu) this.menu.hide(); this.menu=menu;
      menu.onHide(()=>{if(this.menu===menu)this.menu=null;});
      menu.addItem(item=>item.setTitle('Open native global Graph (then preview again)').setDisabled(!this.availableCommand('graph:open')).onClick(()=>this.openPane('graph:open')));
      menu.showAtPosition({x:Math.max(0,window.innerWidth-260),y:64},document);
    }
  }
  validatePreview(p) {
    const ctx=this.graphContext(p.leaf);
    if (this.currentGraphPreview!==p || ctx.view!==p.view || ctx.engine!==p.engine || this.app.workspace.activeLeaf!==p.activeLeaf ||
        this.scheme()!==p.scheme || !same(ctx.options,p.options) || !same(categories(this.settings.graphCategories),p.categories) || !same(ownership(this.settings.graphOwnership),p.ownership)) throw new Error('Graph, scheme, categories, ownership or target changed. Cancel and create a fresh preview.');
    return ctx;
  }
  async notifyGraph(engine) {
    await engine.onOptionsChange();
    if (typeof engine.onOptionsChange.run==='function') await engine.onOptionsChange.run();
  }
  applyGraphPreview(p) {
    return this.run(async()=>{
      const ctx=this.validatePreview(p);
      const before=copy(this.settings), next=normalize({...before,graphOwnership:p.plan.owned});
      const expected={...p.options,colorGroups:p.plan.groups};
      let touched=false, saveAttempted=false;
      try {
        touched=true;
        ctx.engine.setOptions({colorGroups:copy(p.plan.groups)});
        await this.notifyGraph(ctx.engine);
        if (this.unloaded) throw new Error('Tool unloaded during Graph operation.');
        if (!same(this.graphContext(p.leaf).options,expected)) throw new Error('Native Graph did not confirm the intended groups/options.');
        saveAttempted=true;await this.saveData(next);
        this.settings=next;
        if (this.unloaded) throw new Error('Tool unloaded during persistence.');
        if (!same(this.graphContext(p.leaf).options,expected)) throw new Error('Graph changed during persistence. No success confirmed; preview again.');
        this.currentGraphPreview=null;
      } catch(error) {
        // Roll back ONLY if the live state is still exactly this operation's output.
        let graphRestored=false;
        try {
          const live=this.graphContext(p.leaf);
          if (touched && live.engine===ctx.engine && same(live.options,expected)) {
            live.engine.setOptions({colorGroups:copy(p.options.colorGroups)});
            await this.notifyGraph(live.engine);
            graphRestored=same(this.graphContext(p.leaf).options,p.options);
          } else graphRestored=same(live.options,p.options);
        } catch (_rollbackError) { /* Do not overwrite newer or detached state. */ }
        if (saveAttempted && graphRestored) {
          try {
            const persisted=await this.loadData();
            if (same(persisted,next)) { await this.saveData(before); this.settings=before; }
          } catch (_saveError) { /* Explain uncertain persistence, never claim success. */ }
        }
        this.currentGraphPreview=null;
        throw new Error(error.message+' Operation failed; '+(graphRestored?'previous live groups restored; review saved ownership before retrying.':'newer/unsupported live state left untouched. Inspect Graph and ownership before retrying.'));
      }
    });
  }
  availableCommand(id) {
    const commands = this.app.commands;
    return !!(commands && typeof commands.listCommands === 'function' &&
      typeof commands.executeCommandById === 'function' &&
      commands.listCommands().some(command => command.id === id));
  }
  openPane(id) {
    // Recheck at invocation: a core plugin may have been disabled since opening.
    if (!this.availableCommand(id)) return;
    this.setZen(false);
    this.app.commands.executeCommandById(id);
  }
  openTools(event) {
    if (this.menu) this.menu.hide();
    this.cancel();
    const menu = new Menu();
    this.menu = menu;
    menu.onHide(() => { if (this.menu === menu) this.menu = null; });
    menu.addItem(item => item.setTitle(this.zen ? 'Exit Zen' : 'Enter Zen')
      .setIcon('focus').onClick(() => this.setZen(!this.zen)));
    menu.addItem(item => item.setTitle('Typewriter').setChecked(this.settings.typewriter)
      .onClick(() => this.change('typewriter', !this.settings.typewriter).catch(()=>{})));
    menu.addSeparator();
    for (const [title, id, icon] of [['Open Outline', 'outline:open', 'list'], ['Open Backlinks', 'backlink:open', 'links-coming-in']]) {
      menu.addItem(item => item.setTitle(title).setIcon(icon).setDisabled(!this.availableCommand(id))
        .onClick(() => this.openPane(id)));
    }
    menu.addSeparator();
    menu.addItem(item => item.setTitle('Assign / clear graph category').onClick(() => this.openAssignment()));
    menu.addItem(item => item.setTitle('Preview category colours in Graph').onClick(() => this.openGraphPreview('apply')));
    menu.addItem(item => item.setTitle('Preview removing tool-owned rules').onClick(() => this.openGraphPreview('remove')));
    if (event) menu.showAtMouseEvent(event);
    else menu.showAtPosition({ x: Math.max(0, window.innerWidth - 240), y: 64 }, document);
  }
  visibleMenu() {
    // Native menus can leave hidden DOM behind; only visible menus suppress input.
    return !!this.menu || [...document.querySelectorAll('.menu')].some(el =>
      el.isConnected && el.getClientRects().length > 0 &&
      getComputedStyle(el).visibility !== 'hidden');
  }
  change(key, value) {
    return this.run(async () => {
      const next = normalize({ ...this.settings, [key]: value });
      await this.saveData(next);
      this.settings = next;
      if (!this.unloaded) { this.applySettings(); this.syncEditor(); }
    });
  }
  run(task) {
    const result = this.queue.then(() => { if (this.unloaded) throw new Error('Tool is unloaded. Re-enable it first.'); return task(); });
    this.queue = result.catch(error => { this.notice(error.message || 'Operation failed. No success confirmed.'); });
    return this.queue.then(() => result);
  }
  notice(message) { new Notice(message); }
  applySettings() {
    this.body.setAttribute('data-ow-width', this.settings.width);
    this.body.setAttribute('data-ow-hide-title', String(this.settings.hideInlineTitle));
    this.applyPalette();
  }
  notifyCSS() {
    if (this.notifyingCSS) return;
    this.notifyingCSS = true;
    try { this.app.workspace.trigger('css-change'); }
    finally { this.notifyingCSS = false; }
  }
  applyPalette() {
    if (this.unloaded || this.notifyingCSS) return;
    const marker = getComputedStyle(this.body).getPropertyValue('--ow-theme-id').trim();
    const wanted = marker === 'omarchy' && !this.settings.followOmarchyColors ? 'sonwork' : null;
    if (this.body.getAttribute('data-ow-palette') === wanted) return;
    if (wanted === null) this.body.removeAttribute('data-ow-palette');
    else this.body.setAttribute('data-ow-palette', wanted);
    this.notifyCSS();
  }
  onExternalSettingsChange() {
    return this.run(async () => {
      const settings = normalize(await this.loadData());
      if (this.unloaded) return;
      this.settings = settings; this.applySettings(); this.syncEditor(); this.warnGraphSettings();
    });
  }
  activeView() { return this.app.workspace.getActiveViewOfType(MarkdownView); }
  cancel() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
  }
  syncEditor() {
    this.cancel();
    if (this.padded) this.padded.classList.remove('ow-typewriter');
    this.padded = null;
    const view = this.activeView();
    if (this.zen && this.settings.typewriter && view && view.getMode() === 'source') {
      this.padded = view.containerEl;
      this.padded.classList.add('ow-typewriter');
    }
  }
  eligible(view) {
    return this.zen && this.settings.typewriter && !this.composing && !this.visibleMenu() &&
      Date.now() >= this.pausedUntil && view && view === this.activeView() &&
      view.getMode() === 'source' && view.editor.hasFocus() && !view.editor.somethingSelected() &&
      view.containerEl.contains(document.activeElement) &&
      !!document.activeElement.closest('.cm-editor') &&
      !document.querySelector('.modal-container, .suggestion-container');
  }
  schedule() {
    const view = this.activeView();
    if (!this.eligible(view)) return;
    this.cancel();
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      if (!this.eligible(view)) return;
      this.syncEditor();
      const cursor = view.editor.getCursor();
      view.editor.scrollIntoView({ from: cursor, to: cursor }, true);
    });
  }
  listen(target, event, fn, options) {
    target.addEventListener(event, fn, options);
    this.cleanups.push(() => target.removeEventListener(event, fn, options));
  }
  setZen(value) {
    if (this.zen === value) return;
    this.zen = value;
    if (!value) {
      this.cancel();
      for (const cleanup of this.cleanups.splice(0)) cleanup();
      if (this.button) this.button.remove();
      this.button = null;
      this.restore('data-ow-zen');
      this.composing = false;
      this.syncEditor();
      return;
    }
    this.pausedUntil = 0;
    this.body.setAttribute('data-ow-zen', 'true');
    this.button = document.createElement('button');
    this.button.className = 'ow-exit-zen'; this.button.textContent = 'Exit Zen';
    this.button.setAttribute('aria-label', 'Exit Zen');
    this.body.appendChild(this.button);
    this.listen(this.button, 'click', () => this.setZen(false));
    // Never bind Escape: Vim, IME, search, suggestions and modals own it.
    this.listen(document, 'compositionstart', () => { this.composing = true; this.cancel(); });
    this.listen(document, 'compositionend', () => { this.composing = false; });
    const manual = () => { this.pausedUntil = Date.now() + 800; this.cancel(); };
    for (const event of ['wheel', 'touchstart', 'pointerdown']) this.listen(document, event, manual, { passive: true, capture: true });
    this.listen(document, 'keyup', e => {
      if (!e.isComposing && !e.ctrlKey && !e.metaKey && !e.altKey &&
          e.key !== 'Escape' && e.key !== 'Shift' && !e.shiftKey) this.schedule();
    });
    this.listen(document, 'input', e => {
      const view = this.activeView();
      if (view && view.containerEl.contains(e.target) && e.target.closest('.cm-editor')) this.schedule();
    });
    for (const event of ['active-leaf-change', 'layout-change']) {
      const ref = this.app.workspace.on(event, () => this.syncEditor());
      this.cleanups.push(() => this.app.workspace.offref(ref));
    }
    this.syncEditor();
  }
  restore(key) {
    const old = this.previous.get(key);
    if (old === null) this.body.removeAttribute(key); else this.body.setAttribute(key, old);
  }
  onunload() {
    this.unloaded = true;
    for (const dialog of this.dialogs) dialog.close();
    this.dialogs.clear();
    this.app.workspace.offref(this.cssRef);
    const paletteBefore = this.body.getAttribute('data-ow-palette');
    if (this.menu) this.menu.hide();
    this.menu = null;
    this.setZen(false); this.cancel();
    for (const key of this.previous.keys()) this.restore(key);
    if (paletteBefore !== this.body.getAttribute('data-ow-palette')) this.notifyCSS();
  }
}
module.exports = OmarchyWriting;
module.exports.normalize = normalize;
module.exports.DEFAULTS = DEFAULTS;

module.exports.graphTools = {categories, queryFor, graphPlan, existingCategory, ownership, same, PROPERTY};
