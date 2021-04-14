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
async function read(company, location, subLocation, spotId) {
  //const spotId = spotData.Info["Spot ID"];
  const originalData = database
    .doc(company)
    .collection("Data")
    .doc(location)
    .collection(subLocation)
    .doc(`${spotId}`)
    .get()
    // .then((originalData) =>
    //   console.log(
    //     `Retrieved Spot  ${originalData.data().Info["Spot ID"]} Successfully`
    //   )
    // )
    .catch((err) => {
      console.log("Error getting documents", err);
    });
  console.log(await originalData.fields());
  // console.log(
  //   `Retrieved Spot  ${await originalData.data().Info["Spot ID"]} Successfully`
  // );
}
//TODO make read work
module.exports = {
  create: addSpot,
  read: read,
};
