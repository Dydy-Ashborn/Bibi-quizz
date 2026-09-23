import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { CHRISTMAS_POOL, CHRISTMAS_COUNT } from '../js/data/christmas.js';
import { BUZZ, THEMES, FAF, byId, themeById, fafById } from '../js/data/questions.js';
import { tirerSoiree, juger } from '../js/game.js';
import { eventOptions } from '../js/event-config.js';
assert.equal(CHRISTMAS_COUNT,128);
const ids=[...CHRISTMAS_POOL.buzz,...CHRISTMAS_POOL.themes,...CHRISTMAS_POOL.faf].map(q=>q.id);
assert.equal(new Set(ids).size,ids.length);
const normalIds=new Set([...BUZZ,...THEMES,...FAF].map(q=>q.id));
for(const id of ids) assert.ok(!normalIds.has(id));
for(const t of CHRISTMAS_POOL.themes) assert.equal(t.questions.length,14);
for(const q of [...CHRISTMAS_POOL.buzz,...CHRISTMAS_POOL.themes.flatMap(t=>t.questions),...CHRISTMAS_POOL.faf]){
 assert.ok(q.r?.trim());assert.ok(juger(q.r,q),q.id);
 for(const a of q.alt||[])assert.ok(juger(a,q),q.id+' '+a);
 if(q.indices)assert.equal(q.indices.length,4);else assert.ok(q.q.endsWith('?'));
}
for(let i=0;i<30;i++){
 const draw=tirerSoiree({ton:'mix',pools:CHRISTMAS_POOL});
 for(const [key,lookup] of [['r1',byId],['r2',themeById],['faf',fafById]]){
  assert.ok(draw[key].length);
  for(const id of draw[key])assert.ok(ids.includes(id)&&lookup[id],id);
 }
}
assert.deepEqual(eventOptions({event:'noel',answerSeconds:20,roundSeconds:90}),{event:'noel',answerSeconds:20,roundSeconds:90});
assert.throws(()=>eventOptions({event:'noel',answerSeconds:0}));
assert.throws(()=>eventOptions({event:'unknown'}));
assert.equal(eventOptions({}).event,'standard');
// Exercer le véritable garde du plan sans appeler Firebase.
let paid=false;
let source=fs.readFileSync('js/plan.js','utf8').replace(/^import .*;\n/gm,'').replace(/export /g,'');
source+='\nglobalThis.testPlan={guard,pools,refreshPremium};';
const context={CHRISTMAS_POOL,BUZZ,THEMES,FAF,DISCOVERY:{},RULES:{MAX_JOUEURS:8},ls:{set(){}},db:{},uid:()=> 'test',doc:()=>({}),getDoc:async()=>({exists:()=>true,data:()=>({premium:paid})}),console};
vm.runInNewContext(source,context);
assert.equal(context.testPlan.guard('event','noel').ok,false);
assert.throws(()=>context.testPlan.pools('noel'));
paid=true;await context.testPlan.refreshPremium();
assert.equal(context.testPlan.guard('event','noel').ok,true);
assert.equal(context.testPlan.pools('noel'),CHRISTMAS_POOL);
assert.equal(context.testPlan.pools().buzz,BUZZ);
console.log('✓ Noël : 128 entrées, variantes, 3 manches sans mélange, réglages valides et accès réservé à la version complète');
