const admin = require("firebase-admin");
const serviceAccount = require("../serverKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const database = db.collection("Users").doc("Companies").collection("Users");

async function create(newUser) {
  return await database.doc(newUser.UUID).set(newUser);
}
async function list() {
  return await database.get();
}
async function read(userID) {
  return await database.doc(userID);
}
module.exports = {
  create,
  list,
  read,
};
