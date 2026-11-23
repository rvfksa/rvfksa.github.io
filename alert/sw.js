/* Emergency alert - trial. Only listens for alerts; it does not touch any other part of the app. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let d = {}; try{ d = e.data ? e.data.json() : {}; }catch(err){ d = { body: e.data ? e.data.text() : '' }; }
  const id = d.id || '';
  e.waitUntil(self.registration.showNotification(d.title || 'EMERGENCY ALERT', {
    body: d.body || 'Leave the area now.', tag: 'rvf-alert', renotify: true, requireInteraction: true, silent: false,
    vibrate: [800, 300, 800, 300, 800, 300, 800, 300, 800], icon: '/alert/icon-192.png', badge: '/alert/icon-192.png',
    data: { url: '/alert/?a=' + encodeURIComponent(id) }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/alert/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for(const c of list){ if(c.url.indexOf('/alert/') >= 0 && 'focus' in c){ c.navigate(url); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
