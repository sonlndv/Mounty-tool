'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
test('0.4.1 palette CSS is an exact prefix; licenses/images unchanged; stable product identity',()=>{
 const css=fs.readFileSync(path.join(root,'styles.css'));
 assert.equal(sha(css.subarray(0,11384)),'dd237e5a87cca1167a411cdc92b1c8142726f0a606684bc21d257bf08780d4cb');
 const checks={'LICENSE': 'd9d287a9f91999435948e9e49bdbe0e9322a05fa2dbd87c2083492b47a0f2860', 'docs/images/mounty-zen.png': 'c7c49396b06542af79615395237ebb4731af5001701092f6c4ad881bbc6884e6', 'docs/images/mounty-writing-tools.png': 'c433bd0e4c52d6ba199c45362ca5aee3f6c5c0dd814da9d91f0637baf6152b8f'};
 for(const [name,digest] of Object.entries(checks))assert.equal(sha(fs.readFileSync(path.join(root,name))),digest);
 const m=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 assert.equal(m.name,'Mounty-tool');assert.equal(m.version,'0.5.0');assert.equal(m.id,'omarchy-writing');assert.equal(m.minAppVersion,'1.5.0');
 assert.ok(m.description.length<=250 && m.description.endsWith('.'));
});
