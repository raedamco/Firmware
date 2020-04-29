var udp = require('dgram');
const admin = require('firebase-admin');
const functions = require('firebase-functions');

let serviceAccount = require('./serverKey.json');

const debug = true;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();

exports.onItemCreation = functions.firestore.document('Forms').onCreate(async(snapshot, context) => {
    const data = await snapshot.ref.get()
    return admin.firestore().collection('mail').add({
        to: ["omar@theoryparking.com"],
        message: {
            subject: '',
            html: data.data().name,
        }
    }).then(() => console.log('Queued email for delivery!'));
});

//Only log when debugging not production
function log(message) {
  if (debug) {
    console.log(message);
  }
}
