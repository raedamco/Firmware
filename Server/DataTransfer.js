//
//  DataTransfer.js
//  Raedam 
//
//  Created on 12/11/2020. Modified on 12/11/2020 by Austin Mckee.
//  Copyright © 2020 Raedam. All rights reserved.
//
// This file holds code for transfering data in the firestore from one document to another and all sub documents

///////////////////////////////////////////////////////////////////////////////////////////////////////////

const cron = require('node-cron')
const admin = require('firebase-admin');

let serviceAccount = require('./serverKey.json');

const debug = true;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();

//parent function to move data in firestore database     
// takes in destination path in database first argument
// takes in source destination to copy from
function move_data(dest,src)
{
    // if the string doesn't work look into array for path and use length ti determine doc or collection 
    // each index label for doc or collection
    
    // check that dest and srd match doc type (doc or collection)
   // src = db.src;
    //dest = db.dest;
    grab_data(src); // will return object of class dataHolder that acts as root of tree
}
// function that takes in source destination
// function copies desination including all sub-documents and stores in data structure that it returns 
function grab_data(src)
{
     //determine if src is a doc or collection 
    
     var stringSrc = src;
     // true == collection false == doc
     if(stringSrc.lastIndexOf("collection(") > stringSrc.lastIndexOf("doc("))
         {
             console.log("collection");
         }
    else{
        console.log("doc");
        console.log(stringSrc.length);
    }
    // create dataHolder object
    
    
    // if doc for each/ recursive call
    
    
    // if collection for each / recursive call
    
    
    // return object created
    
    
}
let test = db.collection("PSU").doc("Parking Structure 1");
let test2 = db.collection("PSU");
grab_data(String(test));
grab_data(String(test2));