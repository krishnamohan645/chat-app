const admin = require("firebase-admin");
// const serviceAccount = require("./firebase.serviceAccount.json");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;