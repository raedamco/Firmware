var udp = require('dgram');
const admin = require('firebase-admin');

let serviceAccount = require('./serverKey.json');

const debug = true;
var PORT = 15100

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();
var server = udp.createSocket('udp4');

var occupiedSpots = [];
var capacity;


// emits when any error occurs
server.on('error',function(error){
  log('Error: ' + error);
  server.close();
});

// listen for packets
server.on('message',function(msg, info) {
    var SensorID = msg.readUInt32LE(0,1);
    var Time = new Date();
    log("RECIEVED MSG: " + info);
    var Distance = ((((msg.readUInt32LE(5) * 0.000001) * 343)/2) * 39.37);
    var OccupiedDistance = 48; //Object is within 4 feet (48in)

    if (msg.readUIntBE(2,3) == 1){
        var SensorType = "Ultrasonic";
    }else{
        var SensorType = "Other Sensor";
    }

    if (Distance <= OccupiedDistance) {
        var Occupied = true;
        var Occupant = "";
    }else{
        var Occupied = false;
        var Occupant = "";
    }
    log("---------------------------------------------------------------");
    log("Time: " + Time);
    log("Sensor ID: " + SensorID);
    log("Sensor Type: " + SensorType);
    log("Occupied: " + Occupied);
    log("Distance of: " + Distance);

    appendData(String(SensorID), Occupied, Occupant, Time, Distance);
    queryDatabase();
    databaseListner();
});

function appendData(sensorID, state, occupant, time, distance) {
    db.collection('Demos').doc('Parking Structure 1').collection("Floor 1").doc(sensorID).collection("Data").add({
        ["Occupied"]: state,
        ["Occpant"]: occupant,
        ["Time"]: time,
        ["Distance (in)"]: distance
    }).then(ref => {
    }).catch(err => {
        log('Error getting documents', err);
    });
    updateDocumentInfo(sensorID, state, occupant);
}

function updateDocumentInfo(sensorID, state, occupant){
    db.collection('Demos').doc('Parking Structure 1').collection("Floor 1").doc(sensorID).get().then(doc => {
            db.collection('Demos').doc('Parking Structure 1').collection("Floor 1").doc(sensorID).update({
                "Occupancy.Occupied": state,
                "Occupancy.Occupant": occupant,
            }).catch(err => {
                log('Error getting documents', err);
            });
    }).catch(err => {
        log('Error getting document', err);
    });
}

//emits when socket is ready and listening for datagram msgs
server.on('listening',function(){
  var address = server.address();
  log('Server is listening at port: ' + address.port);
  log('Server ip: ' + address.address);
  log('Server is IP4/IP6: ' + address.family);
});


//emits after the socket is closed using socket.close();
server.on('close',function(){
  log('Socket is closed !');
});

server.bind(PORT);


function queryDatabase(){
    db.collection("Demos").doc("Parking Structure 1").get().then(doc => {
        capacity = doc.data()["Capacity"]["Capacity"];
    });

    db.collection("Demos").doc("Parking Structure 1").collection("Floor 1").get().then(snapshot => {
        snapshot.forEach(doc => {
            if (doc.data()["Occupancy"]["Occupied"] == true){
                if (occupiedSpots.includes(doc.id) == false){
                    occupiedSpots.push(doc.id);
                }
            }
        });
        updateFloorInfo("Floor 1", occupiedSpots.length);
        updateStructureInfo("Parking Structure 1", occupiedSpots.length);
    });
}

function databaseListner(){
    db.collection("Demos").doc("Parking Structure 1").collection("Floor 1").onSnapshot(function(snapshot) {
        snapshot.docChanges().forEach(function(change) {
            if (change.type === "modified") {
                if (change.doc.data()["Occupancy"]["Occupied"] == true) {
                    if (occupiedSpots.includes(change.doc.id) == false){
                        occupiedSpots.push(change.doc.id);
                    }
                }else{
                    if (occupiedSpots.includes(change.doc.id)){
                        var index = occupiedSpots.indexOf(change.doc.id);
                        if (index > -1) {
                          occupiedSpots.splice(index, 1);
                        }
                    }
                }
            }
            updateFloorInfo("Floor 1", occupiedSpots.length);
            updateStructureInfo("Parking Structure 1", occupiedSpots.length);
        });
    });
}

function updateFloorInfo(floor, available){
    db.collection('Demos').doc('Parking Structure 1').update({
        ["Floor Data." + floor + ".Available"]: (capacity - available),
    }).catch(err => {
        log('Error getting documents', err);
    });
}

function updateStructureInfo(structure, available){
    db.collection('PSU').doc(structure).update({
        "Capacity.Available": (capacity - available),
    }).catch(err => {
        log('Error getting documents', err);
    });
}






//Only log when debugging not production
function log(message) {
  if (debug) {
    console.log(message);
  }
}
