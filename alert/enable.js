/* Emergency alerts: asks once, on the phone itself. Loaded from the app a few seconds after sign-in. Does nothing else. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
const VAPID = 'BLhT6usaFwf08QY1YCpyWiVKOTB9KEoPvWCn7drhvd4tGXBjrHKiEeVuTPRS3xVCncb-KToH9qwoc6bO6ePu9go';
const ls = { get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k, v){ try{ localStorage.setItem(k, v); }catch(e){} } };
(async () => {
  if(!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window) || Notification.permission === 'denied') return;
  const app = initializeApp({ apiKey:"AIzaSyA-IRsoL3cy92qw6QC8_q4dThg7ydMXo-w", authDomain:"mechine-reader-test.firebaseapp.com", projectId:"mechine-reader-test", appId:"1:526829266334:web:8c5ad1d3dd4ed4ea2ee28f" }, 'alertEnable');
  const auth = getAuth(app), db = getFirestore(app); await auth.authStateReady(); const u = auth.currentUser; if(!u) return;
  let id = ls.get('rvfAlertId:' + u.uid);
  if(!id){ try{ const s = await getDoc(doc(db, 'uidIndex', u.uid)); id = s.exists() ? s.data().loginId : ''; }catch(e){} if(id) ls.set('rvfAlertId:' + u.uid, id); }
  if(!id) return;
  const b64 = (s) => { const p = '='.repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map(c => c.charCodeAt(0))); };
  async function register(){
    const reg = await navigator.serviceWorker.register('/alert/sw.js', { scope:'/alert/' }).then(() => navigator.serviceWorker.ready);
    let sub = await reg.pushManager.getSubscription(); if(!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:b64(VAPID) });
    const j = JSON.parse(JSON.stringify(sub)), key = id + '|' + j.endpoint.slice(-40);
    if(ls.get('rvfAlertSaved') === key) return;   // already saved for this phone: no write
    await setDoc(doc(db, 'config', 'alertSub_' + id), { data:{ id, name:'', sub:j, at:Date.now(), ua:navigator.userAgent.slice(0, 120) } }); ls.set('rvfAlertSaved', key);
  }
  if(Notification.permission === 'granted'){ try{ await register(); }catch(e){} return; }
  try{ if(sessionStorage.getItem('rvfAlertLater')) return; }catch(e){}
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:99990;max-width:460px;margin:0 auto;background:#fff;border-radius:18px;box-shadow:0 8px 30px rgba(15,23,42,.25);padding:14px 16px;font:600 14px Inter,system-ui,sans-serif;color:#0f172a;display:flex;align-items:center;gap:10px;flex-wrap:wrap;';
  bar.innerHTML = '<span style="flex:1;min-width:180px">Turn on emergency alerts on this phone</span><button id="aeNo" style="border:0;background:#eef2ff;color:#4f46e5;border-radius:12px;padding:9px 14px;font:inherit;cursor:pointer">Later</button><button id="aeYes" style="border:0;background:#dc2626;color:#fff;border-radius:12px;padding:9px 16px;font:inherit;cursor:pointer">Turn on</button>';
  document.body.appendChild(bar);
  bar.querySelector('#aeNo').onclick = () => { try{ sessionStorage.setItem('rvfAlertLater', '1'); }catch(e){} bar.remove(); };
  bar.querySelector('#aeYes').onclick = async () => { try{ const p = await Notification.requestPermission(); bar.remove(); if(p === 'granted') await register(); else try{ sessionStorage.setItem('rvfAlertLater', '1'); }catch(e){} }catch(e){ bar.remove(); } };
})();
