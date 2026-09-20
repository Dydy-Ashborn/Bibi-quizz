import assert from 'node:assert/strict';
import { retraitConfirme } from '../js/live.js';
const local = {fromCache:true,hasPendingWrites:false};
const pending = {fromCache:false,hasPendingWrites:true};
const server = {fromCache:false,hasPendingWrites:false};
assert.equal(retraitConfirme(false,local),false,'cache incomplet au premier abonnement');
assert.equal(retraitConfirme(false,pending),false,'écriture locale en cours');
assert.equal(retraitConfirme(true,server),false,'joueur confirmé présent');
assert.equal(retraitConfirme(false,server),true,'véritable exclusion confirmée');
assert.equal(retraitConfirme(null,null),false,'erreur réseau');
for(const event of [[false,local],[true,pending],[true,server]]) assert.equal(retraitConfirme(...event),false);
console.log('✓ Inscription : cache initial, écriture en cours, serveur, exclusion et erreur réseau');
let created=0, stopped=0, master;
let resolveResume;
class Param {setValueAtTime(v){this.value=v} linearRampToValueAtTime(){} exponentialRampToValueAtTime(){}}
class Gain {gain=new Param(); connect(){return this} disconnect(){}}
class Audio {
 state='running';currentTime=0;destination={};
 constructor(){Audio.instance=this}
 createGain(){const g=new Gain(); if(!master) master=g;return g}
 createOscillator(){created++;return {frequency:new Param(),connect(g){return g},start(){},stop(){stopped++},disconnect(){}}}
 resume(){return new Promise(resolve=>{resolveResume=()=>{this.state='running';resolve()}})}
}
globalThis.window={AudioContext:Audio,addEventListener(){}};
globalThis.localStorage={getItem(){return null},setItem(){throw new Error('Safari stockage indisponible')}};
const {toggleMute,isMuted,sfx}=await import('../js/util.js');
assert.equal(isMuted(),false);sfx.buzz();assert.equal(created,2);
assert.equal(toggleMute(),false);assert.equal(isMuted(),true);assert.equal(master.gain.value,0);
const before=created;sfx.buzz();sfx.good();assert.equal(created,before);assert.ok(stopped>=4);
assert.equal(toggleMute(),true);assert.equal(isMuted(),false);assert.equal(master.gain.value,1);
sfx.buzz();assert.equal(created,before+2);
Audio.instance.state='suspended';sfx.tap();const pendingCount=created;
toggleMute();resolveResume();await Promise.resolve();assert.equal(created,pendingCount,'aucun son différé après coupure');
console.log('✓ Audio : état/bouton cohérents, mute immédiat, stockage indisponible, reprise Safari sans son retardé');
