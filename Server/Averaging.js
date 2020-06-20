const cron = require('node-cron')
const admin = require('firebase-admin');

let serviceAccount = require('./serverKey.json');

const debug = true;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();

//Retrieve # of documents from Data collection for each spot (60 = 1 hour at 1 doc/min)
let docAmount = 4;

//Number of times a spot is occupied for given time to be be occupied on average
let setAvgOccupancy = 1;
//
//parseDatabase("Parking Structure 1", "Floor 2", docAmount);

//Execute code based on time (https://www.npmjs.com/package/node-cron) || Format: sec, min, hr, day of month, month, day of week || */1 = runs every min
// change schedule for time frequency 
cron.schedule(" */1 * * * *",()=> {
    get_average_floor("Parking Structure 1", "Floor 2", docAmount); // add organization long term
    // add get_average_floor calls for each floor you want inside here
})
function get_average_floor(StructureID, FloorID, DocumentAmounts)
{
    parseDatabase(StructureID, FloorID, docAmount);
}
//Get spot data from database
// add organization long term 
function parseDatabase(StructureID, FloorID, DocumentAmounts)
{
 var total_avg = 0;
 var itemsProcessed = 0;
 //// long term replace "Psu" with organization var
    db.collection("PSU").doc(StructureID).collection(FloorID).get().then( function(querySnapshot) 
    {
         querySnapshot.forEach(async function(doc) 
        {
            var id = doc.id;
            var temp = await retrieveData(StructureID, FloorID, id, DocumentAmounts);
            total_avg += await temp;
            
            itemsProcessed++;
            if(itemsProcessed == querySnapshot.size)
                {
                    addData(StructureID, FloorID,total_avg);
                }
             
        });
        
    }
  ).catch(function(error) {
        log("Error getting documents: " + error);
    });

   
}

async function retrieveData(StructureID, FloorID, spotID, DocumentAmounts){
    var averageOccupancy = 0;
    var test = 0;
   test += await db.collection("PSU").doc(StructureID).collection(FloorID).doc(spotID).collection("Data").orderBy("Time.End", "desc").limit(DocumentAmounts).get().then(function(querySnapshot)
    {
         var is_occ = 0;
        querySnapshot.forEach(function(doc) {
            var id = doc.id;
            var time = doc.data()["Time"]["End"];
            log("TIME: " + time);
           if (interpretTime(time)){
                var occupied = doc.data()["Occupied"];
               log("OCCUPIED: " + occupied);
                if (occupied == true){
                    averageOccupancy += 1;
              }
          }
          else{
              log("Spot value not from last hour. Spot:" + spotID + "Time:"+ time) ;
          }
        });
        //log(averageOccupancy);
       if (averageOccupancy >= setAvgOccupancy){
            is_occ = 1;
           // addData("Parking Structure 1", "Floor 2", averageOccupancy);
        }
        return is_occ;
    }
  ).catch(function(error){
        log("Error getting documents: " + error);
    });
   return test;

}

//Add average data doc to database
function addData(StructureID, FloorID, Average){
    var Time = new Date();

    db.collection("PSUData").doc(StructureID).collection(FloorID).add({
        ["Average"]: Average,
        ["Time"]: Time,
    }).then(ref => {
        log("Added Average Occupancy For Time: " + Time);
    }).catch(err => {
        log('Error getting documents', err);
    });

}

function interpretTime(TimeStamp){
    var hour = TimeStamp.toDate().getHours();
    var date = new Date();
    var currentHour = date.getHours();
     
    if (currentHour == hour){
        return true;
    }else if( (currentHour - 1) == hour){
        return true;
    }
    else{
        return false;
    }

}

//Only log when debugging not production
function log(message) {
  if (debug) {
    console.log(message);
  }
}
