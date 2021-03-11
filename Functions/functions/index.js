// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require("firebase-functions");

// The Firebase Admin SDK to access Firestore.
const admin = require("firebase-admin");
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.batteryLevelNotify = functions.firestore
  .document(`Companies/{companyName}/Data/{structure}`)
  .onUpdate((snap, context) => {
    const mainUnits = snap.data()["Main Units"]; // array of units in floor
    functions.logger.log(
      `Battery Level for ${context.params.structure} is ${mainUnits["Unit 1"]["Battery Level"]}%`
    );
    return null; //snap.ref.set({mainUnits}, {merge: false});
  });
