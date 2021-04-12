const admin = require("firebase-admin");
let serviceAccount = require("./serverKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
let db = admin.firestore();
var database = db.collection("Companies");
db.settings({
  ignoreUndefinedProperties: true,
});

function addSpot(company, location, subLocation, spotData) {
  const spotId = spotData.Info["Spot ID"];
  database
    .doc(company)
    .collection("Data")
    .doc(location)
    .collection(subLocation)
    .doc(`${spotId}`)
    .set({
      ...spotData,
    })
    .then(() => console.log(`Added Spot Successfully ${spotId}`))
    .catch((err) => {
      console.log("Error getting documents", err);
    });
}

module.exports = {
  create: addSpot,
};
