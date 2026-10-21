/* Firebase Cloud Messaging service worker for SarkariResultsNow exam alerts.
 * Registered by src/lib/push-client.ts with the public Firebase web config in the query string.
 * Keep FIREBASE_SDK_VERSION in step with the "firebase" version in package.json. */
/* global importScripts, firebase */

var FIREBASE_SDK_VERSION = '13.0.0';

// Notifications shown by an open page (foreground messages) carry { url } in their data.
// Notifications FCM displays itself carry FCM_MSG and are opened by the Firebase SDK via fcmOptions.link.
self.addEventListener('notificationclick', function (event) {
  var data = event.notification.data || {};
  if (data.FCM_MSG || !data.url) return;
  event.notification.close();

  var target;
  try {
    target = new URL(data.url, self.location.origin);
  } catch (e) {
    return;
  }
  if (target.origin !== self.location.origin) return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clients) {
      for (var i = 0; i < clients.length; i++) {
        if (clients[i].url === target.href && 'focus' in clients[i]) return clients[i].focus();
      }
      return self.clients.openWindow(target.href);
    })
  );
});

importScripts(
  'https://www.gstatic.com/firebasejs/' + FIREBASE_SDK_VERSION + '/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/' + FIREBASE_SDK_VERSION + '/firebase-messaging-compat.js'
);

var params = new URL(self.location.href).searchParams;
var config = {
  apiKey: params.get('apiKey'),
  projectId: params.get('projectId'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
};

if (config.apiKey && config.projectId && config.messagingSenderId && config.appId) {
  firebase.initializeApp(config);
  // Background messages with a notification payload are displayed by the SDK; no onBackgroundMessage
  // handler is added, which would show a second copy.
  firebase.messaging();
}
