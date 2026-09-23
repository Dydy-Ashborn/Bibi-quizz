const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let active = false, raf = 0, last = 0, width = 0, height = 0, canvas, ctx, particles = [];
let enabled = true, festive = false, gameChristmas = false;
try { festive = localStorage.getItem('bq.theme') === 'noel'; } catch {}
export const isChristmasTheme = () => festive;
try { enabled = localStorage.getItem('bq.christmas.effects') !== 'off'; } catch {}
const santa = '<svg viewBox="0 0 160 180" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="santaCoat"><stop stop-color="#f87472"/><stop offset="1" stop-color="#ac243d"/></radialGradient></defs><ellipse cx="80" cy="155" rx="58" ry="20" fill="#000" opacity=".18"/><path d="M33 135Q33 91 80 90Q127 91 127 135L120 162H40Z" fill="url(#santaCoat)"/><rect x="35" y="137" width="90" height="13" rx="6" fill="#17273d"/><rect x="70" y="135" width="22" height="18" rx="3" fill="#ffda79"/><rect x="76" y="140" width="10" height="8" fill="#17273d"/><ellipse cx="80" cy="86" rx="39" ry="45" fill="#fff5e2"/><ellipse cx="80" cy="70" rx="30" ry="27" fill="#f5c3a6"/><path d="M43 55Q50 -8 118 28L109 52Z" fill="url(#santaCoat)"/><path d="M43 53Q77 41 115 53" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/><circle cx="119" cy="27" r="11" fill="#fff"/><circle cx="69" cy="69" r="3" fill="#17273d"/><circle cx="91" cy="69" r="3" fill="#17273d"/><ellipse cx="80" cy="80" rx="7" ry="5" fill="#e99386"/><path d="M64 88Q80 101 96 88" fill="none" stroke="#b95956" stroke-width="3" stroke-linecap="round"/><path d="M36 112L21 90M124 112L140 92" stroke="#df5261" stroke-width="17" stroke-linecap="round"/><circle cx="19" cy="85" r="10" fill="#fff5e2"/><circle cx="143" cy="86" r="10" fill="#fff5e2"/></svg>';
function create() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.id = 'christmasSnow';
  canvas.setAttribute('aria-hidden', 'true');
  ctx = canvas.getContext('2d');
  document.body.append(canvas);
  const flyover = document.createElement('div');
  flyover.id = 'christmasFlyover';
  flyover.setAttribute('aria-hidden', 'true');
  flyover.innerHTML = `<svg class="santa-sleigh" viewBox="0 0 650 240" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sleighRed" x2="0" y2="1"><stop stop-color="#ff5b57"/><stop offset="1" stop-color="#980e27"/></linearGradient></defs><path d="M40 194Q165 225 270 170M55 204H245Q285 204 282 175" fill="none" stroke="#ffd578" stroke-width="9" stroke-linecap="round"/><path d="M56 123Q92 166 124 130H228L249 100L270 110L247 182H81Z" fill="url(#sleighRed)" stroke="#ffdb83" stroke-width="5"/><rect x="72" y="95" width="52" height="51" rx="4" fill="#198a52"/><path d="M97 95V145M72 113H124" stroke="#ffe8a4" stroke-width="8"/><g transform="translate(125,-2) scale(.82)">${santa.replace(/<svg[^>]*>|<\/svg>/g,'')}</g><path d="M262 127Q355 130 490 88" fill="none" stroke="#ffd578" stroke-width="3"/><g class="reindeer" fill="#bd8050" stroke="#653a26" stroke-width="5" stroke-linecap="round"><ellipse cx="421" cy="111" rx="48" ry="25"/><path d="M449 105L476 56L494 60L475 120Z"/><ellipse cx="491" cy="60" rx="24" ry="15"/><path d="M476 47L469 14M469 29L452 20M470 22L484 8M496 47L509 17M506 30L521 25M392 126L361 153M410 130L395 165M449 129L478 145M459 118L493 130" fill="none"/><circle cx="508" cy="58" r="7" fill="#ff343d" stroke="none"/><circle cx="493" cy="54" r="3" fill="#151b20" stroke="none"/></g><g fill="#ffe6a1"><path d="M27 100l4 9 10 3-10 4-4 9-3-9-10-4 10-3Z"/><circle cx="20" cy="152" r="3"/><circle cx="6" cy="179" r="3"/></g></svg>`;
  document.body.append(flyover);
  const control = document.createElement('button');
  control.id = 'christmasEffects';
  control.type = 'button';
  control.addEventListener('click', () => {
    enabled = !enabled;
    try { localStorage.setItem('bq.christmas.effects', enabled ? 'on' : 'off'); } catch {}
    sync();
  });
  document.body.append(control);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  resize();
}
function resize() {
  width = innerWidth; height = innerHeight;
  const scale = Math.min(devicePixelRatio || 1, 2);
  canvas.width = width * scale; canvas.height = height * scale;
  ctx?.setTransform(scale, 0, 0, scale, 0, 0);
  particles = Array.from({length:width < 600 ? 55 : 130}, () => ({
    x:Math.random()*width,y:Math.random()*height,r:1+Math.random()*2.5,speed:12+Math.random()*28,phase:Math.random()*6.28
  }));
}
function draw(time) {
  raf = requestAnimationFrame(draw);
  if (time - last < 32) return;
  const dt = Math.min((time-last)/1000, .08); last = time;
  ctx.clearRect(0,0,width,height);
  for (const p of particles) {
    p.y += p.speed*dt; p.x += Math.sin(time/1800+p.phase)*7*dt;
    if (p.y > height+5) { p.y=-5; p.x=Math.random()*width; }
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.6)';ctx.fill();
  }
}
function sync() {
  if (!canvas) return;
  const motion = active && enabled && !reduced.matches;
  document.body.classList.toggle('christmas-still', !motion);
  canvas.hidden = !motion;
  document.querySelector('#christmasFlyover').hidden = !motion;
  const control = document.querySelector('#christmasEffects');
  control.hidden = !active;
  control.textContent = reduced.matches ? 'Animations réduites' : enabled ? '❄ Couper les effets' : '❄ Activer les effets';
  control.disabled = reduced.matches;
  control.setAttribute('aria-pressed', String(motion));
  cancelAnimationFrame(raf); raf = 0;
  if (motion && !document.hidden && ctx) { last=performance.now();raf=requestAnimationFrame(draw); }
}
export function setChristmas(value) {
  gameChristmas = Boolean(value);
  applyTheme();
}
function applyTheme() {
  active = festive || gameChristmas;
  document.body.classList.toggle('theme-noel', festive);
  document.querySelectorAll('[data-theme-switch]').forEach(button => {
    button.textContent = festive ? '☀ Thème classique' : '🎄 Thème Noël';
    button.setAttribute('aria-pressed', String(festive));
  });
  document.body.classList.toggle('is-christmas', active);
  if (active) create();
  sync();
}
document.querySelectorAll('.santa').forEach(node => { node.innerHTML = santa; });

document.querySelectorAll('.gift').forEach(node => {
  node.textContent = '';
  for (const face of ['front','back','left','right','top','bottom']) {
    const part = document.createElement('span');
    part.className = 'gift-face ' + face;
    node.append(part);
  }
});

document.addEventListener('click', event => {
  if (!event.target.closest('[data-theme-switch]')) return;
  festive = !festive;
  try { localStorage.setItem('bq.theme', festive ? 'noel' : 'standard'); } catch {}
  applyTheme();
});
applyTheme();
