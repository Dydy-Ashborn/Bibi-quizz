import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest'));
assert.equal(manifest.display,'standalone');
for(const size of [192,512]) {
 const icon=manifest.icons.find(i=>i.sizes===size+'x'+size && i.purpose==='any');
 const png=fs.readFileSync(icon.src);
 assert.equal(png.readUInt32BE(16),size);
 assert.equal(png.readUInt32BE(20),size);
}
const handlers={}, storage=new Map(), deleted=[];
let online=true, install;
const cache={addAll:async list=>{for(const url of list){assert.ok(fs.existsSync(url==='./'?'index.html':url.split('?')[0])); storage.set(url,{url});}},put:async()=>{}};
const context={
 URL,Response,location:{origin:'https://bibi.test'},
 self:{addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},
 caches:{open:async()=>cache,match:async req=>storage.get(typeof req==='string'?req:req.url),
 keys:async()=>['another-app-cache','bibi-quizz-v1','bibi-quizz-v10'],delete:async key=>deleted.push(key)},
 fetch:async()=>{if(!online)throw Error('offline');return {ok:true,clone:()=>({})};}
};
vm.runInNewContext(fs.readFileSync('sw.js','utf8'),context);
handlers.install({waitUntil:p=>install=p});await install;
assert.ok(storage.has('./js/pwa.js'));
handlers.activate({waitUntil:p=>install=p});await install;
assert.deepEqual(deleted,['bibi-quizz-v1']);
online=false;
async function request(path,mode='navigate'){
 let result;
 handlers.fetch({request:{method:'GET',url:'https://bibi.test'+path,mode},respondWith:p=>result=p});
 return await result;
}
assert.equal((await request('/')).url,'./index.html');
storage.set('https://bibi.test/js/entry.js',{module:true});
assert.equal((await request('/js/entry.js','cors')).module,true);
storage.set('/legal/cgv.html',{legal:true});
assert.equal((await request('/legal/cgv')).legal,true);
assert.equal((await request('/legal/missing')).status,503);
let intercepted=false;
handlers.fetch({request:{method:'GET',url:'https://firebase.test/data'},respondWith:()=>intercepted=true});
assert.equal(intercepted,false);
console.log('✓ PWA : icônes PNG, précache complet, isolation du cache, secours hors ligne, pages légales et exclusion des services externes');
