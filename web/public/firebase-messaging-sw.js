/* Background push handler.
 *
 * Runs as its own service worker, separate from the PWA's Workbox worker, so a
 * rebuild of the app shell cannot take reminders down with it. Firebase looks
 * for this file at exactly this path and name.
 *
 * The config below is duplicated from the app rather than imported: a service
 * worker cannot read Vite's env at runtime. These values are public — they ship
 * in the app bundle either way — and access is governed by firestore.rules.
 */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyBGWtRmLJxjzEGjIw_ZcBhaC1wZ1bfyOz0',
  authDomain: 'focus-pet-g8.firebaseapp.com',
  projectId: 'focus-pet-g8',
  storageBucket: 'focus-pet-g8.firebasestorage.app',
  messagingSenderId: '549233571924',
  appId: '1:549233571924:web:f9b68459f46cf9c49d15c1',
})

var messaging = firebase.messaging()

messaging.onBackgroundMessage(function (payload) {
  var title = (payload.notification && payload.notification.title) || 'Focus Pet'
  var body = (payload.notification && payload.notification.body) || ''

  self.registration.showNotification(title, {
    body: body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    // One tag per topic so a second reminder replaces the first instead of
    // stacking up into a wall of identical notifications after a long absence.
    tag: (payload.data && payload.data.tag) || 'focus-pet-reminder',
    renotify: true,
    data: { url: '/' },
  })
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ('focus' in list[i]) return list[i].focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow('/')
    }),
  )
})
