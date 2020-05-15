var udp = require('dgram');
const admin = require('firebase-admin');

let serviceAccount = require('./serverKey.json');

const debug = true;
var PORT = 15000

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
    var Time = new Date();
    log("---------------------------------------------------------------------------------------------------------------------------------------------");
    log("PACKET RECIEVED: LENGTH: [" + msg.length + "] | ADDRESS: [" + info.address + "] | PORT: [" + info.port + "] | TIME: [" + Time + "]");

    var SensorID = msg.readUInt32LE(0,1);


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

    log("SENSOR ID: [" + SensorID + "] | SENSOR TYPE: [" + SensorType + "] | DISTANCE: [" + Distance + "] | OCCUPIED: [" + Occupied + "]");

    appendData(String(SensorID), Occupied, Occupant, Time, Distance);
    queryDatabase();
    databaseListner();
});
// adds data entry for spot
async function appendData(sensorID, state, occupant, time, distance) {
    //Check if sensor exists in the database before adding data, ensures random data is not added.
    db.collection('PSU').doc('Parking Structure 1').collection("Floor 2").doc(sensorID).get().then(doc => {
        if (!doc.exists) 
        {
          log('DOCUMENT DOES NOT EXIST FOR SENSOR ID: ' + sensorID);
        } else 
        {
            var old_data = db.collection("PSU").doc('Parking Structure 1').collection("Floor 2").doc(sensorID).collection("Data").orderBy("Time", "desc").limit(1).get().then(async function(querySnapshot){return querySnapshot;}
            
            if(old_data.data().Occupant == occupant && old_data.data().Occupied == state)// checks for change in status if not log added to current doc
            {
                
                old_data.update({
                    "Distance List": old_data.data()["Distance List"].push(old_data.data()["Distance (in)"]),
                    "Distance (in)": distance,
                    "Time.List": old_data.data()["Time"]["List"].push(old_data.data()["Time"]["End"]),
                    "Time.End": time
                }).catch(err => {
                    log('Error getting documents', err);
                });
            }
            else
            {    
                db.collection('PSU').doc('Parking Structure 1').collection("Floor 2").doc(sensorID).collection("Data").add({
                    ["Occupied"]: state,
                    ["Occupant"]: occupant,
                    ["Time"]["End"]: time,
                    ["Time"]["Start"]: time,
                    ["Time"]["List"]: [time],
                    ["Distance List"]: [distance],
                    ["Distance (in)"]: distance
                }).then(ref => {
                }).catch(err => {
                    log('Error getting documents', err);
                });
                updateDocumentInfo(sensorID, state, occupant);
            }
        }
    }).catch(err => {
        log('Error getting document' + err);
    });
}
// udpdates spot info itself in database 
function updateDocumentInfo(sensorID, state, occupant){
    db.collection('PSU').doc('Parking Structure 1').collection("Floor 2").doc(sensorID).get().then(doc => {
        db.collection('PSU').doc('Parking Structure 1').collection("Floor 2").doc(sensorID).update({
            "Occupancy.Occupied": state,
            "Occupancy.Occupant": occupant,
        }).catch(err => {
            log('Error getting documents', err);
        });
        log("DATABAES UPDATED FOR SENSOR ID: " + sensorID);
    }).catch(err => {
        log('Error getting document', err);
    });
}

//emits when socket is ready and listening for datagram msgs
server.on('listening',function(){
  var address = server.address();
  log("SERVER LISTENING ON PORT : " + address.port + " | SERVER IP: " + address.address + " | SERVER TYPE: " + address.family);
});


//emits after the socket is closed using socket.close();
server.on('close',function(){
  log('Socket is closed !');
});

server.bind(PORT);


function queryDatabase(){
    db.collection("PSU").doc("Parking Structure 1").get().then(doc => {
        capacity = doc.data()["Capacity"]["Capacity"];
    });

    db.collection("PSU").doc("Parking Structure 1").collection("Floor 2").get().then(snapshot => {
        snapshot.forEach(doc => {
            if (doc.data()["Occupancy"]["Occupied"] == true){
                if (occupiedSpots.includes(doc.id) == false){
                    occupiedSpots.push(doc.id);
                }
            }
        });
        updateFloorInfo("Floor 2", occupiedSpots.length);
        updateStructureInfo("Parking Structure 1", occupiedSpots.length);
    });
}

function databaseListner(){
    db.collection("PSU").doc("Parking Structure 1").collection("Floor 2").onSnapshot(function(snapshot) {
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
            updateFloorInfo("Floor 2", occupiedSpots.length);
            updateStructureInfo("Parking Structure 1", occupiedSpots.length);
        });
    });
}

function updateFloorInfo(floor, available){
    db.collection('PSU').doc('Parking Structure 1').update({
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
