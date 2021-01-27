//
//  UDP_Server.js
//  Raedam
//
//  Created on 5/13/2020. Modified on 9/21/2020 by Omar Waked.
//  Copyright © 2020 Raedam. All rights reserved.
//
// This file holds code for the UDP communication between the sensors -> server -> database

///////////////////////////////////////////////////////////////////////////////////////////////////////////
var udp = require('dgram');
const admin = require('firebase-admin');

let serviceAccount = require('./serverKey.json');

const debug = true;
var PORT = 15000

//Server bot post to slack
var slack = require('slack-notify')('https://hooks.slack.com/services/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');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();
var server = udp.createSocket('udp4');

var occupiedSpots = [];
var unoccupiedSpots = [];
var capacity;

// emits when any error occurs
server.on('error',function(error){
  log('Error: ' + error);
  server.close();
});

// listen for packets
server.on('message',function(msg, info) {
    if (msg.length == 8 || msg.length == 3){
        var Time = new Date();
        log("---------------------------------------------------------------------------------------------------------------------------------------------");
        log("PACKET RECIEVED: LENGTH: [" + msg.length + "] | ADDRESS: [" + info.address + "] | PORT: [" + info.port + "] | TIME: [" + Time + "]");

        var SensorID = msg.readUIntLE(0,1);

        var Distance = ((((msg.readUIntLE(1,2) * 0.000001) * 343)/2) * 39.37);
        Distance = Distance.toFixed(3);
        Distance = parseFloat(Distance,10);
        var OccupiedDistance = 48; //Object is within 4 feet (48in)

        if (Distance <= OccupiedDistance) {
            var Occupied = true;
            var Occupant = "";
        }else{
            var Occupied = false;
            var Occupant = "";
        }

        log("SENSOR ID: [" + SensorID + "] | DISTANCE: [" + Distance + "] | OCCUPIED: [" + Occupied + "]");

        appendData(String(SensorID), Occupied, Occupant, Time, Distance);
        queryDatabase();
        databaseListner();
    }else{
        let stringHex = msg.toString('hex');
        var errorMessage = ("PACKET RECIEVED FUNCTION ERROR. RECIEVED PAKCET WITH LENGTH OF: " + msg.length + ". PACKET INFO: " + stringHex);
        log(errorMessage);
        sendSlackBotMessage(errorMessage);
    }


});
// adds data entry for spot
async function appendData(sensorID, state, occupant, time, distance) {
    //Check if sensor exists in the database before adding data, ensures random data is not added.
    db.collection("Companies").doc("Portland State University").collection("Data").doc('Parking Structure 1').collection("Floor 2").doc(sensorID).get().then(doc => {

        if (!doc.exists)
        {
          log('DOCUMENT DOES NOT EXIST FOR SENSOR ID: ' + sensorID);
        } else
        {
            test_function(sensorID, state, occupant, time, distance);
        }
        }).catch(err => {
        //log('Error getting document' + err);
    });
}

