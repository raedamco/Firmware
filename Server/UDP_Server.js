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
var slack = require('slack-notify')('https://hooks.slack.com/services/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');

const debug = true;
var PORT = 15000

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();
var database = db.collection("Companies");
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

        //temp variables. These will be retrieved from UDP sent by Boron unit
        var company = "Portland State University";
        var location = "Parking Structure 1";
        var floor = "Floor 2";

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

        log("COMPANY: | LOCATION: | FLOOR: | SENSOR ID: [" + SensorID + "] | DISTANCE: [" + Distance + "] | OCCUPIED: [" + Occupied + "]");
        appendData(company, location, floor, String(SensorID), Occupied, Occupant, Time, Distance);
        queryDatabase(company, location, floor);
        databaseListner(company, location, floor);
    }else{
        let stringHex = msg.toString('hex');
        var errorMessage = ("PACKET RECIEVED FUNCTION ERROR. RECIEVED PAKCET WITH LENGTH OF: " + msg.length + ". PACKET INFO: " + stringHex);
        log(errorMessage);
        sendSlackBotMessage(errorMessage);
    }
});

// adds data entry for spot
async function appendData(company, location, floor, sensorID, state, occupant, time, distance) {
    //Check if sensor exists in the database before adding data, ensures random data is not added.
    database.doc(company).collection("Data").doc(location).collection(floor).doc(sensorID).get().then(doc => {
        if (!doc.exists){
          log('DOCUMENT DOES NOT EXIST FOR SENSOR ID: ' + sensorID);
        }else{
          spotLogCheck(company, location, floor, sensorID, state, occupant, time, distance);
        }
    }).catch(err => {
        log('Error getting document' + err);
    });
}

//CHECK IF THERE ARE DOCUMENTS IN COLLECTION BEFORE MERGING, OTHERWISE ADD FIRST DOCUMENT
async function spotLogCheck(company, location, floor, sensorID, state, occupant, time, distance){
    database.doc(company).collection("Data").doc(location).collection(floor).doc(sensorID).collection("Data").get().then(snap => {
        if (snap.size == 0) {
            addSpotDocument(company, location, floor, sensorID, state, occupant, time, distance);
        }else{
            //RUN LOGIC HERE TO SEE IF DATA SHOULD BE MERGED WITH EXISITNG DOCUMENT OR CREATE NEW DOCUMENT
            var old_data = database.doc(company).collection("Data").doc(location).collection(floor).doc(sensorID).collection("Data").orderBy("Time.End", "desc").limit(1).get().then(async function(querySnapshot){
                querySnapshot.forEach(async function(doc){
                    if(doc.data()["Occupant"] == occupant && doc.data()["Occupied"] == state){ // checks for change in status if not log added to current doc
                        var the_test = await doc.data()["Distances"]
                        typeof the_test;
                        the_test.push(distance)

                        var temp_history = await doc.data()["Time"]["History"]
                        typeof temp_history;
                        temp_history.push(time)

                        database.doc(company).collection("Data").doc(location).collection(floor).doc(sensorID).collection("Data").doc(doc.id).set({
                            Distances: the_test,
                            Time: {
                              History:  temp_history,
                              End: time,
                            }
                        }, { merge: true });
                      }else{
                        log("CHANGE IN OCCUPANT OR OCCUPIED STATUS");
                        // code to make new
                        addSpotDocument(company, location, floor, sensorID, state, occupant, time, distance)
                      }
                });
                return querySnapshot;
            }).catch(function(error){
                log('Error getting documents', err);
            });
        }
    });
}

//Create spot log in database
function addSpotDocument(company, location, floor, sensorID, state, occupant, time, distance){
  database.doc(company).collection("Data").doc(location).collection(floor).doc(sensorID).collection("Data").add({
      "Occupied": state,
      "Occupant": occupant,
      "Distances": [distance],
      Time: {
        Begin: time,
        End: time,
        History: [time]
      }
  }).then(ref => {
  }).catch(err => {
      log('Error getting documents', err);
  });
  updateDocumentInfo(company, location, floor, sensorID, state, occupant);
}

// udpdates spot info itself in database
function updateDocumentInfo(company, location, floor, sensorID, state, occupant){
    database.doc(company).collection("Data").doc(location).collection(floor).doc(sensorID).get().then(doc => {
        database.doc(company).collection("Data").doc(location).collection(floor).doc(sensorID).update({
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

//Get current database info
function queryDatabase(company, location, floor){
    database.doc(company).collection("Data").doc(location).get().then(doc => {
        capacity = doc.data()["Capacity"]["Capacity"];
    });

    database.doc(company).collection("Data").doc(location).collection(floor).get().then(snapshot => {
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
        updateFloorInfo(company, location, floor, occupiedSpots.length);
        updateStructureInfo(company, location, occupiedSpots.length);
    });
}

//Attach database listener to notice any changes and ensure all data matches
function databaseListner(company, location, floor){
    database.doc(company).collection("Data").doc(location).collection(floor).onSnapshot(function(snapshot) {
        snapshot.docChanges().forEach(function(change) {
            if (change.type === "modified") {
              if (change.doc.data()["Occupancy"]["Occupied"] == true){
                  if (occupiedSpots.includes(change.doc.id) == false){
                      occupiedSpots.push(change.doc.id);
                  }
                  if (unoccupiedSpots.includes(change.doc.id)){
                      var index = unoccupiedSpots.indexOf(change.doc.id);
                      if (index > -1) {
                        unoccupiedSpots.splice(index, 1);
                      }
                  }
              }else{
                  if (unoccupiedSpots.includes(change.doc.id) == false){
                      unoccupiedSpots.push(change.doc.id);
                  }
                  if (occupiedSpots.includes(change.doc.id)){
                      var index = occupiedSpots.indexOf(change.doc.id);
                      if (index > -1) {
                        occupiedSpots.splice(index, 1);
                      }
                  }
              }
            }
            updateFloorInfo(company, location, floor, occupiedSpots, unoccupiedSpots);
            updateStructureInfo(company, location, occupiedSpots.length);
        });
    });
}

//Update structures' floor info status. NOTE: THIS CAN BE OPTIMIZED BY UPDATING THE ARRAY FOR SPECIFIC SPOTS, NOT THE ENTIRE ARRAY
function updateFloorInfo(company, location, floor, occupiedSpots, unoccupiedSpots){
    //Sort array before updating database
    sortArray(occupiedSpots);
    sortArray(unoccupiedSpots);

    database.doc(company).collection("Data").doc(location).update({
        ["Floor Data." + floor + ".Occupied"]: occupiedSpots.map(Number),
        ["Floor Data." + floor + ".Unoccupied"]: unoccupiedSpots.map(Number),
    }).catch(err => {
        log('Error getting documents', err);
    });
}

//Update structures' field info
function updateStructureInfo(company, structure, available){
    database.doc(company).collection("Data").doc(structure).update({
        "Capacity.Available": (capacity - available)
    }).catch(err => {
        log('Error getting documents', err);
    });
}

//Send slack notifications to #server channel if there are any issues
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


//Sort array
function sortArray(...array){
  return arguments.sort(function(a,b){
    return a - b;
  });
}
// function sortArray(array){
//   array.sort(function(a, b) {
//     return a - b;
//   });
// }

//Only log when debugging not production
function log(message) {
  if (debug) {
    console.log(message);
  }
}
