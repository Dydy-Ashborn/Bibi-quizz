import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { broadcast, nouveauBroadcast, lettresRevelees, PHASE, INPUT, peutBuzzer, retraitConfirme } from '../js/live.js';

const first = broadcast({seq:1}), second = broadcast({seq:1});
assert.ok(second.at > first.at, 'deux diffusions successives ont une identité distincte');
assert.equal(nouveauBroadcast(first, second), false);
assert.equal(nouveauBroadcast({...second, seq:2}, second), true);
assert.equal(nouveauBroadcast({...second, tour:1}, second), true);
assert.equal(lettresRevelees(80, 10, 20, 1500), 40);
assert.equal(lettresRevelees(80, 10, 20, 10000), 80);

let now = 0, id = 0, unwatchCount = 0;
const intervals = new Map(), timeouts = new Map(), nodes = new Map(), docEvents = new Map(), winEvents = new Map();
function node() { return { hidden:true, textContent:'', innerHTML:'', value:'', disabled:false, dataset:{}, style:{setProperty(){}}, classList:{toggle(){},add(){},remove(){}}, append(){}, replaceChildren(){}, addEventListener(){}, focus(){}, setAttribute(k,v){this[k]=v}, getAttribute(k){return this[k]} }; }
const $ = key => { if(!nodes.has(key)) nodes.set(key,node()); return nodes.get(key); };
let receive, resolveServer;
const document = { hidden:false, addEventListener:(k,f)=>docEvents.set(k,f), removeEventListener:k=>docEvents.delete(k) };
const window = { addEventListener:(k,f)=>winEvents.set(k,f), removeEventListener:k=>winEvents.delete(k) };
const errors=[];
const c = vm.createContext({
 console:{warn:(...x)=>errors.push(x)}, document,window,performance:{now:()=>now}, location:{hash:''},
 setInterval:(f,ms)=>{intervals.set(++id,{f,ms});return id},clearInterval:i=>intervals.delete(i),
 setTimeout:(f,ms)=>{timeouts.set(++id,{f,ms});return id},clearTimeout:i=>timeouts.delete(i),
 $, $$:()=>[], el:()=>node(), icon:()=>node(),iconHtml:()=>'',esc:x=>x,showScreen(){},toast(){},sfx:{},burst(){},initiale:()=>'',ls:{get:()=>null},vibre(){},listeNoms:()=>'',pluriel:(n,t)=>`${n} ${t}`,
 COULEURS:[],BUZZERS:[],RULES:{POINTS_R1:9}, uid:()=> 'me',
 loadGame:(_code,options)=>{assert.equal(options.server,true);return new Promise(r=>resolveServer=r)},
 watchGame:(_code,cb)=>{receive=cb;return ()=>unwatchCount++},watchPlayers:()=>()=>{},watchMyPlayer:()=>()=>{},
 joinGame(){},myPlayer(){},sendBuzz(){},sendInput(){},
 PHASE,INPUT,peutBuzzer,retraitConfirme,nouveauBroadcast,lettresRevelees,juger(){},themeById:{},setChristmas(){},
 revealQuestion:(n,t,count)=>{n.textContent=t.slice(0,count);n.setAttribute('aria-label',n.textContent)}
});
const source=fs.readFileSync(new URL('../js/player.js',import.meta.url),'utf8').replace(/^import[\s\S]*?from ['"][^'"]+['"];\s*/gm,'').replace(/export /g,'');
vm.runInContext(source+'\nthis.test={P,enterPlay,leavePlayer};',c);
c.test.P.code='ABCDE';c.test.P.me={name:'Moi'};c.test.enterPlay();
const base={seq:1,tour:0,inscrits:['me'],qualifies:[],elimines:[],bloques:[],scores:{me:1},manche:'r1',q:{texte:'Une question assez longue ?',depuis:0,cps:10},reponse:{uid:'me',pts:1,r:'Oui'}};
const emit=(patch)=>receive({bc:{...base,...patch}},null,{fromCache:false,hasPendingWrites:false});
for (const uid of ['me',null]) {
 const seq=uid ? 1:3;
 emit({seq,at:seq*100,phase:PHASE.R1_REVEAL,reponse:{uid,pts:uid?1:0,r:'Oui'}});
 assert.equal($('#p-result').hidden,false,'résultat visible');
 emit({seq:seq+1,at:seq*100+1,phase:PHASE.R1_LECTURE});
 assert.equal($('#p-result').hidden,true,'le résultat est masqué dès la question suivante');
 assert.equal($('#p-buzz').hidden,false,'la nouvelle question est visible');
 assert.equal($('#btnBuzz').disabled,false,'le buzzer est réactivé');
}
now=1500;
for(const t of [...intervals.values()]) if(t.ms<1000)t.f();
assert.equal($('#pBuzzQ').textContent.length,15,'une minuterie suspendue rattrape les lettres');
emit({seq:4,at:302,phase:PHASE.R1_LECTURE,q:{...base.q,depuis:20}});
assert.equal($('#pBuzzQ').textContent.length,20,'rattrapage via point de synchronisation du maître');
// La récupération au premier plan ne doit pas écraser une question reçue entre-temps.
winEvents.get('pageshow')();
emit({seq:5,at:400,phase:PHASE.R1_LECTURE});
resolveServer({bc:{...base,seq:4,at:302,phase:PHASE.R1_REVEAL}});await new Promise(setImmediate);
assert.equal(c.test.P.bc.seq,5);assert.equal($('#p-result').hidden,true);
// Flux interrompu : recréation effective de l'abonnement.
receive(null,new Error('connexion'));
const retry=[...timeouts.values()].find(t=>t.ms===2000);assert.ok(retry);retry.f();assert.ok(unwatchCount>0);
// Résultat resté affiché : le filet serveur récupère la question manquée.
emit({seq:5,at:401,phase:PHASE.R1_REVEAL});
await new Promise(setImmediate);winEvents.get('online')();
resolveServer({bc:{...base,seq:6,at:500,phase:PHASE.R1_LECTURE}});await new Promise(setImmediate);
assert.equal(c.test.P.bc.seq,6);assert.equal($('#p-result').hidden,true);
// Nettoyage et protection contre une réponse serveur d'une ancienne session.
await new Promise(setImmediate);winEvents.get('pageshow')();
c.test.leavePlayer();resolveServer({bc:{...base,seq:9,at:900,phase:PHASE.R1_LECTURE}});await new Promise(setImmediate);
assert.equal(c.test.P.bc,null);assert.equal(intervals.size,0);assert.equal(docEvents.size,0);assert.equal(winEvents.size,0);
assert.deepEqual(errors,[]);
console.log('✓ Multi : résultat juste/faux → question, buzzer réactivé, minuteries retardées, checkpoints, reprise réseau/veille, ancien état ignoré et nettoyage.');
