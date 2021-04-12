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

function addAverageData(company, location, subLocation, averageData) {
  database
    .doc(company)
    .collection("Data")
    .doc(location)
    .collection("Averages")
    .doc("Floors")
    .collection(subLocation)
    .add({ ...averageData })
    .then(() => console.log(`Added Average Successfully`))
    .catch((err) => {
      console.log("Error creating documents", err);
    });
}

module.exports = {
  create: addAverageData,
};