async function test_function(sensorID, state, occupant, time, distance)
{
    db.collection("Companies").doc("Portland State University").collection("Data").doc('Parking Structure 1').collection("Floor 2").doc(sensorID).collection("Data").get().then(snap => { //CHECK IF THERE ARE DOCUMENTS IN COLLECTION BEFORE MERGING, OTHERWISE ADD FIRST DOCUMENT
        if (snap.size == 0) {
            db.collection("Companies").doc("Portland State University").collection("Data").doc('Parking Structure 1').collection("Floor 2").doc(sensorID).collection("Data").add({
                "Occupied": state,
                "Occupant": occupant,
                Time: {
                    Begin: time,
                    End: time,
                    History: [time]
                },
                "Distances": [distance],
            }).then(ref => {
            }).catch(err => {
                log('Error getting documents', err);
            });
            updateDocumentInfo(sensorID, state, occupant);
        }else{
            //RUN LOGIC HERE TO SEE IF DATA SHOULD BE MERGED WITH EXISITNG DOCUMENT OR CREATE NEW DOCUMENT
            var old_data = db.collection("Companies").doc("Portland State University").collection("Data").doc('Parking Structure 1').collection("Floor 2").doc(sensorID).collection("Data").orderBy("Time.End", "desc").limit(1).get().then(async function(querySnapshot)
            {
                querySnapshot.forEach(async function(doc)
                {
                    if(doc.data()["Occupant"] == occupant && doc.data()["Occupied"] == state)// checks for change in status if not log added to current doc
                    {
                        var the_test = await doc.data()["Distances"]
                        typeof the_test;
                        the_test.push(distance)

                        var temp_history = await doc.data()["Time"]["History"]
                        typeof temp_history;
                        temp_history.push(time)

                        db.collection("Companies").doc("Portland State University").collection("Data").doc('Parking Structure 1').collection("Floor 2").doc(sensorID).collection("Data").doc(doc.id).set({
                            Distances: the_test,
                            Time: {
                                History:  temp_history,
                                End: time,
                            }
                        }, { merge: true });
              }else{
                  log("CHANGE IN OCCUPANT OR OCCUPIED STATUS");
                  // code to make new
                  db.collection("Companies").doc("Portland State University").collection("Data").doc('Parking Structure 1').collection("Floor 2").doc(sensorID).collection("Data").add({
                    "Occupied": state,
                    "Occupant": occupant,
                     Time: {
                     Begin: time,
                     End: time,
                     History: [time]
                },
                "Distances": [distance],
                }).then(ref => {
                  }).catch(err => {
                      log('Error getting documents', err);
                  });
                    updateDocumentInfo(sensorID, state, occupant);
              }

                });

                return querySnapshot;
            }).catch(function(error){
                 // log('Error getting documents', err);
            });
        }
    });
}
// udpdates spot info itself in database
function updateDocumentInfo(sensorID, state, occupant){
    db.collection("Companies").doc("Portland State University").collection("Data").doc('Parking Structure 1').collection("Floor 2").doc(sensorID).get().then(doc => {
        db.collection("Companies").doc("Portland State University").collection("Data").doc('Parking Structure 1').collection("Floor 2").doc(sensorID).update({
            "Occupancy.Occupied": state,
            "Occupancy.Occupant": occupant,
        }).catch(err => {
            log('Error getting documents', err);
        });
        log("DATABASE UPDATED FOR SENSOR ID: " + sensorID);
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
    db.collection("Companies").doc("Portland State University").collection("Data").doc('Parking Structure 1').get().then(doc => {
        capacity = doc.data()["Capacity"]["Capacity"];
    });

    db.collection("Companies").doc("Portland State University").collection("Data").doc('Parking Structure 1').collection("Floor 2").get().then(snapshot => {
        snapshot.forEach(doc => {
            if (doc.data()["Occupancy"]["Occupied"] == true){
                if (occupiedSpots.includes(doc.id) == false){
                    occupiedSpots.push(doc.id);
                }
            }else if (doc.data()["Occupancy"]["Occupied"] == false){
                if (unoccupiedSpots.includes(doc.id) == false){
                  unoccupiedSpots.push(doc.id);
                }
            }
        });
        updateFloorInfo("Floor 2", occupiedSpots.length);
        updateStructureInfo("Parking Structure 1", occupiedSpots.length);
    });
}

function databaseListner(){
    db.collection("Companies").doc("Portland State University").collection("Data").doc('Parking Structure 1').collection("Floor 2").onSnapshot(function(snapshot) {
        snapshot.docChanges().forEach(function(change) {
            if (change.type === "modified") {
                if (change.doc.data()["Occupancy"]["Occupied"] == true) {
                    if (occupiedSpots.includes(change.doc.id) == false){
                        occupiedSpots.push(change.doc.id);
                    }
                }else if (change.doc.data()["Occupancy"]["Occupied"] == false) {
                    if (unoccupiedSpots.includes(change.doc.id) == false){
                        unoccupiedSpots.push(change.doc.id);
                    }
                }else{
                    if (occupiedSpots.includes(change.doc.id)){
                        var index = occupiedSpots.indexOf(change.doc.id);
                        if (index > -1) {
                          occupiedSpots.splice(index, 1);
                        }
                    }else if (unoccupiedSpots.includes(change.doc.id)){
                        var index = unoccupiedSpots.indexOf(change.doc.id);
                        if (index > -1) {
                          unoccupiedSpots.splice(index, 1);
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
    db.collection("Companies").doc("Portland State University").collection("Data").doc('Parking Structure 1').update({
        ["Floor Data." + floor + ".Available"]: (capacity - available),
    }).catch(err => {
        log('Error getting documents', err);
    });
}

function updateStructureInfo(structure, available){
    db.collection("Companies").doc("Portland State University").collection("Data").doc(structure).update({
        "Capacity.Available": (capacity - available),
        "Spot Status.Occupied": occupiedSpots.map(Number),
        "Spot Status.Unoccupied": unoccupiedSpots.map(Number),
    }).catch(err => {
        log('Error getting documents', err);
    });
}


function sendSlackBotMessage(errorMessage){
    slack.send({
        'username': 'Server Error Bot',
        'text': '<!channel>',
        'icon_emoji': ':x:',
        'attachments': [{
          'color': '#ff0000',
          'fields': [
            {
                'title': 'ERROR OCCURED IN UDP_SERVER:',
                'value': errorMessage,
                'short': false
            },
          ]
        }]
    })
}

//Only log when debugging not production
function log(message) {
  if (debug) {
    console.log(message);
  }
}
