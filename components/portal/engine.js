/* eslint-disable */
/**
 * Jood patient portal engine.
 *
 * Ported from the approved v4 prototype (Jood_Patient_Portal_v4.html) so the
 * portal matches the design exactly: the views are the prototype's string
 * templates, rendered into the React-owned shell in PortalApp.tsx. The demo
 * seed, pharmacy simulator and device preview are gone; state comes from the
 * server (lib/portal/data.ts) and every change is saved through /api/portal/*.
 */
import { LOGO } from "./logo";

export function mountPortal(root, initial) {
const $ = (id) => root.querySelector('[data-jp="' + id + '"]');
const disposers = [];
/* ================= Constants & catalogue ================= */
const WA = 'https://wa.me/447756099075';
const TRUST = { gphc:'9012990', spc:'Zahhaad Khalil (2228969)', tp:'4.4', reviews:'67' };
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_L = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ICS_DAY = ['SU','MO','TU','WE','TH','FR','SA'];

const SVC = initial.catalogue;
const SVC_KEYS = ['wl','ed','pd'];
const STATUS = ['booked','clinical','todispatch','dispatched','delivered'];
const STATUS_L = { booked:'Consultation booked', clinical:'Clinical check', todispatch:'To dispatch', dispatched:'Dispatched', delivered:'Delivered', rejected:'Not approved', cancelled:'Cancelled' };
const STATUS_P = { booked:'p-info', clinical:'p-info', todispatch:'p-warn', dispatched:'p-ok', delivered:'p-grey', rejected:'p-err', cancelled:'p-grey' };
const SITES = ['Stomach, left','Stomach, right','Thigh, left','Thigh, right','Upper arm, left','Upper arm, right'];
const EFFECTS = ['Nausea','Constipation','Diarrhoea','Headache','Tiredness','Reflux','Injection-site redness'];
const ED_EFFECTS = ['Headache','Flushing','Blocked nose','Indigestion','Back ache','Dizziness'];
const PRESCRIBER = 'your Jood prescriber';

const FAQS = [
  { cat:'Treatment', q:'How does my treatment work?', a:'You complete an online consultation, a UK prescriber reviews it, and if treatment is suitable our GPhC-registered pharmacy dispenses it and sends it to you.' },
  { cat:'Treatment', q:'What if I miss a dose?', a:"Message our clinical team on WhatsApp, any time. For weekly pens: if it is within 4 days of your usual day, take it; if it is longer, skip it and carry on as normal. Never take two doses together." },
  { cat:'Treatment', q:'How do I report a side effect?', a:'Tell us in your check-in or message the clinical team. You can also report it to the MHRA Yellow Card scheme at yellowcard.mhra.gov.uk.' },
  { cat:'Treatment', q:'Can I switch medicine?', a:'Yes. Open Treatment and choose Switch treatment. A prescriber reviews the request before anything changes.' },
  { cat:'Orders & delivery', q:'What do the order statuses mean?', a:'Consultation booked: we have your answers. Clinical check: a prescriber is reviewing them. To dispatch: approved and being packed. Dispatched: with DPD, with your tracking number. Delivered: at your door.' },
  { cat:'Orders & delivery', q:'How quickly will my order arrive?', a:'Once approved, our pharmacy dispatches it with DPD next-day delivery. DPD texts you a 1-hour window on the day.' },
  { cat:'Orders & delivery', q:'Is the packaging discreet?', a:"Yes. Plain, unbranded box, with nothing on the outside to say what's inside." },
  { cat:'Your account', q:'How do reminders reach my phone?', a:'Add them to your phone calendar from Reminders (works on iPhone and Android) and switch on notifications for this device.' },
  { cat:'Your account', q:'Will my GP be told?', a:'Only if you ask us to. Turn on GP sharing in Account and our clinical team will share a summary with your GP practice.' },
];
const ARTICLES = {
  wl:['Building a plate that keeps you full','Movement that complements your treatment','Eating out without derailing your progress','Managing nausea in the first weeks'],
  ed:['Choosing the right ED treatment','Getting the best from your tablets','Talking to your partner about ED'],
  pd:['When to start your period delay tablets','What to expect after your last tablet','Travelling with period delay tablets'],
};

/* ================= Helpers ================= */
const pad = n => String(n).padStart(2,'0');
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const iso = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse = s => { const [y,m,d] = String(s).slice(0,10).split('-').map(Number); return new Date(y,m-1,d); };
const addDays = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const dayDiff = (a,b) => Math.round((parse(iso(a instanceof Date?a:parse(a))) - parse(iso(b instanceof Date?b:parse(b))))/864e5);
const fmtD = (s, wd) => { const d = s instanceof Date ? s : parse(s); return (wd ? DAYS[d.getDay()]+' ' : '') + d.getDate()+' '+MON[d.getMonth()]; };
const fmtDY = s => { const d = s instanceof Date ? s : parse(s); return d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear(); };
const nowStamp = () => { const d = new Date(); return iso(d)+'T'+pad(d.getHours())+':'+pad(d.getMinutes()); };
const fmtWhen = s => { if(!s) return ''; const d = parse(s); const t = String(s).slice(11,16); const diff = dayDiff(today(), d); const day = diff===0?'Today':diff===1?'Yesterday':fmtD(d,true); return t ? day+', '+t : day; };
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => '£'+Number(n).toFixed(2);
const uid = () => Math.random().toString(36).slice(2,9);
const fmtW = (w,u) => { if(u==='st'){ const lb = Math.round(w*2.20462); return Math.floor(lb/14)+' st '+(lb%14)+' lb'; } return (Math.round(w*10)/10).toFixed(1)+' kg'; };
const fmtDiff = (d,u) => u==='st' ? Math.round(Math.abs(d)*2.20462)+' lb' : (Math.round(Math.abs(d)*10)/10).toFixed(1)+' kg';
const bmiOf = (w,hcm) => hcm>0 ? w/((hcm/100)**2) : NaN;
const bmiFmt = (w) => { const b = bmiOf(w, S.user.heightCm); return isFinite(b) ? b.toFixed(1) : '–'; };
const prodOf = (svc,id) => SVC[svc].products.find(p=>p.id===id);
const strOf = (svc,id,s) => prodOf(svc,id).strengths.find(x=>x.s===s);
const greet = () => { const h = new Date().getHours(); return h<12?'Good morning':h<18?'Good afternoon':'Good evening'; };
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
const isAndroid = () => /Android/i.test(navigator.userAgent);

const fmtTrack = t => String(t||'').replace(/^(\d{4})(\d{4})(\d{4})(\d{2})$/, '$1 $2 $3 $4');

/* ================= State ================= */
let S;
let saveT;
// Fields the patient owns and we keep in portal_prefs. Orders, weigh-ins,
// check-ins and messages have their own tables and API routes.
const PREF_KEYS = ['svc','unit','discreet','twoFA','safePlace','gpShare','gp','goal','waist','hips','start','wl','ed','pd','reminders','channels','fired','ms5','ms10','ms15','heightCm'];
function prefsOf(){
  const o = {}; PREF_KEYS.forEach(k=>{ if(k==='heightCm') o.heightCm = S.user.heightCm || null; else o[k] = S[k]; });
  o.activity = S.activity.filter(x=>x.local).slice(0,300);
  o.localNotifs = S.notifs.filter(n=>n.local).slice(0,60);
  o.readNotifs = S.notifs.filter(n=>n.read).map(n=>n.id).slice(0,300);
  return o;
}
function save(){
  clearTimeout(saveT);
  saveT = setTimeout(()=>{ api('PUT','/api/portal/state', prefsOf()).catch(()=>say("We couldn't save that. Check your connection.")); }, 600);
}
async function api(method, url, body){
  const res = await fetch(url, { method, headers:{ 'Content-Type':'application/json' }, credentials:'include', body: body===undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(()=>({}));
  if(res.status===401 && data.signedOut){ location.href = initial.links.login + '?next=' + encodeURIComponent(location.pathname); throw new Error('Please log in again'); }
  if(!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong'), { data });
  return data;
}
// persist=false for events the server already records (weigh-ins, check-ins, messages).
function log(svc, icon, text, persist){ S.activity.unshift({ at:nowStamp(), svc, icon, text, local: persist!==false }); }
function notify(svc, text, opts){
  S.notifs.unshift({ id:'l-'+uid(), at:nowStamp(), svc, text, read:false, local:true });
  if(!(opts && opts.silent)) devicePush('Jood', text);
}

/* ================= Domain ================= */
function ordersOf(svc){ return S.orders.filter(o=>o.svc===svc).sort((a,b)=> a.createdAt < b.createdAt ? 1 : -1); }
const approved = o => STATUS.indexOf(o.status) >= 2;
function svcState(svc){
  const os = ordersOf(svc);
  const latest = os[0] || null;
  const ok = os.filter(approved);
  const rx = ok[0] || null;                                     // current prescription
  const delivered = os.filter(o=>o.status==='delivered');
  const inFlight = os.find(o=>['booked','clinical','todispatch','dispatched'].includes(o.status)) || null;
  let mode = 'new';
  if(rx) mode = 'active'; else if(latest && latest.status==='rejected') mode = 'declined'; else if(latest && latest.status!=='cancelled') mode = 'review';
  return { os, latest, rx, delivered, inFlight, mode, prod: rx ? prodOf(svc, rx.pid) : null };
}
function svcLine(svc){
  const st = svcState(svc);
  if(st.mode==='new') return 'Not started · from '+SVC[svc].from;
  if(st.mode==='declined') return 'Not approved · talk to us';
  if(st.mode==='review') return STATUS_L[st.latest.status];
  if(st.inFlight) return st.prod.name+' · '+STATUS_L[st.inFlight.status].toLowerCase();
  if(svc==='pd'){ const c = pdCourse(); return c ? 'Course in progress' : 'Ready when you are'; }
  return st.prod.name+' '+st.rx.s;
}
/* weight loss */
function wlInfo(){
  const st = svcState('wl'); if(!st.rx) return null;
  const pens = st.delivered.reduce((a,o)=>a+o.q,0);
  const used = S.wl.doses.length;
  const left = Math.max(0, pens - used);
  const prod = st.prod; const weekly = prod.freq==='weekly';
  const todayIso = iso(today());
  const takenToday = S.wl.doses.some(x=>x.d===todayIso);
  const due = weekly ? today().getDay()===S.wl.doseDay : true;
  let next = today(); if(weekly){ let g=0; while((next.getDay()!==S.wl.doseDay || (iso(next)===todayIso && takenToday)) && g++<8) next = addDays(next,1); } else if(takenToday) next = addDays(next,1);
  const first = S.wl.doses.length ? S.wl.doses.map(x=>x.d).sort()[0] : (st.delivered[0]? st.delivered[st.delivered.length-1].history.slice(-1)[0].at.slice(0,10) : todayIso);
  const week = Math.max(1, Math.floor(dayDiff(today(), first)/7)+1);
  const curStrength = (st.delivered[0]||st.rx).s;
  const lastSite = S.wl.doses.length ? S.wl.doses[S.wl.doses.length-1].site : null;
  const nextSite = lastSite ? SITES[(SITES.indexOf(lastSite)+1)%SITES.length] : SITES[0];
  return { st, prod, pens, used, left, weekly, takenToday, due, next, week, curStrength, nextSite };
}
function wsSorted(){ return S.weights.slice().sort((a,b)=>a.d<b.d?-1:1); }
function weighedThisWeek(){ const ws = wsSorted(); return ws.length && dayDiff(today(), ws[ws.length-1].d) < 6; }
function checkinThisWeek(){ return S.checkins.length && dayDiff(today(), S.checkins[0].at) < 6; }
/* ED */
function edInfo(){
  const st = svcState('ed'); if(!st.rx) return null;
  const got = st.delivered.reduce((a,o)=>a+o.q,0);
  const left = Math.max(0, got - S.ed.uses.length);
  const last = S.ed.uses.length ? S.ed.uses.slice().sort((a,b)=>a.at<b.at?1:-1)[0] : null;
  const lastProd = last ? prodOf('ed', last.pid) : st.prod;
  const hoursSince = last ? (Date.now() - new Date(last.at).getTime())/36e5 : 999;
  const inWindow = last && hoursSince < lastProd.window;
  const rated = S.ed.uses.filter(u=>u.rating);
  const avg = rated.length ? rated.reduce((a,u)=>a+u.rating,0)/rated.length : 0;
  const month = S.ed.uses.filter(u=>dayDiff(today(), u.at) < 30).length;
  return { st, got, left, last, lastProd, hoursSince, inWindow, avg, month };
}
/* PD */
function pdStock(){ const st = svcState('pd'); const got = st.delivered.reduce((a,o)=>a+o.q,0); const used = S.pd.courses.reduce((a,c)=>a+c.tablets,0) + pdTakenCount(); return Math.max(0, got-used); }
function pdTakenCount(){ return Object.values(S.pd.taken).reduce((a,arr)=>a+arr.filter(Boolean).length,0); }
function pdCourse(){ const p = S.pd.plan; if(!p) return null; const start = iso(addDays(parse(p.due),-3)); const days = dayDiff(p.end, start)+1; return { ...p, start, days, tablets:days*3 }; }

/* ================= Reminder engine & device ================= */
function remDue(r, date){ if(r.date) return r.date===iso(date); if(r.from && iso(date)<r.from) return false; if(r.until && iso(date)>r.until) return false; return r.days.includes(date.getDay()); }
function devicePush(title, body){
  try{ if('Notification' in window && Notification.permission==='granted' && S.channels.push){ new Notification(title, { body, tag:'jood-'+uid() }); return true; } }catch(e){}
  return false;
}
function tick(){
  if(!S) return;
  const n = new Date(), hm = pad(n.getHours())+':'+pad(n.getMinutes()), k = iso(n);
  let changed = false;
  S.reminders.filter(r=>r.on && r.time===hm && remDue(r,n)).forEach(r=>{
    const key = r.id+'@'+k+'T'+hm; if(S.fired[key]) return; S.fired[key]=1; changed = true;
    const t = S.discreet ? 'Jood reminder' : 'Jood: '+r.title;
    devicePush(t, S.discreet ? 'You have something due in your Jood portal.' : r.title);
    S.notifs.unshift({ id:uid(), at:nowStamp(), svc:r.svc, text:'Reminder: '+r.title, read:false });
    say('Reminder: '+r.title);
  });
  if(changed){ save(); render(); }
}
const tickT = setInterval(tick, 15000); disposers.push(()=>clearInterval(tickT));

function icsFor(list){
  const T = today(), stamp = new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Jood Ltd//Patient Portal//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Jood reminders'];
  list.forEach(r=>{
    let start = r.date ? parse(r.date) : (r.from && r.from>iso(T) ? parse(r.from) : T);
    if(!r.date){ let g=0; while(!r.days.includes(start.getDay()) && g++<8) start = addDays(start,1); }
    const [h,m] = r.time.split(':');
    const dt = iso(start).replace(/-/g,'')+'T'+h+m+'00';
    const title = S.discreet ? 'Jood reminder' : 'Jood: '+r.title;
    lines.push('BEGIN:VEVENT','UID:'+r.id+'@joodlife.com','DTSTAMP:'+stamp,'DTSTART:'+dt,'DURATION:PT10M','SUMMARY:'+title,'DESCRIPTION:'+(S.discreet?'Open your Jood portal: joodlife.com/login':r.title+' · joodlife.com/login'));
    if(!r.date){ const days = r.days.length===7 ? 'FREQ=DAILY' : 'FREQ=WEEKLY;BYDAY='+r.days.map(x=>ICS_DAY[x]).join(','); lines.push('RRULE:'+days+(r.until?';UNTIL='+r.until.replace(/-/g,'')+'T235959':'')); }
    lines.push('BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:PT0M','DESCRIPTION:'+title,'END:VALARM','END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
function gcalLink(r){
  let start = r.date ? parse(r.date) : today(); if(!r.date){ let g=0; while(!r.days.includes(start.getDay()) && g++<8) start = addDays(start,1); }
  const [h,m] = r.time.split(':'); const s = iso(start).replace(/-/g,'')+'T'+h+m+'00';
  const e = new Date(start); e.setHours(+h, +m+10); const ee = iso(e).replace(/-/g,'')+'T'+pad(e.getHours())+pad(e.getMinutes())+'00';
  const title = S.discreet ? 'Jood reminder' : 'Jood: '+r.title;
  let u = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(title)+'&dates='+s+'/'+ee+'&details='+encodeURIComponent('joodlife.com/login');
  if(!r.date) u += '&recur='+encodeURIComponent('RRULE:'+(r.days.length===7?'FREQ=DAILY':'FREQ=WEEKLY;BYDAY='+r.days.map(x=>ICS_DAY[x]).join(','))+(r.until?';UNTIL='+r.until.replace(/-/g,''):''));
  return u;
}
function download(name, content, type){
  const blob = new Blob([content], { type: type||'text/plain' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 800);
}
function docHtml(title, body){
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font:15px/1.5 system-ui,sans-serif;color:#142e2a;max-width:720px;margin:40px auto;padding:0 20px}h1{font-size:24px}table{width:100%;border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #dfe5da;text-align:left}.m{color:#55706a;font-size:13px}</style></head><body><p><b>Jood</b> · Jood Pharmacy, GPhC ${TRUST.gphc}</p><h1>${esc(title)}</h1>${body}<p class="m">Superintendent Pharmacist: ${TRUST.spc}. Powered by Jood Pharmacy, a GPhC-registered pharmacy operating under Jood Ltd. Generated ${fmtDY(today())}.</p></body></html>`;
}

/* ================= Icons (all 24px grid, rendered at fixed sizes) ================= */
const P = {
  eye:'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff:'M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.5M6.6 6.6A17.4 17.4 0 0 0 2 12s3.5 7 10 7a9.9 9.9 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2',
  home:'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  pill:'M10.5 20.5a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 7zM8.5 8.5l7 7',
  box:'M21 8l-9-4-9 4 9 4 9-4zM3 8v8l9 4 9-4V8M12 12v8',
  bell:'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
  chat:'M4 5h16v11H9l-5 4z',
  user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  help:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5M12 17h.01',
  chart:'M3 20h18M5 16l4-5 4 3 6-8',
  cal:'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  plus:'M12 5v14M5 12h14',
  tick:'M5 13l4 4L19 7',
  x:'M6 6l12 12M18 6L6 18',
  chev:'M9 6l6 6-6 6',
  back:'M15 6l-6 6 6 6',
  down:'M12 4v12m-5-5 5 5 5-5M4 20h16',
  trash:'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  mail:'M3 5h18v14H3zM3 7l9 6 9-6',
  phone:'M7 3h10v18H7zM11 18h2',
  list:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  swap:'M7 4L3 8l4 4M3 8h14M17 12l4 4-4 4M21 16H7',
  truck:'M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  shield:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  scale:'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 9h8M12 9v3',
  out:'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11',
  edit:'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  lock:'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  clip:'M9 4h6v3H9zM7 5H5v16h14V5h-2M8 12h8M8 16h5',
  copy:'M9 9h11v11H9zM5 15V4h11',
  ext:'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  heart:'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z',
  drop:'M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z',
  gift:'M4 11h16v10H4zM3 7h18v4H3zM12 7v14M12 7S10 3 8 4s0 3 4 3c4 0 6-2 4-3s-4 3-4 3',
  video:'M3 7h12v10H3zM15 10l6-3v10l-6-3',
  id:'M3 5h18v14H3zM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5 16a3 3 0 0 1 6 0M14 9h4M14 13h4',
  star:'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  alert:'M12 3l10 18H2zM12 10v5M12 18h.01',
  info:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7h.01',
  monitor:'M3 4h18v12H3zM8 20h8M12 16v4',
  sim:'M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01',
};
function ic(n, size, extra){ const s = size||20; const fill = n==='wa'; 
  if(n==='wa') return `<svg class="ic" width="${s}" height="${s}" style="width:${s}px;height:${s}px" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.2a.4.4 0 0 0 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11 11 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2 2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3z"/></svg>`;
  return `<svg class="ic" width="${s}" height="${s}" style="width:${s}px;height:${s}px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${extra||1.8}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n]||P.info}"/></svg>`; }

/* ================= Small components ================= */
const pill = (cls, t, icon) => `<span class="pill ${cls}">${icon?ic(icon,13):''}${t}</span>`;
const sw = (on, act, arg) => `<button class="switch ${on?'on':''}" role="switch" aria-checked="${!!on}" data-act="${act}" data-arg="${esc(arg||'')}"></button>`;
const btn = (cls, label, act, arg, icon, extra) => `<button class="btn ${cls}" data-act="${act}" data-arg="${esc(arg==null?'':arg)}" ${extra||''}>${icon?ic(icon,18):''}${label}</button>`;
const statusPill = s => pill(STATUS_P[s]||'p-grey', STATUS_L[s]||s);
function trustStrip(){
  return `<div class="trust"><span>${ic('shield',15)}<b>GPhC registered pharmacy</b> ${TRUST.gphc}</span><span><b>Superintendent pharmacist</b> ${TRUST.spc}</span><span>${ic('tick',15)}MHRA-licensed medicines</span><span><span class="stars">★★★★★</span><b>${TRUST.tp}/5</b> Trustpilot</span><span>${ic('lock',15)}LegitScript certified</span></div>`;
}
function stepper(o){
  const isRej = o.status==='rejected', isCan = o.status==='cancelled';
  const names = isRej ? ['booked','clinical','rejected'] : STATUS;
  const cur = isRej ? 2 : STATUS.indexOf(o.status);
  const at = s => { const h = o.history.find(x=>x.s===s); return h ? fmtWhen(h.at) : ''; };
  const cls = (s,i) => isRej && s==='rejected' ? 'fail' : isCan ? 'todo' : i<cur || (i===cur && s==='delivered') ? 'done' : i===cur ? 'now' : 'todo';
  const cols = `grid-template-columns:repeat(${names.length},1fr)`;
  return `<div class="steps"><div class="bars" style="${cols}">${names.map((s,i)=>`<i class="${cls(s,i)}"></i>`).join('')}</div>
    <div class="lbls" style="${cols}">${names.map((s,i)=>`<div class="${cls(s,i)}"><b>${STATUS_L[s]}</b><span>${at(s)||(cls(s,i)==='todo'?'':'In progress')}</span></div>`).join('')}</div></div>`;
}
function statusCopy(o){
  const p = prodOf(o.svc,o.pid), re = o.kind!=='Consultation';
  switch(o.status){
    case 'booked': return re ? `We have your ${o.kind.toLowerCase()} request. A prescriber will pick it up shortly.` : 'We have your consultation. A UK prescriber will pick it up shortly.';
    case 'clinical': return 'A UK prescriber is reviewing your answers. Usually within a few hours, always within 24.';
    case 'todispatch': return `Approved by ${o.prescriber||PRESCRIBER}. Our pharmacy is packing your ${p.name}.`;
    case 'dispatched': return `With DPD. Expected ${fmtD(o.eta,true)}. DPD will text a 1-hour window on the morning of delivery.`;
    case 'delivered': { const h = o.history.find(x=>x.s==='delivered'); return 'Delivered '+fmtWhen(h.at)+'. Plain, unbranded box.'; }
    case 'rejected': return o.note || 'Your prescriber could not approve this. You have not been charged.';
    case 'cancelled': return 'Cancelled. You have not been charged.';
  }
  return '';
}
function trackUrl(o){ return 'https://www.dpd.co.uk/apps/tracking/?reference='+o.tracking+'&postcode='+encodeURIComponent(S.address.postcode.replace(/\s/g,''))+'#results'; }
function orderCard(o, compact){
  const p = prodOf(o.svc,o.pid);
  return `<section class="card" data-svc="${o.svc}">
    <div class="card-h"><div><div class="row" style="gap:8px"><span class="dot ${o.svc}"></span><h3>${esc(p.name)} ${esc(o.s)}</h3></div><p class="sub">${o.id} · ${o.kind} · ${esc(o.label)} · ${money(o.price)}</p></div>${statusPill(o.status)}</div>
    ${stepper(o)}
    <p class="small" style="margin-top:12px">${esc(statusCopy(o))}</p>
    ${o.tracking?`<div class="track" style="margin-top:12px">${ic('truck',20)}<div style="flex:1;min-width:0"><div class="tiny muted">DPD tracking number</div><code>${fmtTrack(o.tracking)}</code></div><button class="btn ghost sm" data-act="copy" data-arg="${o.tracking}">${ic('copy',16)}Copy</button><a class="btn primary sm" href="${trackUrl(o)}" target="_blank" rel="noopener">Track${ic('ext',16)}</a></div>`:''}
    ${compact?`<div class="row" style="margin-top:12px">${btn('ghost sm','Order details','go','orders')}</div>`:
      `<div class="row" style="margin-top:12px">
                ${o.status==='dispatched'?btn('ghost sm',S.safePlace?'Safe place: '+esc(S.safePlace):'Add safe place','safePlace','',null):''}
        ${o.status==='dispatched'?`<a class="btn ghost sm" href="https://www.dpd.co.uk/content/how-can-we-help/index.jsp" target="_blank" rel="noopener">Change delivery in myDPD</a>`:''}
        ${o.status!=='cancelled'?btn('ghost sm','Invoice','doc','invoice:'+o.id,'down'):''}
        ${approved(o)?btn('ghost sm','Prescription','doc','rx:'+o.id,'down'):''}
        ${o.status==='rejected'?`<a class="btn wa sm" href="${WA}" target="_blank" rel="noopener">${ic('wa',16)}Talk to us</a>`:''}
      </div>`}
  </section>`;
}
function chartSvg(points, goal, id){
  const W=600, H=190, pT=12, pB=10;
  if(!points.length) return '<p class="muted small">No entries yet.</p>';
  const vals = points.map(p=>p.v).concat(goal!=null?[goal]:[]);
  let hi = Math.ceil(Math.max(...vals)+.5), lo = Math.floor(Math.min(...vals)-.5); if(hi-lo<2){hi++;lo--;}
  const n = points.length, x = i => n===1 ? W/2 : 8 + i*((W-16)/(n-1)), y = v => pT + (hi-v)/(hi-lo)*(H-pT-pB);
  const line = points.map((p,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(p.v).toFixed(1)).join(' ');
  const area = line+` L${x(n-1).toFixed(1)} ${H-pB} L${x(0).toFixed(1)} ${H-pB} Z`;
  const xl = n<=4 ? points.map(p=>p.l) : [points[0].l, points[Math.floor((n-1)/2)].l, points[n-1].l];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Chart"><defs><linearGradient id="g${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--acc)" stop-opacity=".22"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#g${id})"/>${goal!=null?`<line x1="0" x2="${W}" y1="${y(goal).toFixed(1)}" y2="${y(goal).toFixed(1)}" stroke="#2a4a44" stroke-dasharray="6 6" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`:''}
    <path d="${line}" fill="none" stroke="var(--acc)" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>
    ${points.map((p,i)=>`<circle cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="4" fill="#fff" stroke="var(--acc)" stroke-width="2.5" vector-effect="non-scaling-stroke"/>`).join('')}</svg>
    <div class="xl">${xl.map(l=>`<span>${esc(l)}</span>`).join('')}</div>`;
}
function svcSwitch(){
  return `<div class="svc-switch" role="tablist" aria-label="Your services">${SVC_KEYS.map(k=>`<button class="svc-tab ${S.svc===k?'on':''}" data-svc="${k}" role="tab" aria-selected="${S.svc===k}" data-act="svc" data-arg="${k}"><span class="nm"><span class="dot ${k}"></span><span class="lg">${SVC[k].name}</span><span class="sh">${k==='ed'?'ED':SVC[k].name}</span></span><span class="st">${esc(svcLine(k))}</span></button>`).join('')}</div>`;
}
function startCard(svc){
  const s = SVC[svc];
  const blurb = { wl:'Clinician-led weight loss treatment, with a UK prescriber, weekly check-ins and free next-day delivery.',
                  ed:'Treatment for erectile dysfunction, prescribed online by a UK clinician and sent in plain packaging.',
                  pd:'Prescription tablets to delay your period for holidays, events or exams. We work out exactly when to start.' }[svc];
  return `<section class="card tint"><div class="row" style="align-items:flex-start;gap:14px"><span class="ico-box">${ic(svc==='wl'?'scale':svc==='ed'?'heart':'cal')}</span><div style="flex:1;min-width:220px"><h3>Start ${s.name.toLowerCase()} treatment</h3><p class="small muted" style="margin:4px 0 12px">${blurb}</p>
    <div class="row">${btn('primary','Start free consultation','startFlow',svc)}<span class="small muted">About 3 minutes · from ${s.from}</span></div></div></div></section>`;
}

/* ================= Home ================= */
function nextStep(svc){
  const st = svcState(svc);
  const n = (t,b,l,act,arg) => ({ t,b,l,act,arg });
  if(st.mode==='new') return n(`Start your ${SVC[svc].name.toLowerCase()} consultation`, 'Three minutes, free, reviewed by a UK prescriber. Pay only if you are approved.', 'Start consultation','startFlow',svc);
  if(st.mode==='declined') return n("We couldn't approve this treatment", 'Your prescriber left a note. Our clinical team can talk you through other options.', 'See the note','go','orders');
  if(st.mode==='review') return n(st.latest.status==='booked'?'Consultation received':'Your prescriber is reviewing your answers', statusCopy(st.latest), 'View status','go','orders');
  if(svc==='wl'){ const w = wlInfo();
    if(w.due && !w.takenToday && w.left>0) return n(w.weekly?'Take your dose today':"Take today's tablet", `${w.prod.name} ${w.curStrength} · suggested site: ${w.nextSite.toLowerCase()}.`, 'Log dose','logDose','');
    if(!weighedThisWeek()) return n("Log this week's weigh-in", 'Same scales, same time of day. It updates your chart and your prescriber sees it.', 'Add weight','goTab','wl:progress');
    if(!checkinThisWeek()) return n('Your weekly check-in is due', 'About a minute. Your prescriber reads every answer before your next order.', 'Start check-in','goTab','wl:checkin');
    if(st.inFlight) return n(STATUS_L[st.inFlight.status]+': '+st.inFlight.id, statusCopy(st.inFlight), 'Track order','go','orders');
    if(w.left<=1) return n('Running low: reorder now', `${w.left} ${w.weekly?'pen dose':'tablet'} left. Reorder now so there is no gap in treatment.`, 'Reorder','reorder','wl');
  }
  if(svc==='ed'){ const e = edInfo();
    if(st.inFlight) return n(STATUS_L[st.inFlight.status]+': '+st.inFlight.id, statusCopy(st.inFlight), 'Track order','go','orders');
    if(e.left<=2) return n(e.left?`Only ${e.left} tablet${e.left>1?'s':''} left`:'You have run out', 'Reorder in two taps. Your prescriber reviews it the same day.', 'Reorder','reorder','ed');
    return n('How did your last tablet work?', 'Logging each use helps your prescriber find the right strength.', 'Log a tablet','logEd','');
  }
  if(svc==='pd'){ const c = pdCourse();
    if(st.inFlight) return n(STATUS_L[st.inFlight.status]+': '+st.inFlight.id, statusCopy(st.inFlight), 'Track order','go','orders');
    if(!c) return n('Planning a holiday or event?', "Tell us when your period is due and we'll work out exactly when to start.", 'Plan my dates','goTab','pd:course');
    const di = dayDiff(today(), c.start);
    if(di<0) return n('Start your tablets '+fmtD(c.start,true), `In ${-di} day${di===-1?'':'s'}. We'll remind you the evening before.`, 'View plan','goTab','pd:course');
    if(di < c.days) return n(`Day ${di+1} of ${c.days}: take today's tablets`, 'One tablet three times a day. Tick each one off as you take it.', 'Tick tablets','goTab','pd:tracker');
  }
  return n("You're all set", "Nothing due right now. We'll remind you when something is.", '', '', '');
}
/* The banner's own next step, plus the main action (Get started / Reorder)
   so it's on the banner in every service tab. Skipped when the next step
   already is that action (Reorder, or Start consultation for a new patient). */
function bannerActions(ns){
  const cta = mainCta();
  const same = ns.act==='reorder' && initial.returning || ns.act==='startFlow' && !initial.returning;
  const main = same ? '' : `<a class="btn ${ns.l?'ghost':'primary'} banner-cta" href="${esc(cta.href)}">${ic(cta.icon,18)}${cta.label}</a>`;
  const step = ns.l ? btn('primary',ns.l,ns.act,ns.arg) : '';
  return step || main ? `<div class="banner-acts">${step}${main}</div>` : '';
}
function viewHome(){
  const svc = S.svc, st = svcState(svc), ns = nextStep(svc);
  let h = `<div class="stack"><div class="page-h"><div><h1>${greet()}, <em class="serif">${esc(S.user.first)}</em></h1><p class="muted">${svc==='wl'&&st.mode==='active'?'Week '+wlInfo().week+' of your weight loss programme':'Everything for your treatment, in one place'}</p></div></div>
    ${svcSwitch()}
    <section class="banner"><div class="txt"><h2>${ns.t}</h2><p class="muted">${esc(ns.b)}</p></div>${bannerActions(ns)}</section>`;
  if(st.mode==='new') h += startCard(svc);
  if(svc==='wl' && st.mode!=='active' && wlTracks()) h += wlProgressOnly();
  if(st.mode==='active'){
    if(svc==='wl') h += homeWl(); else if(svc==='ed') h += homeEd(); else h += homePd();
  }
  if(st.inFlight || st.mode!=='new' && st.latest) h += orderCard(st.inFlight || st.latest, true);
  const t = (S.messages[svc]||[]); const last = t[t.length-1];
  const others = SVC_KEYS.filter(k=>k!==svc && svcState(k).mode==='new');
  h += `<div class="grid g2">
    <section class="card"><div class="card-h"><h3>Messages</h3>${t.length?pill('p-grey',t.length+' messages'):''}</div>${last?`<div class="msg ${last.me?'me':''}"><span class="av">${last.me?'Me':'J'}</span><div><div class="bub">${esc(last.text)}</div><div class="meta">${last.me?'You':esc(last.from)} · ${fmtWhen(last.at)}</div></div></div>`:'<p class="small muted">No messages yet. Ask your prescriber anything.</p>'}
      <div class="row" style="margin-top:12px">${btn('ghost sm','Open messages','go','messages','chat')}<a class="btn wa sm" href="${WA}" target="_blank" rel="noopener">${ic('wa',16)}WhatsApp 24/7</a></div></section>
    ${others.length?`<section class="card"><h3 style="margin-bottom:10px">Also from Jood</h3><div class="list">${others.map(k=>`<button class="li" data-act="svc" data-arg="${k}"><span class="dot ${k}"></span><span class="grow"><span class="t">${SVC[k].name}</span><br><span class="s">${SVC[k].tag} · from ${SVC[k].from}</span></span>${ic('chev',18)}</button>`).join('')}</div></section>`
      :`<section class="card tint"><h3>Questions about your treatment?</h3><p class="small muted" style="margin:4px 0 12px">Our clinical team is on WhatsApp 24/7 and usually replies within 15 minutes.</p><a class="btn wa sm" href="${WA}" target="_blank" rel="noopener">${ic('wa',16)}WhatsApp 07756 099075</a></section>`}
  </div>${trustStrip()}</div>`;
  return h;
}
function progressCard(){
  const ws = wsSorted();
  const start = ws.length ? ws[0].w : 0, cur = ws.length ? ws[ws.length-1].w : 0, lost = Math.max(0,start-cur);
  const pct = ws.length ? Math.max(0,Math.min(100,(start-cur)/Math.max(.1,start-S.goal)*100)) : 0;
  return `<section class="card"><div class="card-h"><div><h3>Your progress</h3><p class="sub">${ws.length?'Since '+fmtD(ws[0].d):'Add your first weigh-in'}</p></div><div class="seg">${['kg','st'].map(u=>`<button class="${S.unit===u?'on':''}" data-act="unit" data-arg="${u}">${u}</button>`).join('')}</div></div>
      <div class="big">${!ws.length?'–':lost>0?'−'+fmtDiff(lost,S.unit):fmtW(cur,S.unit)}</div><p class="small muted" style="margin:4px 0 8px">${lost>0?'lost so far · now '+fmtW(cur,S.unit):''}</p>
      ${chartSvg(ws.map(p=>({ v:S.unit==='st'?p.w*2.20462/14:p.w, l:fmtD(p.d) })), null, 'h')}
      <div class="row between small" style="margin:12px 0 6px"><span>${Math.round(pct)}% to goal</span><span class="muted">Goal ${fmtW(S.goal,S.unit)}</span></div><div class="bar"><i style="width:${pct.toFixed(1)}%"></i></div>
      <div class="row" style="margin-top:14px"><input class="input" style="flex:1;min-width:120px" type="number" inputmode="decimal" step="0.1" placeholder="Today's weight, kg" data-bind="quickW" value="${esc(S.draft.quickW||'')}" aria-label="Today's weight in kg">${btn('primary','Save','quickWeigh','','plus')}</div>
      ${S.draft.quickErr?`<p class="err" style="margin-top:6px">${esc(S.draft.quickErr)}</p>`:''}</section>`;
}
// Weight tracking is open to anyone with weigh-ins or a weight loss consultation, not only
// while treatment is active, so past patients and those awaiting review can keep logging.
function wlTracks(){ return S.weights.length>0 || svcState('wl').mode!=='new'; }
function wlProgressOnly(){ return `<div class="grid g2">${progressCard()}<section class="card"><h3 style="margin-bottom:6px">Weigh in once a week</h3><p class="small muted" style="margin-bottom:12px">Same scales, same time of day, before breakfast. Your prescriber sees every entry.</p>${btn('ghost','All weigh-ins and your goal','goTab','wl:progress','chart')}</section></div>`; }
function homeWl(){
  const w = wlInfo(), ws = wsSorted();
  const start = ws.length ? ws[0].w : 0, cur = ws.length ? ws[ws.length-1].w : 0, lost = Math.max(0,start-cur);
  const pct = ws.length ? Math.max(0,Math.min(100,(start-cur)/Math.max(.1,start-S.goal)*100)) : 0;
  const ck = S.wl.checks[iso(today())] || {};
  const items = [['dose', w.weekly?(w.due?`Take ${w.prod.name} ${w.curStrength}`:'Next dose '+fmtD(w.next,true)):`Take ${w.prod.name} tablet`, w.takenToday, w.due && w.left>0 ? 'logDose':'', ''],
                 ['weigh', 'Weigh in', weighedThisWeek(), 'goTab', 'wl:progress'],
                 ['water', 'Drink 2 litres of water', !!ck.water, 'dayCheck', 'water'],
                 ['move', 'Move for 30 minutes', !!ck.move, 'dayCheck', 'move']];
  const done = items.filter(x=>x[2]).length;
  return `<div class="grid g2">
    ${progressCard()}
    <div class="stack">
      <section class="card"><div class="card-h"><h3>Today</h3>${pill(done===4?'p-ok':'p-grey', done+' of 4 done')}</div><div class="list">${items.map(x=>`<button class="li" data-act="${x[3]}" data-arg="${x[4]}" ${!x[3]?'disabled':''}><span class="check ${x[2]?'on':''}">${ic('tick',16,3)}</span><span class="grow t">${x[1]}</span>${x[0]==='dose'&&!w.weekly||x[0]==='dose'&&w.due?pill('p-acc',w.nextSite.split(',')[0]):''}</button>`).join('')}</div></section>
      <section class="card"><div class="card-h"><div><h3>${esc(w.prod.name)} ${esc(w.curStrength)}</h3><p class="sub">${esc(w.prod.form)} · week ${w.week}</p></div>${pill(w.left>1?'p-ok':'p-warn', w.left+' '+(w.weekly?'dose':'tablet')+(w.left===1?'':'s')+' left')}</div>
        <p class="small">${w.takenToday?'Taken today · next '+fmtD(w.next,true):'Next dose '+(iso(w.next)===iso(today())?'today':fmtD(w.next,true))}${w.st.inFlight?' · '+esc(prodOf('wl',w.st.inFlight.pid).name+' '+w.st.inFlight.s)+' '+STATUS_L[w.st.inFlight.status].toLowerCase():''}</p>
        <div class="row" style="margin-top:12px">${btn('soft sm','Doses & plan','goTab','wl:doses','pill')}${btn('ghost sm','Reorder','reorder','wl','box')}</div></section>
    </div></div>
    <div class="grid g4m">
      <div class="stat"><div class="v">${ws.length?fmtW(cur,S.unit):'–'}</div><div class="l">Current weight</div>${ws.length>1?`<div class="d ${cur<=ws[ws.length-2].w?'down':'up'}">${cur<=ws[ws.length-2].w?'−':'+'}${fmtDiff(cur-ws[ws.length-2].w,S.unit)} last week</div>`:''}</div>
      <div class="stat"><div class="v">${ws.length?((lost/start)*100).toFixed(1):'0.0'}%</div><div class="l">Body weight lost</div><div class="d muted">5% is the first milestone</div></div>
      <div class="stat"><div class="v">${ws.length?bmiFmt(cur):'–'}</div><div class="l">BMI</div><div class="d muted">from ${ws.length?bmiFmt(start):'–'}</div></div>
      <div class="stat"><div class="v">${S.waist?S.waist+' cm':'–'}</div><div class="l">Waist</div>${S.waist?`<div class="d down">−${S.start.waist-S.waist} cm since start</div>`:''}</div></div>`;
}
function homeEd(){
  const e = edInfo(), p = e.st.prod;
  const winTxt = e.inWindow ? `${e.lastProd.name} taken ${fmtWhen(e.last.at)}. Usually works for up to ${e.lastProd.window} hours, until about ${new Date(new Date(e.last.at).getTime()+e.lastProd.window*36e5).toTimeString().slice(0,5)}.` : '';
  return `${e.inWindow?`<div class="alert info">${ic('clock',18)}<span>${winTxt}${e.hoursSince<24?' Do not take another tablet within 24 hours.':''}</span></div>`:''}
  <div class="grid g2">
    <section class="card"><div class="card-h"><div><h3>${esc(p.name)} ${esc(e.st.rx.s)}</h3><p class="sub">${esc(p.form)} · works in ${p.onset}</p></div>${pill(e.left>2?'p-ok':'p-warn', e.left+' tablet'+(e.left===1?'':'s')+' left')}</div>
      <div class="bar"><i style="width:${Math.min(100,e.left/Math.max(1,e.got)*100)}%"></i></div><p class="hint" style="margin-top:6px">${e.got} supplied · ${S.ed.uses.length} logged</p>
      <div class="row" style="margin-top:14px">${btn('primary','Log a tablet','logEd','','plus')}${btn('ghost','Reorder','reorder','ed','box')}</div></section>
    <section class="card"><h3 style="margin-bottom:10px">How it's working</h3><div class="grid" style="grid-template-columns:1fr 1fr;gap:10px">
      <div class="stat"><div class="v">${e.avg?e.avg.toFixed(1):'–'}<span class="small muted">/5</span></div><div class="l">Average rating</div></div>
      <div class="stat"><div class="v">${e.month}</div><div class="l">Uses in 30 days</div></div></div>
      <p class="hint" style="margin-top:10px">${e.avg && e.avg<3.5?'Not working as well as you hoped? Your prescriber can suggest a higher strength or tadalafil.':'Last used '+(e.last?fmtWhen(e.last.at):'never')+'.'}</p>
      <div class="row" style="margin-top:10px">${btn('ghost sm','Switch treatment','switchFlow','ed','swap')}${btn('ghost sm','Usage log','goTab','ed:log','list')}</div></section></div>`;
}
function homePd(){
  const c = pdCourse(), stock = pdStock();
  if(!c) return `<div class="grid g2"><section class="card"><div class="card-h"><div><h3>Norethisterone 5 mg</h3><p class="sub">3 tablets a day, up to 17 days</p></div>${pill(stock>=12?'p-ok':'p-warn', stock+' tablets left')}</div><p class="small">Plan your next course and we'll set your start date, daily reminders and tell you if you need more tablets.</p><div class="row" style="margin-top:12px">${btn('primary','Plan my dates','goTab','pd:course','cal')}${btn('ghost','Reorder','reorder','pd','box')}</div></section>
    <section class="card"><h3 style="margin-bottom:8px">Past courses</h3><div class="list">${S.pd.courses.map(x=>`<div class="li"><span class="grow"><span class="t">${fmtD(x.start)} to ${fmtD(x.end)}</span><br><span class="s">${x.tablets} tablets</span></span>${pill('p-grey','Finished')}</div>`).join('')||'<p class="small muted">None yet.</p>'}</div></section></div>`;
  const di = dayDiff(today(), c.start), taken = pdTakenCount();
  const todayArr = S.pd.taken[iso(today())] || [false,false,false];
  return `<div class="grid g2"><section class="card"><div class="card-h"><div><h3>Your course</h3><p class="sub">${fmtD(c.start,true)} to ${fmtD(c.end,true)} · ${c.days} days</p></div>${pill(di<0?'p-info':di<c.days?'p-acc':'p-ok', di<0?'Starts in '+(-di)+'d':di<c.days?'Day '+(di+1)+' of '+c.days:'Finished')}</div>
      <div class="bar"><i style="width:${Math.min(100,taken/c.tablets*100)}%"></i></div><p class="hint" style="margin-top:6px">${taken} of ${c.tablets} tablets taken · period expected ${fmtD(addDays(parse(c.end),2))}–${fmtD(addDays(parse(c.end),3))}</p>
      ${di>=0&&di<c.days?`<p class="lab" style="margin:14px 0 8px">Today's tablets</p><div class="row">${['Morning','Afternoon','Evening'].map((t,i)=>`<button class="chip ${todayArr[i]?'on':''}" data-act="pdTab" data-arg="${iso(today())}:${i}">${todayArr[i]?ic('tick',16,3):''}${t}</button>`).join('')}</div>`:''}
      <div class="row" style="margin-top:14px">${btn('soft sm','Tablet tracker','goTab','pd:tracker','list')}${btn('ghost sm','Change dates','goTab','pd:course','cal')}</div></section>
    <section class="card"><h3 style="margin-bottom:8px">Supply</h3><div class="big" style="font-size:40px">${stock}</div><p class="small muted">tablets left in your pack</p>${stock < c.tablets - taken ? `<div class="alert warn" style="margin-top:12px">${ic('alert',18)}<span>You need ${c.tablets-taken-stock} more for this plan.</span></div><div style="margin-top:10px">${btn('primary sm','Reorder now','reorder','pd')}</div>`:''}</section></div>`;
}

/* ================= Treatment ================= */
function viewTreatment(){
  const svc = S.svc, st = svcState(svc);
  let h = `<div class="stack"><div class="page-h"><div><h1>Treatment</h1><p class="muted">${svc==='wl'?'Doses, progress and check-ins':svc==='ed'?'Your tablets and how they are working':'Plan your dates and track your tablets'}</p></div></div>${svcSwitch()}`;
  if(svc==='wl' && st.mode!=='active' && wlTracks()){ const top = st.mode==='new' ? startCard(svc) : `<section class="card"><div class="card-h"><div><h3>${st.mode==='declined'?'Not approved':'Your treatment unlocks once your prescriber approves'}</h3><p class="sub">${esc(statusCopy(st.latest))}</p></div>${btn('ghost sm','Order status','go','orders')}</div></section>`; return h + top + tWlProgress() + `</div>`; }
  if(st.mode==='new') return h + startCard(svc) + `</div>`;
  if(st.mode!=='active') return h + `<section class="card"><div class="empty"><span class="ico-box">${ic('clock',24)}</span><h3>${st.mode==='declined'?'Not approved':'Unlocks once your prescriber approves'}</h3><p class="small muted" style="margin:6px 0 14px">${esc(statusCopy(st.latest))}</p>${btn('ghost','View order status','go','orders')}</div></section>` + orderCard(st.latest,true) + `</div>`;
  const tabs = { wl:[['doses','Doses'],['progress','Progress'],['checkin','Check-in'],['plan','Plan']], ed:[['log','Usage log'],['rx','Prescription']], pd:[['course','Plan dates'],['tracker','Tablet tracker']] }[svc];
  const cur = S.tab[svc];
  h += `<div class="seg" role="tablist">${tabs.map(t=>`<button class="${cur===t[0]?'on':''}" data-act="tab" data-arg="${svc}:${t[0]}">${t[1]}</button>`).join('')}</div>`;
  const fn = { 'wl:doses':tWlDoses, 'wl:progress':tWlProgress, 'wl:checkin':tWlCheckin, 'wl:plan':tWlPlan, 'ed:log':tEdLog, 'ed:rx':tEdRx, 'pd:course':tPdCourse, 'pd:tracker':tPdTracker }[svc+':'+cur];
  return h + (fn?fn():'') + `</div>`;
}
function tWlDoses(){
  const w = wlInfo(), T = today();
  const monday = addDays(T, -((T.getDay()+6)%7) - 7);
  const days = Array.from({length:14},(_,i)=>addDays(monday,i));
  const dset = new Set(S.wl.doses.map(x=>x.d));
  return `<section class="card"><div class="card-h"><div><h3>Dose calendar</h3><p class="sub">${w.weekly?'Every '+DAYS_L[S.wl.doseDay]:'Every day'} · ${w.left} left in your supply</p></div>${pill(w.takenToday?'p-ok':w.due?'p-warn':'p-grey', w.takenToday?'Taken today':w.due?'Due today':'Next '+fmtD(w.next,true))}</div>
      <div class="cal">${days.slice(0,7).map(x=>calCell(x,w,dset)).join('')}</div><div class="cal" style="margin-top:6px">${days.slice(7).map(x=>calCell(x,w,dset)).join('')}</div>
      <div class="row" style="margin-top:14px">${btn('primary','Log a dose','logDose','','plus')}${w.weekly?btn('ghost','Change dose day','changeDoseDay','','cal'):''}${btn('ghost','Missed a dose?','missed','','help')}</div></section>
    <div class="grid g2"><section class="card"><h3 style="margin-bottom:6px">${w.weekly?'Injection sites':'Taking your tablet'}</h3>${w.weekly?`<p class="small muted" style="margin-bottom:10px">Rotate each week to avoid soreness. Next suggested: <b>${w.nextSite}</b>.</p><div class="chips">${SITES.map(s=>`<span class="chip ${s===w.nextSite?'on':''}">${s}</span>`).join('')}</div>`:`<p class="small muted">Take it first thing with a sip of water, on an empty stomach, and wait 30 minutes before eating or drinking anything else.</p>`}</section>
      <section class="card"><h3 style="margin-bottom:6px">Dose history</h3><div class="list">${S.wl.doses.slice().reverse().slice(0,6).map(x=>`<div class="li"><span class="grow"><span class="t">${fmtD(x.d,true)}</span><br><span class="s">${esc(w.prod.name)} ${esc(x.s||w.curStrength)}${x.site?' · '+esc(x.site):''}</span></span><button class="icon-btn" aria-label="Remove dose" data-act="delDose" data-arg="${x.d}">${ic('trash',18)}</button></div>`).join('')||'<p class="small muted">No doses logged yet.</p>'}</div></section></div>`;
}
function calCell(x,w,dset){
  const k = iso(x), due = w.weekly ? x.getDay()===S.wl.doseDay : true, taken = dset.has(k), fut = x > today();
  return `<button class="${due?'due':''} ${taken?'taken':''} ${k===iso(today())?'today':''}" ${fut||!due?'disabled':''} data-act="toggleDoseDate" data-arg="${k}" aria-label="${fmtD(x,true)}${taken?', taken':due?', dose day':''}"><span>${DAYS[x.getDay()]}</span><b>${x.getDate()}</b><span class="m"></span></button>`;
}
function tWlProgress(){
  const ws = wsSorted(), d = S.draft;
  const start = ws[0]?.w||0, cur = ws[ws.length-1]?.w||0, lost = Math.max(0,start-cur);
  const shown = S.range==='4' ? ws.slice(-4) : S.range==='30' ? ws.filter(p=>dayDiff(today(),p.d)<=30) : ws;
  const isB = S.metric==='bmi' && S.user.heightCm>0, conv = w => isB ? bmiOf(w,S.user.heightCm) : S.unit==='st' ? w*2.20462/14 : w;
  const weeks = ws.length>1 ? Math.max(1, dayDiff(ws[ws.length-1].d, ws[0].d)/7) : 1;
  const rate = lost/weeks; const toGo = Math.max(0,cur-S.goal); const eta = rate>0.05 ? Math.ceil(toGo/rate) : null;
  return `<div class="grid g2">
    <section class="card"><div class="card-h"><h3>Add a weigh-in</h3>${pill('p-grey','Weekly')}</div>
      <div class="grid" style="grid-template-columns:1fr 1fr;gap:10px"><div class="field"><label for="wD">Date</label><input class="input" id="wD" type="date" max="${iso(today())}" data-bind="wD" value="${esc(d.wD||iso(today()))}"></div><div class="field"><label for="wV">Weight (kg)</label><input class="input" id="wV" type="number" inputmode="decimal" step="0.1" placeholder="e.g. 86.4" data-bind="wV" value="${esc(d.wV||'')}"></div></div>
      <div class="grid" style="grid-template-columns:1fr 1fr;gap:10px;margin-top:10px"><div class="field"><label for="wWa">Waist cm (optional)</label><input class="input" id="wWa" type="number" inputmode="decimal" data-bind="wWa" value="${esc(d.wWa||'')}"></div><div class="field"><label for="wHi">Hips cm (optional)</label><input class="input" id="wHi" type="number" inputmode="decimal" data-bind="wHi" value="${esc(d.wHi||'')}"></div></div>
      ${d.wErr?`<p class="err" style="margin-top:8px">${esc(d.wErr)}</p>`:''}${d.wOk?`<p class="ok" style="margin-top:8px">${esc(d.wOk)}</p>`:''}
      ${btn('primary block','Save weigh-in','saveWeight','','tick')}<p class="hint" style="margin-top:8px">Weigh first thing, before breakfast. Your prescriber sees every entry.</p></section>
    <section class="card"><div class="card-h"><h3>Summary</h3>${btn('ghost sm','Download CSV','exportWeights','','down')}</div>
      <div class="grid" style="grid-template-columns:1fr 1fr;gap:10px">
        <div class="stat"><div class="v">${fmtDiff(lost,S.unit)}</div><div class="l">Lost in ${Math.round(weeks)} weeks</div></div>
        <div class="stat"><div class="v">${fmtDiff(rate,S.unit)}</div><div class="l">Average per week</div></div>
        <div class="stat"><div class="v">${start?((lost/start)*100).toFixed(1):'0'}%</div><div class="l">Body weight lost</div></div>
        <div class="stat"><div class="v">${eta?'~'+eta+' wks':'–'}</div><div class="l">To goal at this pace</div></div></div>
      <div class="row between" style="margin-top:12px"><span class="small">Goal: <b>${fmtW(S.goal,S.unit)}</b></span>${btn('ghost sm','Edit goal','editGoal','','edit')}</div></section></div>
    <section class="card"><div class="card-h" style="flex-wrap:wrap"><h3>${isB?'BMI':'Weight'} over time</h3><div class="row" style="gap:6px"><div class="seg">${[['weight','Weight'],['bmi','BMI']].map(x=>`<button class="${S.metric===x[0]?'on':''}" data-act="metric" data-arg="${x[0]}">${x[1]}</button>`).join('')}</div><div class="seg">${['kg','st'].map(u=>`<button class="${S.unit===u?'on':''}" data-act="unit" data-arg="${u}">${u}</button>`).join('')}</div><div class="seg">${[['4','Last 4'],['30','30 days'],['all','All']].map(x=>`<button class="${S.range===x[0]?'on':''}" data-act="range" data-arg="${x[0]}">${x[1]}</button>`).join('')}</div></div></div>
      ${chartSvg(shown.map(p=>({ v:conv(p.w), l:fmtD(p.d) })), conv(S.goal), 'p')}
      <div class="legend" style="margin-top:8px"><span><i></i>${isB?'BMI':'Weight'}</span><span><i class="g"></i>Goal</span></div></section>
    <section class="card"><div class="card-h"><h3>All weigh-ins</h3>${pill('p-grey',ws.length+' entries')}</div><div class="wrap-x"><table class="tbl"><thead><tr><th>Date</th><th>Weight</th><th>Change</th><th>BMI</th><th></th></tr></thead><tbody>
      ${ws.slice().reverse().map((p,i,arr)=>{ const prev = arr[i+1]; const df = prev ? p.w-prev.w : 0; return `<tr><td>${fmtD(p.d,true)}</td><td>${fmtW(p.w,S.unit)}</td><td class="${prev?(df<=0?'down':'up'):'muted'}">${prev?(df<=0?'−':'+')+fmtDiff(df,S.unit):'Start'}</td><td>${bmiFmt(p.w)}</td><td style="text-align:right"><button class="icon-btn" aria-label="Delete" data-act="delWeight" data-arg="${p.d}">${ic('trash',18)}</button></td></tr>`; }).join('')}
      </tbody></table></div></section>`;
}
function tWlCheckin(){
  const d = S.draft, c = d.ci || (d.ci = { mood:'Good', effects:[], note:'', severe:false });
  return `<section class="card"><div class="card-h"><div><h3>Weekly check-in</h3><p class="sub">Your prescriber reviews this before your next order</p></div>${pill(checkinThisWeek()?'p-ok':'p-warn', checkinThisWeek()?'Sent this week':'Due')}</div>
    <div class="stack"><div><p class="lab" style="margin-bottom:8px">How are you feeling?</p><div class="chips">${['Great','Good','Okay','Not great','Poor'].map(m=>`<button class="chip ${c.mood===m?'on':''}" data-act="ciMood" data-arg="${m}">${m}</button>`).join('')}</div></div>
    <div><p class="lab" style="margin-bottom:8px">Any side effects this week?</p><div class="chips">${EFFECTS.concat(['None']).map(e=>`<button class="chip ${(e==='None'?!c.effects.length:c.effects.includes(e))?'on':''}" data-act="ciEff" data-arg="${e}">${e}</button>`).join('')}</div></div>
    <div class="yn"><span class="q">Severe stomach pain, vomiting you can't keep fluids down, or yellowing skin?</span><div class="seg"><button class="${c.severe?'on yes':''}" data-act="ciSevere" data-arg="1">Yes</button><button class="${!c.severe?'on':''}" data-act="ciSevere" data-arg="0">No</button></div></div>
    ${c.severe?`<div class="alert err">${ic('alert',18)}<span><b>Stop your treatment and call 111 now</b>, or 999 in an emergency. These can be signs of pancreatitis or gallbladder problems.</span></div>`:''}
    <div class="field"><label for="ciN">Anything for your prescriber? (optional)</label><textarea class="input" id="ciN" data-bind="ciNote" placeholder="e.g. Should I eat smaller meals on dose day?">${esc(d.ciNote||'')}</textarea></div>
    ${btn('primary','Send check-in','sendCheckin','','tick')}<p class="hint">Side effect worrying you? You can also <a href="https://yellowcard.mhra.gov.uk" target="_blank" rel="noopener">report it to the MHRA Yellow Card scheme</a>.</p></div></section>
    <section class="card"><h3 style="margin-bottom:8px">Past check-ins</h3><div class="list">${S.checkins.map(x=>`<div class="li" style="align-items:flex-start"><span class="ico-box">${ic('chat')}</span><span class="grow"><span class="t">${fmtWhen(x.at)} · feeling ${x.mood.toLowerCase()}</span><br><span class="s">${x.effects.length?esc(x.effects.join(', ')):'No side effects'}${x.note?' · “'+esc(x.note)+'”':''}</span>${x.reply?`<br><span class="s" style="color:var(--ok-ink)">Prescriber: ${esc(x.reply)}</span>`:''}</span></div>`).join('')||'<p class="small muted">None yet.</p>'}</div></section>`;
}
function tWlPlan(){
  const w = wlInfo(), p = w.prod, idx = p.strengths.findIndex(x=>x.s===w.curStrength);
  return `<section class="card"><div class="card-h"><div><h3>${esc(p.name)} (${esc(p.generic)})</h3><p class="sub">${esc(p.form)}</p></div>${pill('p-acc','Week '+w.week)}</div>
    <div class="list">${p.strengths.map((x,i)=>`<div class="li"><span class="check ${i<idx?'on':''}" style="${i===idx?'border-color:var(--acc)':''}">${ic('tick',16,3)}</span><span class="grow"><span class="t">${x.s}${i===idx?' · current':''}</span><br><span class="s">${p.freq==='weekly'?(i===0?'Weeks 1–4':'At least 4 weeks'):'As advised'} · ${money(x.packs[0].price)}</span></span>${i===idx+1?pill('p-grey','Next step'):''}</div>`).join('')}</div>
    <p class="hint" style="margin-top:10px">Your prescriber only steps you up if you're tolerating your dose. You can stay on a strength for longer.</p>
    <div class="row" style="margin-top:12px">${btn('primary','Reorder','reorder','wl','box')}${btn('ghost','Switch treatment','switchFlow','wl','swap')}${btn('ghost','Patient leaflet','doc','leaflet:wl','down')}</div></section>`;
}
function tEdLog(){
  const e = edInfo(), uses = S.ed.uses.slice().sort((a,b)=>a.at<b.at?1:-1);
  return `<section class="card"><div class="card-h"><div><h3>Usage log</h3><p class="sub">${e.left} tablet${e.left===1?'':'s'} left · ${e.month} used in the last 30 days</p></div>${btn('primary sm','Log a tablet','logEd','','plus')}</div>
    ${e.inWindow?`<div class="alert info" style="margin-bottom:10px">${ic('clock',18)}<span>Last tablet ${fmtWhen(e.last.at)}. ${e.hoursSince<24?'Wait 24 hours before taking another.':'Still within its working window.'}</span></div>`:''}
    <div class="list">${uses.map(u=>{ const p = prodOf('ed',u.pid); return `<div class="li"><span class="ico-box">${ic('pill')}</span><span class="grow"><span class="t">${fmtWhen(u.at)}</span><br><span class="s">${esc(p.name)} ${esc(u.s)}${u.effects.length?' · '+esc(u.effects.join(', ')):''}</span></span>${u.rating?pill(u.rating>=4?'p-ok':u.rating>=3?'p-warn':'p-err', u.rating+'/5'):btn('ghost sm','Rate','rateEd',u.id)}<button class="icon-btn" aria-label="Delete" data-act="delEd" data-arg="${u.id}">${ic('trash',18)}</button></div>`; }).join('')||'<p class="small muted">Nothing logged yet.</p>'}</div></section>`;
}
function tEdRx(){
  const e = edInfo(), p = e.st.prod;
  return `<div class="grid g2"><section class="card"><div class="card-h"><div><h3>${esc(p.name)} ${esc(e.st.rx.s)}</h3><p class="sub">${esc(p.generic)} · prescribed ${fmtD(e.st.rx.history.find(x=>x.s==='todispatch').at)}</p></div>${pill('p-acc','Active')}</div>
      <div class="list"><div class="li"><span class="grow t">When to take it</span><span class="s">${p.onset} before sex</span></div><div class="li"><span class="grow t">How long it works</span><span class="s">Up to ${p.window} hours</span></div><div class="li"><span class="grow t">Maximum</span><span class="s">${p.freq==='daily'?'One a day':'One in 24 hours'}</span></div></div>
      <div class="row" style="margin-top:12px">${btn('primary sm','Reorder','reorder','ed','box')}${btn('ghost sm','Switch treatment','switchFlow','ed','swap')}${btn('ghost sm','Leaflet','doc','leaflet:ed','down')}</div></section>
    <section class="card"><h3 style="margin-bottom:8px">Stay safe</h3><div class="alert err">${ic('alert',18)}<span>Never take it with nitrates (GTN spray, isosorbide) or poppers. If an erection lasts more than 4 hours, go to A&amp;E.</span></div>
      <p class="small muted" style="margin-top:10px">Heavy meals and alcohol can slow it down. Sexual stimulation is still needed for it to work.</p></section></div>`;
}
function tPdCourse(){
  const c = pdCourse(), d = S.draft, stock = pdStock();
  const due = d.pdDue ?? (c?c.due:''), end = d.pdEnd ?? (c?c.end:'');
  let calc = '';
  if(due && end){ const start = addDays(parse(due),-3); const days = dayDiff(end, start)+1; const tabs = days*3;
    calc = days<4 ? `<div class="alert err">${ic('alert',18)}<span>The return date must be after your due date.</span></div>` : days>17 ? `<div class="alert warn">${ic('alert',18)}<span>That is ${days} days. The usual maximum is 17 days, so choose an earlier return date or message your prescriber.</span></div>`
      : `<div class="grid g3"><div class="stat"><div class="v" style="font-size:18px">${fmtD(start,true)}</div><div class="l">Start tablets</div></div><div class="stat"><div class="v" style="font-size:18px">${days} days</div><div class="l">${tabs} tablets</div></div><div class="stat"><div class="v" style="font-size:18px">${fmtD(addDays(parse(end),2))}–${fmtD(addDays(parse(end),3))}</div><div class="l">Period expected</div></div></div>
      ${tabs - (c?pdTakenCount():0) > stock ? `<div class="alert warn">${ic('alert',18)}<span>You have ${stock} tablets. This plan needs ${tabs - (c?pdTakenCount():0)} more. Save it, then reorder the difference.</span></div>`:`<div class="alert ok">${ic('tick',18)}<span>You have enough tablets for this plan.</span></div>`}`; }
  return `<section class="card"><div class="card-h"><div><h3>Plan your dates</h3><p class="sub">We'll set your start date and 3-a-day reminders</p></div>${c?pill('p-ok','Planned'):''}</div>
    <div class="grid g2"><div class="field"><label for="pdD">When is your period due?</label><input class="input" id="pdD" type="date" min="${iso(addDays(today(),1))}" data-bind="pdDue" data-live="pd" value="${esc(due)}"></div>
    <div class="field"><label for="pdE">When would you like it back?</label><input class="input" id="pdE" type="date" min="${esc(due||iso(today()))}" data-bind="pdEnd" data-live="pd" value="${esc(end)}"></div></div>
    <div id="pdCalc" class="stack" style="margin-top:12px">${calc}</div>
    <div class="row" style="margin-top:14px">${btn('primary','Save plan & set reminders','savePd','','tick')}${c?btn('ghost','Clear plan','clearPd'):''}${btn('ghost','Reorder','reorder','pd','box')}</div></section>
    <section class="card"><h3 style="margin-bottom:8px">Good to know</h3><div class="list"><div class="li"><span class="grow small">Start 3 days before your period is due. Take one tablet three times a day.</span></div><div class="li"><span class="grow small">Your period usually starts 2–3 days after your last tablet.</span></div><div class="li"><span class="grow small">It is not a contraceptive. Use condoms if you need contraception.</span></div></div>
    <div class="alert err" style="margin-top:10px">${ic('alert',18)}<span>Pain or swelling in one leg, chest pain or sudden breathlessness: stop and call 999. These can be signs of a blood clot.</span></div></section>`;
}
function tPdTracker(){
  const c = pdCourse();
  if(!c) return `<section class="card"><div class="empty"><span class="ico-box">${ic('cal',24)}</span><h3>No course planned</h3><p class="small muted" style="margin:6px 0 14px">Plan your dates first and your daily tracker appears here.</p>${btn('primary','Plan my dates','tab','pd:course')}</div></section>`;
  const taken = pdTakenCount(), T = iso(today());
  const days = Array.from({length:c.days},(_,i)=>addDays(parse(c.start),i));
  return `<section class="card"><div class="card-h"><div><h3>Tablet tracker</h3><p class="sub">${taken} of ${c.tablets} taken · ${c.tablets-taken} to go</p></div>${btn('ghost sm','Finish course','finishPd','','tick')}</div>
    <div class="bar" style="margin-bottom:10px"><i style="width:${(taken/c.tablets*100).toFixed(1)}%"></i></div>
    <div class="pdgrid">${days.map(x=>{ const k = iso(x), arr = S.pd.taken[k]||[false,false,false], fut = k>T;
      return `<div class="pdrow"><span class="dname ${k===T?'today':''}">${k===T?'Today':fmtD(x,true)}</span><div class="tabs">${[0,1,2].map(i=>`<button class="tab3 ${arr[i]?'on':''}" ${fut?'disabled':''} data-act="pdTab" data-arg="${k}:${i}" aria-label="${['Morning','Afternoon','Evening'][i]} tablet">${arr[i]?ic('tick',16,3):['AM','PM','EVE'][i]}</button>`).join('')}</div></div>`; }).join('')}</div></section>`;
}

/* ================= Orders ================= */
function viewOrders(){
  const f = S.ordersFilter;
  const list = S.orders.filter(o=>f==='all'||o.svc===f).sort((a,b)=>a.createdAt<b.createdAt?1:-1);
  const live = list.filter(o=>['booked','clinical','todispatch','dispatched'].includes(o.status)), past = list.filter(o=>!live.includes(o));
  return `<div class="stack"><div class="page-h"><div><h1>Orders</h1><p class="muted">Every consultation, reorder and delivery</p></div></div>
    <div class="chips">${[['all','All services']].concat(SVC_KEYS.map(k=>[k,SVC[k].name])).map(x=>`<button class="chip ${f===x[0]?'on':''}" data-act="ordersFilter" data-arg="${x[0]}">${x[0]!=='all'?`<span class="dot ${x[0]}"></span>`:''}${x[1]}</button>`).join('')}</div>
    <section class="card tint"><div class="row between"><div><h3>Order again</h3><p class="small muted">Reorders go straight to clinical check. Most ship the same day.</p></div><div class="row">${SVC_KEYS.filter(k=>svcState(k).mode==='active').map(k=>btn('ghost sm',SVC[k].name,'reorder',k,'box')).join('')}</div></div></section>
    ${live.length?`<h2>In progress</h2>`+live.map(o=>orderCard(o)).join(''):''}
    <h2>History</h2>${past.length?past.map(o=>orderCard(o)).join(''):'<p class="muted small">No past orders.</p>'}
    <section class="card"><div class="card-h"><h3>Delivery address</h3>${btn('ghost sm','Change','editAddress','','edit')}</div><p style="font-weight:500">${esc(S.address.line)}</p><p class="muted">${esc(S.address.town)}, ${esc(S.address.postcode)}</p><p class="hint" style="margin-top:6px">DPD next-day · ${S.safePlace?'Safe place: '+esc(S.safePlace):'No safe place set'} · ${btn('link','Safe place','safePlace')}</p></section></div>`;
}

/* ================= Reminders ================= */
function permState(){ if(!('Notification' in window)) return 'unsupported'; return Notification.permission; }
function remSchedule(r){ if(r.date) return fmtD(r.date,true)+' at '+r.time; const d = r.days.length===7 ? 'Every day' : r.days.length===5 && !r.days.includes(0) && !r.days.includes(6) ? 'Weekdays' : 'Every '+r.days.map(x=>DAYS[x]).join(', '); return d+' at '+r.time+(r.until?' until '+fmtD(r.until):''); }
function viewReminders(){
  const perm = permState();
  const device = isIOS() ? 'iPhone' : isAndroid() ? 'Android phone' : 'phone';
  const groups = SVC_KEYS.map(k=>[k, S.reminders.filter(r=>r.svc===k)]).filter(g=>g[1].length);
  return `<div class="stack"><div class="page-h"><div><h1>Reminders</h1><p class="muted">On your phone, by text or WhatsApp, your choice</p></div>${btn('primary','New reminder','newRem','','plus')}</div>
    <section class="card dark"><div class="row" style="align-items:flex-start;gap:14px"><span class="ico-box hide-sm" style="background:var(--lime);color:var(--brand)">${ic('phone')}</span><div style="flex:1;min-width:220px">
      <h3>Get reminders on your ${device}</h3><p class="small muted" style="margin:4px 0 14px">Add them to your phone's calendar once and they alert you even when the portal is closed. Works with iPhone Calendar, Google Calendar and Samsung Calendar.</p>
      <div class="row">${btn('lime','Add all to my phone calendar','icsAll','','cal')}${btn('ghost sm','Turn on notifications','enablePush','','bell','style="background:transparent;color:#fff;border-color:rgba(255,255,255,.35)"')}</div>
      <p class="tiny muted" style="margin-top:10px">Notifications on this device: <b style="color:#fff">${perm==='granted'&&S.channels.push?'On':perm==='denied'?'Blocked in browser settings':perm==='unsupported'?'Not supported here, use calendar':'Off'}</b></p></div></div></section>
    ${groups.map(([k,list])=>`<section class="card" data-svc="${k}"><div class="card-h"><div class="row" style="gap:8px"><span class="dot ${k}"></span><h3>${SVC[k].name}</h3></div>${pill('p-grey',list.filter(r=>r.on).length+' on')}</div><div class="list">
      ${list.map(r=>`<div class="rem-row"><span class="ico-box">${ic(r.title.match(/weigh/i)?'scale':r.title.match(/check-in/i)?'chat':r.title.match(/water/i)?'drop':r.title.match(/reorder/i)?'box':'pill')}</span><span class="rem-main"><span class="t">${esc(r.title)}</span>${r.auto?' '+pill('p-acc','Auto'):''}<br><span class="s">${remSchedule(r)}</span></span>${sw(r.on,'remToggle',r.id)}
        <span class="rem-ctl"><input class="input" type="time" value="${r.time}" data-change="remTime" data-arg="${r.id}" aria-label="Time for ${esc(r.title)}">${btn('ghost sm','Options','remMore',r.id,'cal')}</span></div>`).join('')}</div></section>`).join('')||`<section class="card"><p class="muted">No reminders yet.</p></section>`}
    <section class="card"><h3 style="margin-bottom:4px">How we contact you</h3><p class="small muted" style="margin-bottom:8px">Choose one or more. Messages never mention your treatment on the lock screen when discreet mode is on.</p><div class="list">
      ${[['push','Phone notifications','From this portal on this device'],['sms','SMS',S.user.phone],['whatsapp','WhatsApp','From the Jood clinical team'],['email','Email',S.user.email]].map(c=>`<div class="li"><span class="grow"><span class="t">${c[1]}</span><br><span class="s">${esc(c[2])}</span></span>${sw(S.channels[c[0]],'chan',c[0])}</div>`).join('')}
      <div class="li"><span class="grow"><span class="t">Discreet mode</span><br><span class="s">Shows “Jood reminder” instead of medicine names</span></span>${sw(S.discreet,'discreet')}</div></div>
      <div class="row" style="margin-top:10px">${btn('ghost sm','Send me a test','testPush','','bell')}</div></section></div>`;
}

/* ================= Messages ================= */
function viewMessages(){
  const svc = S.msgSvc || S.svc, t = S.messages[svc] || [];
  return `<div class="stack"><div class="page-h"><div><h1>Messages</h1><p class="muted">Secure messages with your clinical team. Kept on your record.</p></div></div>
    <div class="chips">${SVC_KEYS.map(k=>`<button class="chip ${svc===k?'on':''}" data-act="msgSvc" data-arg="${k}" data-svc="${k}"><span class="dot ${k}"></span>${SVC[k].name}${(S.messages[k]||[]).length?' · '+S.messages[k].length:''}</button>`).join('')}</div>
    <section class="card" data-svc="${svc}" style="display:flex;flex-direction:column;gap:14px">${t.map(m=>`<div class="msg ${m.me?'me':''}"><span class="av">${m.me?'Me':'J'}</span><div><div class="bub">${esc(m.text)}</div><div class="meta">${m.me?'You':esc(m.from)} · ${fmtWhen(m.at)}</div></div></div>`).join('')||`<div class="empty"><span class="ico-box">${ic('chat',24)}</span><p class="muted small">No messages about ${SVC[svc].name.toLowerCase()} yet.</p></div>`}
      <div class="hr"></div><div class="field"><label for="nm">Write a message</label><textarea class="input" id="nm" data-bind="newMsg" placeholder="Ask about your dose, side effects, delivery, anything">${esc(S.draft.newMsg||'')}</textarea></div>
      <div class="row" style="justify-content:flex-end">${btn('primary','Send','sendMsg',svc)}</div>
      <p class="hint">A prescriber replies within one working day. Urgent? <a href="${WA}" target="_blank" rel="noopener">WhatsApp us 24/7</a>, call 111, or 999 in an emergency.</p></section></div>`;
}

/* ================= Health record ================= */
function viewRecord(){
  const f = S.recFilter, items = S.activity.filter(x=>f==='all'||x.svc===f);
  const groups = {}; items.forEach(x=>{ const k = x.at.slice(0,10); (groups[k]=groups[k]||[]).push(x); });
  return `<div class="stack"><div class="page-h"><div><h1>Health record</h1><p class="muted">Everything you've logged, ordered and been prescribed</p></div>${btn('ghost','Download summary','exportRecord','','down')}</div>
    <div class="grid g4m">
      <div class="stat"><div class="v">${S.orders.length}</div><div class="l">Orders</div></div>
      <div class="stat"><div class="v">${S.weights.length}</div><div class="l">Weigh-ins</div></div>
      <div class="stat"><div class="v">${S.wl.doses.length + S.ed.uses.length + pdTakenCount() + S.pd.courses.reduce((a,c)=>a+c.tablets,0)}</div><div class="l">Doses & tablets</div></div>
      <div class="stat"><div class="v">${S.checkins.length}</div><div class="l">Check-ins</div></div></div>
    <div class="chips">${[['all','Everything']].concat(SVC_KEYS.map(k=>[k,SVC[k].name])).map(x=>`<button class="chip ${f===x[0]?'on':''}" data-act="recFilter" data-arg="${x[0]}">${x[1]}</button>`).join('')}</div>
    <section class="card"><div class="tl">${Object.keys(groups).sort().reverse().map(k=>`<p class="lab" style="margin:8px 0 2px">${fmtWhen(k)}</p>`+groups[k].map(x=>`<div class="tl-i"><span class="ico-box ${x.svc||'acct'}">${ic(x.icon||'info',16)}</span><div><div class="small" style="font-weight:500">${esc(x.text)}</div><div class="tiny muted">${x.at.slice(11,16)} · ${x.svc?SVC[x.svc].name:'Account'}</div></div></div>`).join('')).join('')||'<p class="muted small">Nothing yet.</p>'}</div></section></div>`;
}

/* ================= Account ================= */
function viewAccount(){
  const u = S.user, e = S.ui.editProfile, d = S.draft;
  return `<div class="stack"><div class="page-h"><div><h1>Account</h1><p class="muted">Your details, privacy and security</p></div></div>
    <div class="grid g2"><section class="card"><div class="card-h"><h3>Your details</h3>${btn('ghost sm',e?'Cancel':'Edit','editProfile','','edit')}</div>
      ${e?`<div class="stack"><div class="field"><label>Full name</label><input class="input" data-bind="pN" value="${esc(d.pN??u.name)}" autocomplete="name"></div><div class="field"><label>Email</label><input class="input" type="email" data-bind="pE" value="${esc(d.pE??u.email)}" autocomplete="email"></div><div class="field"><label>Mobile</label><input class="input" type="tel" data-bind="pP" value="${esc(d.pP??u.phone)}" autocomplete="tel"></div>${d.pErr?`<p class="err">${esc(d.pErr)}</p>`:''}${btn('primary','Save details','saveProfile')}</div>`
      :`<div class="list"><div class="li"><span class="grow"><span class="s">Name</span><br><span class="t">${esc(u.name)}</span></span>${S.idVerified?pill('p-ok','ID verified','shield'):''}</div><div class="li"><span class="grow"><span class="s">Email</span><br><span class="t">${esc(u.email)}</span></span></div><div class="li"><span class="grow"><span class="s">Mobile</span><br><span class="t">${esc(u.phone)}</span></span></div><div class="li"><span class="grow"><span class="s">Date of birth</span><br><span class="t">${esc(u.dob)}</span></span><span class="tiny muted">Message us to change</span></div></div>`}</section>
    <section class="card"><div class="card-h"><h3>Delivery</h3>${btn('ghost sm','Change','editAddress','','edit')}</div><p style="font-weight:500">${esc(S.address.line)}</p><p class="muted">${esc(S.address.town)}, ${esc(S.address.postcode)}</p><div class="list" style="margin-top:8px"><button class="li" data-act="safePlace"><span class="grow"><span class="t">DPD safe place</span><br><span class="s">${esc(S.safePlace||'Not set')}</span></span>${ic('chev',18)}</button></div></section></div>
    <div class="grid g2"><section class="card"><h3 style="margin-bottom:4px">Your GP</h3><div class="list"><div class="li"><span class="grow"><span class="t">Share treatment summaries with my GP</span><br><span class="s">${S.gpShare?'On · sent after each clinical review':'Off · nothing is shared unless you choose'}</span></span>${sw(S.gpShare,'gpShare')}</div><button class="li" data-act="editGp"><span class="grow"><span class="t">GP practice</span><br><span class="s">${esc(S.gp)}</span></span>${ic('chev',18)}</button></div></section>
    <section class="card"><h3 style="margin-bottom:4px">Security</h3><div class="list"><div class="li"><span class="grow"><span class="t">Two-step verification</span><br><span class="s">Code by email when you log in</span></span>${sw(S.twoFA,'twoFA')}</div><button class="li" data-act="changePw"><span class="grow t">Change password</span>${ic('chev',18)}</button><button class="li" data-act="signOut"><span class="grow t" style="color:var(--err)">Log out</span>${ic('out',18)}</button></div></section></div>
    <section class="card"><h3 style="margin-bottom:4px">Your data</h3><div class="list"><button class="li" data-act="go" data-arg="record"><span class="grow"><span class="t">Health record</span><br><span class="s">Every dose, weigh-in, order and message</span></span>${ic('chev',18)}</button><button class="li" data-act="exportAll"><span class="grow"><span class="t">Download all my data</span><br><span class="s">A copy of everything we hold (UK GDPR)</span></span>${ic('down',18)}</button><button class="li" data-act="deleteAcct"><span class="grow t">Close my account</span>${ic('chev',18)}</button></div></section>
    ${(initial.staffLinks||[]).length?`<section class="card"><h3 style="margin-bottom:10px">Staff tools</h3><div class="row">${initial.staffLinks.map(l=>`<a class="btn ghost sm" href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}</div></section>`:''}
    <p class="tiny muted">Powered by Jood Pharmacy, a GPhC-registered pharmacy (${TRUST.gphc}) operating under Jood Ltd. Superintendent Pharmacist: ${TRUST.spc}. Clinical, consultation and prescribing services are provided by UK-registered prescribers.</p></div>`;
}

/* ================= Help ================= */
function viewHelp(){
  const q = (S.draft.faqQ||'').trim().toLowerCase();
  const list = FAQS.filter(f=>(S.faqCat==='All'||f.cat===S.faqCat) && (!q || (f.q+' '+f.a).toLowerCase().includes(q)));
  return `<div class="stack"><div class="page-h"><div><h1>Help</h1><p class="muted">Real people, UK based, fast replies</p></div></div>
    <div class="grid g2"><section class="card dark"><h3>Clinical team on WhatsApp</h3><p class="small muted" style="margin:4px 0 14px">Dosing, side effects, delivery, anything. 24/7, usually within 15 minutes.</p><div class="row"><a class="btn lime" href="${WA}" target="_blank" rel="noopener">${ic('wa',18)}07756 099075</a>${btn('ghost sm','Copy number','copy','07756 099075','copy','style="background:transparent;color:#fff;border-color:rgba(255,255,255,.35)"')}</div></section>
    <section class="card"><h3>Email us</h3><p class="small muted" style="margin:4px 0 14px">support@joodlife.com · within one working day</p><div class="row"><a class="btn ghost" href="mailto:support@joodlife.com">${ic('mail',18)}Email</a>${btn('ghost','Send a secure message','go','messages','chat')}</div></section></div>
    <section class="card"><h3 style="margin-bottom:10px">Common questions</h3><input class="input" type="search" placeholder="Search questions" data-bind="faqQ" data-live="faq" value="${esc(S.draft.faqQ||'')}">
      <div class="chips" style="margin:12px 0 4px">${['All','Treatment','Orders & delivery','Your account'].map(c=>`<button class="chip ${S.faqCat===c?'on':''}" data-act="faqCat" data-arg="${c}">${c}</button>`).join('')}</div>
      <div id="faqList" class="list">${faqItems(list)}</div></section>
    <section class="card"><h3 style="margin-bottom:6px">Reading for you</h3><div class="list">${ARTICLES[S.svc].map(t=>`<a class="li" href="https://www.joodlife.com/blogs" target="_blank" rel="noopener" style="text-decoration:none"><span class="grow t">${t}</span>${ic('ext',18)}</a>`).join('')}</div></section>
    <div class="alert info">${ic('info',18)}<span>Feeling unwell? Call NHS 111. In an emergency call 999. Unhappy with our service? See our <a href="https://www.joodlife.com/policies/refund-complaints" target="_blank" rel="noopener">complaints procedure</a>.</span></div></div>`;
}
function faqItems(list){ return list.map((f,i)=>`<div style="border-bottom:1px solid var(--line)"><button class="li" style="border:0" data-act="faq" data-arg="${i}"><span class="grow t">${f.q}</span>${ic(S.faqOpen===i?'x':'plus',18)}</button>${S.faqOpen===i?`<p class="small" style="padding:0 0 14px;color:var(--ink-2)">${f.a}</p>`:''}</div>`).join('') || '<p class="small muted" style="padding:10px 0">Nothing matches. Try another word or message us.</p>'; }

/* ================= Shell ================= */
const NAV = [['home','Home','home'],['treatment','Treatment','pill'],['orders','Orders','box'],['reminders','Reminders','bell'],['messages','Messages','chat'],['record','Health record','list'],['help','Help','help'],['account','Account','user']];
const TABS = [['home','Home','home'],['treatment','Treatment','pill'],['orders','Orders','box'],['reminders','Reminders','bell'],['account','Account','user']];
/* The one action we want in front of every patient: Reorder for anyone with a
   real order (the site-wide rule), otherwise Get started with a consultation
   for the service they're looking at. Shown in the sticky header, on the home
   banner and in the bar stuck to the bottom of every screen. */
function mainCta(){
  return initial.returning
    ? { label:'Reorder', href:'/reorder', icon:'box' }
    : { label:'Get started', href:(initial.links.start||{})[S.svc] || '/consultation', icon:'plus' };
}
function ctaBand(c){
  const r = !!initial.returning;
  return `<section class="cta-band" aria-label="${r ? 'Reorder' : 'Get started'}"><div class="txt"><h2>${r ? 'Running low? <em class="serif">Reorder in minutes</em>' : 'Ready to start? <em class="serif">It takes 3 minutes</em>'}</h2>
    <p>${r ? 'Your prescriber reviews every reorder, usually the same day. Free next-day delivery in plain packaging.' : 'Free online consultation, reviewed by a UK prescriber. You only pay if you are approved.'}</p></div>
    <a class="btn lime" href="${esc(c.href)}">${ic(c.icon,18)}${c.label}</a></section>`;
}
function render(){
  root.dataset.svc = S.svc;
  const views = { home:viewHome, treatment:viewTreatment, orders:viewOrders, reminders:viewReminders, messages:viewMessages, record:viewRecord, account:viewAccount, help:viewHelp };
  const unread = S.notifs.filter(n=>!n.read).length, live = S.orders.filter(o=>['booked','clinical','todispatch','dispatched'].includes(o.status)).length;
  const unreadMsgs = SVC_KEYS.reduce((a,k)=>a+(S.messages[k]||[]).filter(m=>!m.me && !m.read).length, 0);
  const badge = k => k==='orders'&&live ? `<span class="count">${live}</span>` : k==='messages'&&unreadMsgs ? `<span class="count">${unreadMsgs}</span>` : '';
  const scr = S.screen;
  const cta = mainCta();
  $('app').innerHTML = `<div class="shell">
    <aside class="rail">${LOGO}<nav class="rail-nav" aria-label="Main">${NAV.map(n=>`<button class="${scr===n[0]?'on':''}" data-act="go" data-arg="${n[0]}">${ic(n[2])}<span>${n[1]}</span>${badge(n[0])}</button>`).join('')}</nav><div class="grow"></div>
      <a class="rail-wa" href="${WA}" target="_blank" rel="noopener">${ic('wa',26)}<div><b>WhatsApp the team</b><span>24/7 · replies in ~15 min</span></div></a></aside>
    <div class="col"><header class="topbar"><div class="topbar-in">${LOGO}<span class="grow"></span><a class="btn primary sm top-cta" href="${esc(cta.href)}">${ic(cta.icon,16)}${cta.label}</a><div class="top-actions">
      <button class="icon-btn" aria-label="Messages" data-act="go" data-arg="messages">${ic('chat')}${unreadMsgs?`<span class="count">${unreadMsgs}</span>`:''}</button>
      <button class="icon-btn" aria-label="Notifications" data-act="openNotifs">${ic('bell')}${unread?`<span class="count">${unread}</span>`:''}</button>
      <button class="icon-btn" aria-label="Help" data-act="go" data-arg="help">${ic('help')}</button></div></div></header>
      <main class="main" id="main">${(views[S.screen]||viewHome)()}${ctaBand(cta)}</main></div></div>`;
  $('tabbar').innerHTML = TABS.map(n=>`<button class="${scr===n[0]?'on':''}" data-act="go" data-arg="${n[0]}"><span class="tb-ic" style="position:relative">${ic(n[2])}${badge(n[0])}</span><span>${n[1]}</span></button>`).join('');
}
function scrollTop(){ window.scrollTo(0,0); }
let toastT;
function say(msg){ const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(()=>t.classList.remove('show'), 2800); }
function openSheet(title, html){ const s = $('sheet'); s.innerHTML = `<div class="grab"></div><div class="sheet-h"><h2>${title}</h2><button class="icon-btn" aria-label="Close" data-act="closeSheet">${ic('x')}</button></div>`+html; s.classList.add('open'); $('sheetBg').classList.add('open'); S.ui.sheet = true; }
function closeSheet(){ $('sheet').classList.remove('open'); $('sheetBg').classList.remove('open'); S.ui.sheet = false; }

/* ================= Default reminders ================= */
function autoReminders(svc){
  const has = t => S.reminders.some(r=>r.svc===svc && r.title===t);
  if(svc==='wl'){ const p = svcState('wl').prod; if(p && p.freq==='weekly'){ if(!has('Take your weekly dose')) S.reminders.push({ id:uid(), svc, title:'Take your weekly dose', days:[S.wl.doseDay], time:'08:00', on:true, auto:true }); }
    else if(!has('Take your daily tablet')) S.reminders.push({ id:uid(), svc, title:'Take your daily tablet', days:[0,1,2,3,4,5,6], time:'07:30', on:true, auto:true });
    if(!has('Weekly weigh-in')) S.reminders.push({ id:uid(), svc, title:'Weekly weigh-in', days:[S.wl.doseDay], time:'07:30', on:true, auto:true });
    if(!has('Weekly check-in')) S.reminders.push({ id:uid(), svc, title:'Weekly check-in', days:[(S.wl.doseDay+1)%7], time:'18:00', on:true, auto:true }); }
  if(svc==='ed' && !has('Reorder check: tablets running low')) S.reminders.push({ id:uid(), svc, title:'Reorder check: tablets running low', days:[5], time:'19:00', on:true, auto:true });
}
/* ================= Actions ================= */
function on(ev, fn){ root.addEventListener(ev, fn); disposers.push(()=>root.removeEventListener(ev, fn)); }
/* A password box with an eye button that shows or hides what was typed. */
function pwField(label, bind, auto){
  return `<div class="field"><label for="${bind}">${label}</label><div class="pw"><input class="input" id="${bind}" type="password" data-bind="${bind}" autocomplete="${auto}"><button type="button" class="pw-eye" data-act="togglePw" aria-label="Show password" aria-pressed="false">${ic('eye',18)}</button></div></div>`;
}
const ACT = {
  togglePw(_, b){ const inp = b.parentElement.querySelector('input'); const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password'; b.innerHTML = ic(show ? 'eyeOff' : 'eye', 18);
    b.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); b.setAttribute('aria-pressed', String(show)); inp.focus(); },
  closeSheet(){ closeSheet(); },
  async signOut(){ closeSheet(); try{ await fetch('/api/portal/logout', { method:'POST', credentials:'include' }); }catch(e){} location.href = initial.links.login; },
  /* nav */
  go(a){ S.screen = a; S.draft = {}; if(a==='messages'){ S.msgSvc = null; markRead(S.svc); } closeSheet(); render(); scrollTop(); },
  svc(a){ S.svc = a; save(); render(); },
  tab(a){ const [s,t] = a.split(':'); S.svc = s; S.tab[s] = t; S.draft = {}; save(); render(); },
  goTab(a){ const [s,t] = a.split(':'); S.svc = s; S.tab[s] = t; S.screen = 'treatment'; S.draft = {}; save(); render(); scrollTop(); },
  ordersFilter(a){ S.ordersFilter = a; render(); }, recFilter(a){ S.recFilter = a; render(); }, msgSvc(a){ S.msgSvc = a; markRead(a); render(); },
  unit(a){ S.unit = a; save(); render(); }, metric(a){ S.metric = a; render(); }, range(a){ S.range = a; render(); },
  faqCat(a){ S.faqCat = a; S.faqOpen = -1; render(); }, faq(a){ S.faqOpen = S.faqOpen===+a ? -1 : +a; render(); },
  copy(a){ try{ navigator.clipboard.writeText(a); }catch(e){} say('Copied: '+a); },
  openNotifs(){ const list = S.notifs.slice(0,30); openSheet('Notifications', `<div class="list">${list.map(n=>`<div class="li" style="align-items:flex-start"><span class="dot ${n.svc||'wl'}" style="margin-top:6px;${n.read?'opacity:.3':''}"></span><span class="grow"><span class="small" style="font-weight:${n.read?400:600}">${esc(n.text)}</span><br><span class="tiny muted">${fmtWhen(n.at)}</span></span></div>`).join('')||'<p class="muted">Nothing yet.</p>'}</div><div class="row" style="margin-top:12px">${btn('ghost sm','Mark all as read','readAll')}${btn('ghost sm','Notification settings','go','reminders')}</div>`); },
  readAll(){ S.notifs.forEach(n=>n.read=true); save(); render(); closeSheet(); },
  /* weight loss */
  dayCheck(a){ const k = iso(today()); S.wl.checks[k] = S.wl.checks[k]||{}; S.wl.checks[k][a] = !S.wl.checks[k][a]; if(S.wl.checks[k][a]) log('wl', a==='water'?'drop':'heart', a==='water'?'Drank 2 litres of water':'Moved for 30 minutes'); save(); render(); },
  logDose(){ const w = wlInfo(); if(!w) return; if(w.left<=0){ say('No doses left in your supply. Reorder to continue.'); return; }
    openSheet('Log a dose', `<div class="stack"><div class="field"><label>Date</label><input class="input" type="date" max="${iso(today())}" value="${iso(today())}" data-bind="doseD"></div>
      ${w.weekly?`<div><p class="lab" style="margin-bottom:8px">Injection site</p><div class="chips" id="sitePick">${SITES.map(s=>`<button class="chip ${s===w.nextSite?'on':''}" data-act="pickSite" data-arg="${s}">${s}</button>`).join('')}</div></div>`:''}
      <p class="small muted">${esc(w.prod.name)} ${esc(w.curStrength)} · ${w.left} left before this dose</p>${btn('primary block','Save dose','saveDose','','tick')}</div>`); S.draft.site = w.nextSite; S.draft.doseD = iso(today()); },
  pickSite(a){ S.draft.site = a; document.querySelectorAll('#sitePick .chip').forEach(c=>c.classList.toggle('on', c.dataset.arg===a)); },
  saveDose(){ const w = wlInfo(), dd = S.draft.doseD || iso(today()); if(S.wl.doses.some(x=>x.d===dd)){ say('A dose is already logged for '+fmtD(dd)); return; }
    S.wl.doses.push({ d:dd, site:w.weekly?S.draft.site:'', s:w.curStrength }); S.wl.doses.sort((a,b)=>a.d<b.d?-1:1);
    log('wl','pill',`Dose taken: ${w.prod.name} ${w.curStrength}${w.weekly?', '+S.draft.site.toLowerCase():''}`);
    if(w.left-1<=1) notify('wl', `${w.left-1} dose${w.left-1===1?'':'s'} left. Reorder now so there's no gap.`, { silent:true });
    closeSheet(); save(); render(); say('Dose logged for '+fmtD(dd,true)); },
  toggleDoseDate(a){ const i = S.wl.doses.findIndex(x=>x.d===a); if(i>=0){ S.wl.doses.splice(i,1); log('wl','pill','Removed dose for '+fmtD(a)); save(); render(); say('Dose for '+fmtD(a)+' removed'); } else { S.draft.doseD = a; ACT.logDose(); S.draft.doseD = a; const inp = document.querySelector('#sheet [data-bind="doseD"]'); if(inp) inp.value = a; } },
  delDose(a){ ACT.toggleDoseDate(a); },
  changeDoseDay(){ openSheet('Change dose day', `<p class="small muted" style="margin-bottom:12px">Pick the day that suits you. Keep at least 3 days between doses when switching.</p><div class="chips">${DAYS_L.map((d,i)=>`<button class="chip ${S.wl.doseDay===i?'on':''}" data-act="setDoseDay" data-arg="${i}">${d}</button>`).join('')}</div>`); },
  setDoseDay(a){ S.wl.doseDay = +a; S.reminders.filter(r=>r.svc==='wl'&&r.auto&&/dose|weigh-in/i.test(r.title)&&r.days.length===1).forEach(r=>r.days=[+a]); S.reminders.filter(r=>r.svc==='wl'&&r.title==='Weekly check-in').forEach(r=>r.days=[(+a+1)%7]); log('wl','cal','Dose day changed to '+DAYS_L[a]); closeSheet(); save(); render(); say('Dose day is now '+DAYS_L[a]+'. Reminders updated.'); },
  missed(){ const w = wlInfo(); openSheet('Missed a dose?', `<p class="small" style="margin-bottom:12px">${w.weekly?'If it is within 4 days of your usual dose day, take it now and carry on as normal. If it is more than 4 days, skip it and take the next dose on your usual day.':'Skip the missed tablet and take the next one at the usual time.'} <b>Never take two doses to make up.</b></p><div class="row"><a class="btn wa" href="${WA}" target="_blank" rel="noopener">${ic('wa',18)}Ask the clinical team</a>${btn('ghost','Message prescriber','go','messages')}</div>`); },
  async quickWeigh(){ const v = parseFloat(String(S.draft.quickW||'').replace(',','.')); if(!isFinite(v)||v<30||v>300){ S.draft.quickErr = 'Enter your weight in kg, for example 86.4'; return render(); }
    try{ await addWeight(iso(today()), v); S.draft = {}; render(); }catch(e){ S.draft.quickErr = e.message; render(); } },
  async saveWeight(){ const d = S.draft, v = parseFloat(String(d.wV||'').replace(',','.')), dt = d.wD || iso(today());
    if(!isFinite(v)||v<30||v>300){ d.wErr = 'Enter your weight in kg, for example 86.4'; d.wOk=''; return render(); }
    if(dt>iso(today())){ d.wErr = 'Pick today or an earlier date'; return render(); }
    const wa = parseFloat(d.wWa), hi = parseFloat(d.wHi);
    if(isFinite(wa) && wa>40 && wa<250){ if(!S.waist) S.start.waist = wa; S.waist = wa; } if(isFinite(hi) && hi>40 && hi<250){ if(!S.hips) S.start.hips = hi; S.hips = hi; }
    try{ const msg = await addWeight(dt, v); S.draft = { wOk: msg, wD: iso(today()) }; save(); render(); }catch(e){ d.wErr = e.message; d.wOk = ''; render(); } },
  async delWeight(a){ const p = S.weights.find(x=>x.d===a); if(!p) return;
    if(!p.id){ say("This weight is from your consultation, so it stays on your record."); return; }
    try{ await api('DELETE','/api/portal/weights?id='+encodeURIComponent(p.id)); S.weights = S.weights.filter(x=>x!==p); log('wl','scale','Removed weigh-in for '+fmtD(a), false); render(); say('Weigh-in removed'); }catch(e){ say(e.message); } },
  editGoal(){ openSheet('Your goal weight', `<div class="stack"><div class="field"><label>Goal (kg)</label><input class="input" type="number" inputmode="decimal" step="0.5" data-bind="goal" value="${S.goal}"></div><p class="hint">A healthy goal BMI is 18.5 to 25. For your height that is ${(18.5*(S.user.heightCm/100)**2).toFixed(0)}–${(25*(S.user.heightCm/100)**2).toFixed(0)} kg.</p>${btn('primary block','Save goal','saveGoal')}</div>`); S.draft.goal = S.goal; },
  saveGoal(){ const g = parseFloat(S.draft.goal), min = 18.5*(S.user.heightCm/100)**2, ws = wsSorted(); if(!isFinite(g) || g<min || (ws.length && g>=ws[0].w)){ say(`Choose a goal between ${min.toFixed(0)} kg and your starting weight`); return; } S.goal = g; log('wl','heart','Goal set to '+fmtW(g,'kg')); closeSheet(); save(); render(); say('Goal updated'); },
  exportWeights(){ const rows = [['Date','Weight (kg)','BMI']].concat(wsSorted().map(p=>[p.d, p.w, bmiFmt(p.w)])); download('jood-weigh-ins.csv', rows.map(r=>r.join(',')).join('\n'), 'text/csv'); say('Downloaded jood-weigh-ins.csv'); },
  ciMood(a){ S.draft.ci.mood = a; render(); },
  ciEff(a){ const c = S.draft.ci; if(a==='None') c.effects = []; else c.effects = c.effects.includes(a) ? c.effects.filter(x=>x!==a) : c.effects.concat(a); render(); },
  ciSevere(a){ S.draft.ci.severe = a==='1'; render(); },
  async sendCheckin(){ const c = S.draft.ci, note = (S.draft.ciNote||'').trim();
    try{
      const r = await api('POST','/api/portal/checkins',{ svc:'wl', mood:c.mood, effects:c.effects, severe:c.severe, note });
      S.checkins.unshift(r.checkin);
      if(r.message) S.messages.wl.push(r.message);
      log('wl','chat',`Weekly check-in sent: feeling ${c.mood.toLowerCase()}${c.effects.length?', '+c.effects.join(', ').toLowerCase():''}`, false);
      S.draft = {}; render(); say(c.severe ? 'Sent. Please call 111 now. Our clinical team will contact you too.' : 'Check-in sent to your prescriber');
    }catch(e){ say(e.message); } },
  /* ED */
  logEd(){ const e = edInfo(); if(!e) return; if(e.left<=0){ say('No tablets left. Reorder to continue.'); return; }
    const warn = e.hoursSince<24 ? `<div class="alert err">${ic('alert',18)}<span>You logged a tablet ${fmtWhen(e.last.at).toLowerCase()}. Do not take more than one in 24 hours.</span></div>` : '';
    const n = new Date(); S.draft.edAt = iso(n)+'T'+pad(n.getHours())+':'+pad(n.getMinutes()); S.draft.edR = 0; S.draft.edE = [];
    openSheet('Log a tablet', `<div class="stack">${warn}<div class="field"><label>When did you take it?</label><input class="input" type="datetime-local" max="${S.draft.edAt}" value="${S.draft.edAt}" data-bind="edAt"></div>
      <div><p class="lab" style="margin-bottom:8px">How well did it work? (you can add this later)</p><div class="chips" id="edR">${[1,2,3,4,5].map(r=>`<button class="chip" data-act="edRate" data-arg="${r}">${r}${r===1?' · not at all':r===5?' · very well':''}</button>`).join('')}</div></div>
      <div><p class="lab" style="margin-bottom:8px">Side effects</p><div class="chips" id="edE">${ED_EFFECTS.map(x=>`<button class="chip" data-act="edEff" data-arg="${x}">${x}</button>`).join('')}</div></div>
      ${btn('primary block','Save','saveEd','','tick')}</div>`); },
  edRate(a){ S.draft.edR = +a; document.querySelectorAll('#edR .chip').forEach(c=>c.classList.toggle('on', c.dataset.arg===a)); },
  edEff(a){ const l = S.draft.edE; const i = l.indexOf(a); i>=0 ? l.splice(i,1) : l.push(a); document.querySelectorAll('#edE .chip').forEach(c=>c.classList.toggle('on', l.includes(c.dataset.arg))); },
  saveEd(){ const e = edInfo(); if(!e || e.left<=0 || !S.draft.edAt){ closeSheet(); return; } S.draft.edE = S.draft.edE||[]; S.ed.uses.push({ id:uid(), at:S.draft.edAt, pid:e.st.rx.pid, s:e.st.rx.s, rating:S.draft.edR||0, effects:S.draft.edE.slice() });
    log('ed','pill',`Logged a tablet: ${e.st.prod.name} ${e.st.rx.s}${S.draft.edR?', rated '+S.draft.edR+'/5':''}`);
    if(e.left-1<=2) notify('ed', `${e.left-1} tablet${e.left-1===1?'':'s'} left. Reorder in two taps.`, { silent:true });
    closeSheet(); S.draft = {}; save(); render(); say('Logged'); },
  rateEd(a){ openSheet('How well did it work?', `<div class="chips">${[1,2,3,4,5].map(r=>`<button class="chip" data-act="setRate" data-arg="${a}:${r}">${r}/5</button>`).join('')}</div>`); },
  setRate(a){ const [id,r] = a.split(':'); const u = S.ed.uses.find(x=>x.id===id); if(u){ u.rating = +r; log('ed','star','Rated a tablet '+r+'/5'); } closeSheet(); save(); render(); },
  delEd(a){ S.ed.uses = S.ed.uses.filter(x=>x.id!==a); save(); render(); say('Entry removed'); },
  /* PD */
  savePd(){ const d = S.draft, c = pdCourse(); const due = d.pdDue ?? (c&&c.due), end = d.pdEnd ?? (c&&c.end);
    if(!due || !end){ say('Choose both dates'); return; }
    const start = addDays(parse(due),-3), days = dayDiff(end, start)+1;
    if(dayDiff(start, today())<0 && !c){ say('Your period is due too soon to start in time. Message us for advice.'); return; }
    if(days<4 || days>17){ say(days<4?'The return date must be after your due date':'That is more than 17 days. Pick an earlier return date.'); return; }
    S.pd.plan = { due, end }; S.reminders = S.reminders.filter(r=>!(r.svc==='pd'&&r.auto));
    S.reminders.push({ id:uid(), svc:'pd', title:'Start norethisterone tomorrow', date:iso(addDays(start,-1)), time:'19:00', days:[], on:true, auto:true });
    [['08:00','Morning'],['14:00','Afternoon'],['20:00','Evening']].forEach(([t,l])=>S.reminders.push({ id:uid(), svc:'pd', title:l+' tablet', days:[0,1,2,3,4,5,6], from:iso(start), until:end, time:t, on:true, auto:true }));
    log('pd','cal',`Planned period delay: start ${fmtD(start,true)}, last tablet ${fmtD(end,true)} (${days*3} tablets)`);
    S.draft = {}; save(); render(); say('Plan saved. 4 reminders added.'); },
  clearPd(){ S.pd.plan = null; S.pd.taken = {}; S.reminders = S.reminders.filter(r=>!(r.svc==='pd'&&r.auto)); save(); render(); say('Plan cleared'); },
  pdTab(a){ const [k,i] = a.split(':'); const arr = S.pd.taken[k] || [false,false,false]; arr[+i] = !arr[+i]; S.pd.taken[k] = arr; if(arr[+i]) log('pd','pill',`Norethisterone ${['morning','afternoon','evening'][i]} tablet taken (${fmtD(k)})`); save(); render(); },
  finishPd(){ const c = pdCourse(); if(!c) return; const n = pdTakenCount(); S.pd.courses.unshift({ start:c.start, end:c.end, tablets:n }); S.pd.plan = null; S.pd.taken = {}; S.reminders = S.reminders.filter(r=>!(r.svc==='pd'&&r.auto)); log('pd','tick',`Period delay course finished (${n} tablets)`); save(); render(); say('Course finished. Your period should start in 2–3 days.'); },
  /* flows */
  startFlow(a){ location.href = (initial.links.start||{})[a] || '/consultation'; },
  reorder(a){ const st = svcState(a); if(!st.rx){ ACT.startFlow(a); return; }
    if(st.inFlight && ['booked','clinical','todispatch'].includes(st.inFlight.status)){ say(`${st.inFlight.id} is already in progress`); ACT.go('orders'); return; }
    location.href = (initial.links.reorder||{})[a] || '/reorder'; },
  switchFlow(a){ S.svc = a; S.msgSvc = a; S.screen = 'messages'; S.draft = { newMsg: `I'd like to talk about switching my ${SVC[a].name.toLowerCase()} treatment.` }; markRead(a); render(); scrollTop(); },
  /* orders & plan */
  safePlace(){ openSheet('DPD safe place', `<p class="small muted" style="margin-bottom:12px">Where should DPD leave it if you're out?</p><div class="chips">${['With a neighbour','Porch','Back garden','Shed or garage','No safe place'].map(x=>`<button class="chip ${S.safePlace===x?'on':''}" data-act="setSafe" data-arg="${x}">${x}</button>`).join('')}</div>`); },
  setSafe(a){ S.safePlace = a==='No safe place'?'':a; closeSheet(); save(); render(); say(a==='No safe place'?'Safe place removed':'Safe place: '+a); },
  editAddress(){ const a = S.address; openSheet('Delivery address', `<div class="stack"><div class="field"><label>Address line</label><input class="input" data-bind="aL" value="${esc(a.line)}" autocomplete="address-line1"></div><div class="grid" style="grid-template-columns:1fr 1fr;gap:10px"><div class="field"><label>Town</label><input class="input" data-bind="aT" value="${esc(a.town)}" autocomplete="address-level2"></div><div class="field"><label>Postcode</label><input class="input" data-bind="aP" value="${esc(a.postcode)}" autocomplete="postal-code" style="text-transform:uppercase"></div></div><p class="err" id="aErr"></p>${btn('primary block','Save address','saveAddress')}<p class="hint">Changes apply to orders that haven't been dispatched yet.</p></div>`); S.draft.aL=a.line; S.draft.aT=a.town; S.draft.aP=a.postcode; },
  async saveAddress(){ const d = S.draft, line = (d.aL||'').trim(), town = (d.aT||'').trim(), pc = (d.aP||'').trim().toUpperCase(); const e = document.getElementById('aErr');
    if(!/^\d/.test(line)) return e.textContent = 'Start with your house number';
    if(!town) return e.textContent = 'Enter your town';
    if(!/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/.test(pc)) return e.textContent = 'Enter a full UK postcode, for example WF7 7HU';
    const addr = { line, town, postcode: pc.replace(/\s*(\d[A-Z]{2})$/,' $1') };
    try{ await saveDetails({ address: addr }); S.address = addr; log(null,'home','Delivery address updated'); save(); closeSheet(); render(); say('Address saved'); }catch(err){ e.textContent = err.message; } },
  doc(a){ const [type, id] = a.split(':');
    if(type==='leaflet'){ window.open('https://www.medicines.org.uk/emc/search?q='+encodeURIComponent((svcState(id).prod||{}).name||''), '_blank', 'noopener'); return; }
    const o = S.orders.find(x=>x.id===id), p = prodOf(o.svc,o.pid);
    if(type==='invoice') download(`Jood-invoice-${o.id}.html`, docHtml('Invoice '+o.id, `<p>${esc(S.user.name)}<br>${esc(S.address.line)}, ${esc(S.address.town)}, ${esc(S.address.postcode)}</p><p>Date: ${fmtDY(o.createdAt)}</p><table><tr><th>Item</th><th>Qty</th><th>Price</th></tr><tr><td>${esc(p.name)} ${esc(o.s)}</td><td>${esc(o.label)}</td><td>${money(o.price)}</td></tr><tr><td>Consultation</td><td></td><td>£0.00</td></tr><tr><td>DPD next-day delivery</td><td></td><td>£0.00</td></tr><tr><th>Total</th><td></td><th>${money(o.price)}</th></tr></table>`), 'text/html');
    else download(`Jood-prescription-${o.id}.html`, docHtml('Prescription record', `<p>Patient: ${esc(S.user.name)}, DOB ${esc(S.user.dob)}</p><table><tr><td>Medicine</td><td>${esc(p.name)} (${esc(p.generic)}) ${esc(o.s)}</td></tr><tr><td>Quantity</td><td>${esc(o.label)}</td></tr><tr><td>Prescriber</td><td>${esc(o.prescriber||PRESCRIBER)}</td></tr><tr><td>Approved</td><td>${fmtDY((o.history.find(x=>x.s==='todispatch')||o.history[0]).at)}</td></tr><tr><td>Order</td><td>${o.id}</td></tr></table>`), 'text/html');
    say('Downloaded'); },
  /* reminders */
  remToggle(a){ const r = S.reminders.find(x=>x.id===a); r.on = !r.on; save(); render(); say(r.on?'Reminder on':'Reminder off'); },
  remMore(a){ const r = S.reminders.find(x=>x.id===a); openSheet(esc(r.title), `<div class="stack"><p class="small muted">${remSchedule(r)}</p>${r.date?'':`<div><p class="lab" style="margin-bottom:8px">Days</p><div class="chips">${DAYS.map((d,i)=>`<button class="chip ${r.days.includes(i)?'on':''}" data-act="remDay" data-arg="${r.id}:${i}">${d}</button>`).join('')}</div></div>`}
    <a class="btn ghost block" href="${gcalLink(r)}" target="_blank" rel="noopener">${ic('cal',18)}Add to Google Calendar</a>${btn('ghost block','Add to iPhone / Android calendar (.ics)','icsOne',r.id,'phone')}${btn('danger block','Delete reminder','remDel',r.id,'trash')}</div>`); },
  remDay(a){ const [id,i] = a.split(':'); const r = S.reminders.find(x=>x.id===id); const n = +i; r.days = r.days.includes(n) ? r.days.filter(x=>x!==n) : r.days.concat(n).sort(); if(!r.days.length) r.days = [n]; save(); render(); ACT.remMore(id); },
  remDel(a){ S.reminders = S.reminders.filter(x=>x.id!==a); closeSheet(); save(); render(); say('Reminder deleted'); },
  newRem(){ S.draft.nrDays = [today().getDay()]; openSheet('New reminder', `<div class="stack"><div class="field"><label>What for?</label><input class="input" data-bind="nrT" placeholder="e.g. Take my tablet"></div><div class="grid" style="grid-template-columns:1fr 1fr;gap:10px"><div class="field"><label>Time</label><input class="input" type="time" value="09:00" data-bind="nrTime"></div><div class="field"><label>Service</label><select class="input" data-bind="nrS">${SVC_KEYS.map(k=>`<option value="${k}" ${S.svc===k?'selected':''}>${SVC[k].name}</option>`).join('')}</select></div></div>
    <div><p class="lab" style="margin-bottom:8px">Repeat on</p><div class="chips" id="nrDays">${DAYS.map((d,i)=>`<button class="chip ${i===today().getDay()?'on':''}" data-act="nrDay" data-arg="${i}">${d}</button>`).join('')}<button class="chip" data-act="nrDay" data-arg="all">Every day</button></div></div>${btn('primary block','Save reminder','saveRem','','tick')}</div>`); },
  nrDay(a){ let l = S.draft.nrDays; if(a==='all') l = [0,1,2,3,4,5,6]; else { const n = +a; l = l.includes(n) ? l.filter(x=>x!==n) : l.concat(n); } S.draft.nrDays = l; document.querySelectorAll('#nrDays .chip').forEach(c=>c.classList.toggle('on', c.dataset.arg!=='all' && l.includes(+c.dataset.arg))); },
  saveRem(){ const t = (S.draft.nrT||'').trim(); if(!t){ say('Give your reminder a name'); return; } if(!S.draft.nrDays.length){ say('Pick at least one day'); return; }
    S.reminders.push({ id:uid(), svc:S.draft.nrS||S.svc, title:t, days:S.draft.nrDays.slice().sort(), time:S.draft.nrTime||'09:00', on:true, auto:false }); log(S.draft.nrS||S.svc,'bell','Reminder added: '+t); closeSheet(); S.draft = {}; save(); render(); say('Reminder saved'); },
  icsAll(){ const on = S.reminders.filter(r=>r.on); if(!on.length){ say('Turn on at least one reminder first'); return; } download('jood-reminders.ics', icsFor(on), 'text/calendar'); log(null,'cal',on.length+' reminders added to phone calendar'); save(); say(isIOS()?'Tap “Add all” in the Calendar prompt':'Open the file to add it to your calendar'); },
  icsOne(a){ const r = S.reminders.find(x=>x.id===a); download('jood-reminder.ics', icsFor([r]), 'text/calendar'); say('Calendar file downloaded'); },
  async enablePush(){ if(!('Notification' in window)){ say('Notifications are not supported here. Use the calendar option.'); return; }
    let p = Notification.permission; if(p==='default'){ try{ p = await Notification.requestPermission(); }catch(e){} }
    if(p==='granted'){ S.channels.push = true; save(); render(); devicePush('Jood', 'Notifications are on. We will remind you here.'); say('Notifications on for this device'); }
    else { say('Notifications are blocked. Allow them in your browser settings, or use the calendar option.'); render(); } },
  testPush(){ const ok = devicePush('Jood reminder', S.discreet?'You have something due in your Jood portal.':'Test reminder from Jood'); say(ok ? 'Test notification sent to this device' : 'Turn on notifications for this device first, or add reminders to your calendar'); },
  chan(a){ if(a==='push' && !S.channels.push){ ACT.enablePush(); return; } S.channels[a] = !S.channels[a]; save(); render(); },
  discreet(){ S.discreet = !S.discreet; save(); render(); },
  /* messages */
  async sendMsg(a){ const t = (S.draft.newMsg||'').trim(); if(!t){ say('Write a message first'); return; }
    try{ const r = await api('POST','/api/portal/messages',{ svc:a, body:t }); S.messages[a].push(r.message); log(a,'chat','Message sent to the clinical team', false); S.draft = {}; render(); say('Sent. A prescriber replies within one working day.'); }catch(e){ say(e.message); } },
  /* account */
  editProfile(){ S.ui.editProfile = !S.ui.editProfile; S.draft = {}; render(); },
  async saveProfile(){ const d = S.draft, u = S.user, n = (d.pN??u.name).trim(), e = (d.pE??u.email).trim(), p = (d.pP??u.phone).trim();
    if(!n) { d.pErr = 'Enter your full name'; return render(); } if(!/^\S+@\S+\.\S+$/.test(e)){ d.pErr = 'Enter a valid email'; return render(); } if(p && !/^(07\d{9}|447\d{9})$/.test(p.replace(/\D/g,''))){ d.pErr = 'Enter a UK mobile number, e.g. 07700 900123'; return render(); }
    try{ await saveDetails({ user:{ name:n, email:e, phone:p } }); Object.assign(u, { name:n, email:e, phone:p, first:n.split(' ')[0] }); S.ui.editProfile = false; S.draft = {}; log(null,'user','Personal details updated'); save(); render(); say('Details saved'); }
    catch(err){ d.pErr = err.message; render(); } },
  gpShare(){ S.gpShare = !S.gpShare; log(null,'heart','GP sharing '+(S.gpShare?'turned on':'turned off')); save(); render(); },
  editGp(){ openSheet('Your GP practice', `<div class="stack"><div class="field"><label>Practice name</label><input class="input" data-bind="gpN" value="${esc(S.gp)}"></div>${btn('primary block','Save','saveGp')}</div>`); },
  saveGp(){ const v = (S.draft.gpN||'').trim(); if(v){ S.gp = v; save(); } closeSheet(); render(); say('GP practice saved'); },
  twoFA(){ S.twoFA = !S.twoFA; save(); render(); say(S.twoFA?'Two-step verification on':'Two-step verification off'); },
  changePw(){ openSheet('Change password', `<div class="stack">${pwField('Current password','pw0','current-password')}${pwField('New password','pw1','new-password')}<p class="hint">At least 8 characters with a number.</p><p class="err" id="pwErr"></p>${btn('primary block','Update password','savePw')}</div>`); },
  async savePw(){ const d = S.draft, e = document.getElementById('pwErr'); if(!d.pw0) return e.textContent='Enter your current password'; if(!d.pw1 || d.pw1.length<8 || !/\d/.test(d.pw1)) return e.textContent='Use at least 8 characters including a number';
    try{ await api('POST','/api/portal/password',{ current:d.pw0, next:d.pw1 }); closeSheet(); S.draft = {}; log(null,'lock','Password changed'); save(); say('Password updated'); }catch(err){ e.textContent = err.message; } },
  exportAll(){ const { draft, ui, fired, ...data } = S; download('jood-my-data.json', JSON.stringify(data,null,2), 'application/json'); say('Downloaded jood-my-data.json'); },
  exportRecord(){ const rows = [['Date','Time','Service','Event']].concat(S.activity.map(x=>[x.at.slice(0,10), x.at.slice(11,16), x.svc?SVC[x.svc].name:'Account', '"'+x.text.replace(/"/g,'""')+'"'])); download('jood-health-record.csv', rows.map(r=>r.join(',')).join('\n'), 'text/csv'); say('Downloaded jood-health-record.csv'); },
  deleteAcct(){ openSheet('Close your account?', `<p class="small muted" style="margin-bottom:14px">We keep prescription records for the period UK law requires, then delete them. Our team will confirm by email.</p><div class="stack" style="gap:8px">${btn('ghost block','Keep my account','closeSheet')}${btn('danger block','Request account closure','delGo')}</div>`); },
  async delGo(){ try{ await api('POST','/api/portal/messages',{ svc:S.svc, body:'Please close my Jood account.' }); closeSheet(); say('Request sent. Our team will email you to confirm.'); }catch(e){ say(e.message); } },
};
async function addWeight(dt, v){
  const ws = wsSorted(); const prev = ws.filter(p=>p.d<dt).slice(-1)[0];
  const r = await api('POST','/api/portal/weights',{ date:dt, weightKg:v });
  const ex = S.weights.find(p=>p.d===dt && p.id); if(ex){ ex.w = v; ex.id = r.id; } else S.weights.push({ d:dt, w:v, id:r.id });
  const diff = prev ? v - prev.w : 0;
  const txt = `Weigh-in: ${fmtW(v,'kg')}${prev?' ('+(diff<=0?'down ':'up ')+fmtDiff(diff,'kg')+')':''}`;
  log('wl','scale',txt, false);
  const all = wsSorted(), start = all[0].w, lostPct = (start - v)/start*100;
  [5,10,15].forEach(m=>{ const k = 'ms'+m; if(lostPct>=m && !S[k]){ S[k] = true; notify('wl', `Milestone: you've lost ${m}% of your body weight. Brilliant.`); } });
  save();
  say('Saved: '+fmtW(v,S.unit)+(prev?' ('+(diff<=0?'down ':'up ')+fmtDiff(diff,S.unit)+')':''));
  return 'Saved for '+fmtD(dt,true)+': '+txt.replace('Weigh-in: ','');
}
function addrText(a){ return [a.line, a.town, a.postcode].map(x=>String(x||'').trim()).filter(Boolean).join(', '); }
async function saveDetails(over){
  const u = Object.assign({ name:S.user.name, email:S.user.email, phone:S.user.phone }, over.user||{});
  await api('POST','/api/portal/profile',{ name:u.name, email:u.email, phone:u.phone||'', address: addrText(over.address || S.address) });
}
function markRead(svc){
  const l = (S.messages[svc]||[]).filter(m=>!m.me && !m.read); if(!l.length) return;
  l.forEach(m=>m.read=true); api('POST','/api/portal/messages/read',{ svc }).catch(()=>{});
}
/* ================= Events ================= */
function setPath(obj, path, val){ const ks = path.split('.'); let o = obj; ks.slice(0,-1).forEach(k=>{ o = o[k] = o[k] || {}; }); o[ks[ks.length-1]] = val; }
const CHG = {
  remTime(v,id){ const r = S.reminders.find(x=>x.id===id); if(r && v){ r.time = v; save(); render(); say('Reminder moved to '+v); } },
};
const LIVE = {
  faq(){ S.faqOpen = -1; const q = (S.draft.faqQ||'').trim().toLowerCase(); const l = FAQS.filter(f=>(S.faqCat==='All'||f.cat===S.faqCat) && (!q || (f.q+' '+f.a).toLowerCase().includes(q))); const el = document.getElementById('faqList'); if(el) el.innerHTML = faqItems(l); },
  pd(){ clearTimeout(LIVE._t); LIVE._t = setTimeout(()=>{ const a = document.activeElement && document.activeElement.id; render(); const el = a && document.getElementById(a); if(el) el.focus(); }, 500); },
};
on('click', e => {
  const b = e.target.closest('[data-act]'); if(!b || b.disabled) return;
  if(b.tagName==='A') return;
  const fn = ACT[b.dataset.act]; if(fn){ e.preventDefault(); fn(b.dataset.arg, b); }
});
on('input', e => {
  const el = e.target;
  if(el.dataset.bind){ S.draft[el.dataset.bind] = el.value; }
  if(el.dataset.path){ setPath(S, el.dataset.path, el.type==='checkbox' ? el.checked : el.value); save(); }
  if(el.dataset.otp!==undefined){ el.value = el.value.replace(/\D/g,'').slice(-1); const all = [...document.querySelectorAll('[data-otp]')];
    if(el.value && +el.dataset.otp<5) all[+el.dataset.otp+1].focus(); if(all.every(x=>x.value)) ACT.verifyOtp(); }
  if(el.dataset.live && LIVE[el.dataset.live]) LIVE[el.dataset.live]();
});
on('change', e => {
  const el = e.target;
  if(el.dataset.change && CHG[el.dataset.change]) CHG[el.dataset.change](el.value, el.dataset.arg, el);
  if(el.dataset.path && el.type==='checkbox'){ setPath(S, el.dataset.path, el.checked); save(); }
  if(el.dataset.bind && el.type==='date'){ S.draft[el.dataset.bind] = el.value; if(el.dataset.live) LIVE[el.dataset.live](); }
});
on('keydown', e => {
  if(e.key==='Escape') closeSheet();
  if(e.key==='Backspace' && e.target.dataset.otp!==undefined && !e.target.value){ const i = +e.target.dataset.otp; if(i>0) document.querySelector(`[data-otp="${i-1}"]`).focus(); }
  if(e.key==='Enter' && e.target.matches('[data-bind="quickW"]')) ACT.quickWeigh();
});
on('paste', e => { if(e.target.dataset.otp===undefined) return; const t = (e.clipboardData.getData('text')||'').replace(/\D/g,'').slice(0,6); if(t.length===6){ e.preventDefault(); document.querySelectorAll('[data-otp]').forEach((x,i)=>x.value=t[i]); ACT.verifyOtp(); } });



/* ================= Boot ================= */
function buildState(I){
  const p = I.prefs || {}, dd = today().getDay();
  const s = {
    screen:'home', tab:{ wl:'doses', ed:'log', pd:'course' }, ordersFilter:'all', recFilter:'all', faqCat:'All', faqOpen:-1, msgSvc:null,
    unit: p.unit==='st' ? 'st' : 'kg', metric:'weight', range:'all', discreet: p.discreet!==false, twoFA: p.twoFA!==false, fired: p.fired||{}, draft:{}, ui:{},
    svc: SVC_KEYS.includes(p.svc) ? p.svc : I.svc,
    user: Object.assign({}, I.user, { heightCm: I.user.heightCm || p.heightCm || null }),
    address: I.address, safePlace: p.safePlace||'', idVerified: !!I.idVerified, gpShare: !!p.gpShare, gp: p.gp || 'Not set',
    channels: Object.assign({ email:true, sms:false, whatsapp:false, push:false }, p.channels||{}),
    orders: I.orders, weights: I.weights, waist: p.waist||null, hips: p.hips||null, start: p.start||{ waist:null, hips:null },
    wl: Object.assign({ doses:[], doseDay:dd, checks:{} }, p.wl||{}),
    checkins: I.checkins, ed: Object.assign({ uses:[] }, p.ed||{}), pd: Object.assign({ courses:[], plan:null, taken:{} }, p.pd||{}),
    plan:{}, reminders: Array.isArray(p.reminders) ? p.reminders : null,
    messages: Object.assign({ wl:[], ed:[], pd:[] }, I.messages),
    ms5:!!p.ms5, ms10:!!p.ms10, ms15:!!p.ms15,
  };
  // Until the patient sets one, suggest a goal 15% below their first recorded weight.
  const first = I.weights.slice().sort((a,b)=>a.d<b.d?-1:1)[0];
  s.goal = p.goal || (first ? Math.round(first.w*0.85) : 70);
  const read = new Set(p.readNotifs||[]);
  s.notifs = (I.notifs||[]).concat(p.localNotifs||[]).map(n=>Object.assign({}, n, { read: !!n.read || read.has(n.id) })).sort((a,b)=>a.at<b.at?1:-1);
  s.activity = (I.activity||[]).concat((p.activity||[]).map(x=>Object.assign({}, x, { local:true }))).sort((a,b)=>a.at<b.at?1:-1);
  return s;
}
S = buildState(initial);
if(!S.reminders){ S.reminders = []; SVC_KEYS.filter(k=>svcState(k).mode==='active').forEach(autoReminders); }
render();
return () => { clearTimeout(saveT); clearTimeout(toastT); disposers.forEach(fn=>fn()); };
}
