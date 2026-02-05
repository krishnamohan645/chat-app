// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js",
);

const firebaseConfig = {
  apiKey: "AIzaSyBxCMTEzTUvqcy7FCWh0tQZqph2nXnUYw8",
  authDomain: "chatapp-4a4f0.firebaseapp.com",
  projectId: "chatapp-4a4f0",
  storageBucket: "chatapp-4a4f0.firebasestorage.app",
  messagingSenderId: "139854521979",
  appId: "1:139854521979:web:a2b51882a9809c5a6124de",
  measurementId: "G-KV889K90M3",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background message:", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon.png",
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions,
  );
});
