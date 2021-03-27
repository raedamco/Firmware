// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require("firebase-functions");

// The Firebase Admin SDK to access Firestore.
const admin = require("firebase-admin");
const { user } = require("firebase-functions/lib/providers/auth");
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
    const db = admin.firestore();
    const mainUnits = snap.after.data()["Main Units"]; // array of units in floor
    const users = db.collection(`Users`).doc(`Companies`).collection(`Users`);
    updateUsers(users, context, mainUnits);

    return null; //snap.ref.set({mainUnits}, {merge: false});
  });

async function updateUsers(users, context, mainUnits) {
  const userMatches = await users
    .where("Companies", `array-contains`, `${context.params.companyName}`)
    .get();
  if (!userMatches.empty) {
    userMatches.forEach((doc) => {
      const theMessages = doc.data().messages;
      theMessages.push(
        `Battery Level for ${context.params.structure} is ${mainUnits["Unit 1"]["Battery Level"]}%`
      );
      users.doc(`${doc.id}`).update({
        messages: theMessages,
      });
    });
  } else {
    functions.logger.log("NO matching Users for Unit");
  }
}
