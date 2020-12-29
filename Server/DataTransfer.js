//
//  DataTransfer.js
//  Raedam 
//
//  Created on 12/11/2020. Modified on 12/28/2020 by Austin Mckee.
//  Copyright © 2020 Raedam. All rights reserved.
//
// This file holds code for transfering data in the firestore from one document to another and all sub documents

///////////////////////////////////////////////////////////////////////////////////////////////////////////

const cron = require('node-cron')
const admin = require('firebase-admin');
const dataHold = require("./dataHolder.js");

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
    let root = grab_data(src); // will return object of class dataHolder that acts as root of tree
}
// function that takes in source destination
// function copies desination including all sub-documents and stores in data structure that it returns 
async function grab_data(src)
{
    let doc = false;
    let collection = false;
     //determine if src is a doc or collection      
     if(src.length == 0)
         {
             return console.error("no argument for grab data function");
             
         }
     else if (src.length % 2 == 0)
         {
              //console.log("doc");
             doc =true;
         }
    else
        {
             console.log("collection");
            collection = true;
        }
     let data_path;
     // true == collection false == doc
     for(let i =0; i<src.length; i+=1)
         {
             if(i == 0)
                 {
                    data_path = db.collection(src[i]);
                     //console.log("collection");
                 }
             else if (i %2 == 0)
                 {
                     data_path = data_path.collection(src[i]);
                     //console.log("collection");
                 }
                else{
                       data_path = data_path.doc(src[i]);
                       // console.log("doc");
                     
                    }             
         }
    
   
    // create dataHolder object doc
    if(doc)
        { 
           let doc_info = await doc_grab(data_path); // doc_info 0 = data 1= subcollections
            let root = new dataHold.dataHolder(src[src.length-1],doc_info[0]);
            console.log("id: "+ src[src.length-1] + "data: " + doc_info[0]);
            // if doc for each/ recursive call
        }
    
      // create dataHolder object collection   
    else 
        {
              // if collection for each / recursive call
    
        }
  
    
    // return object created
    
    
}
async function doc_grab (data_path)
{
          // gets data for given doc and stores in doc_info array
           const doc =  await data_path.get(); 
           let doc_info = [];
           let data = doc.data();
           doc_info.push(data);
           // grabs all subcollections of given doc and stores in doc_info in collections_ids array
           const collections = await data_path.listCollections();
           let collections_ids = [];
          collections.forEach(collection => {
             collections_ids.push(collection.id);
          });
           doc_info.push(collections_ids);
           
           console.log(doc_info);
           return doc_info;
}
// child = element_fields parent type_test
// recursive return "new" type test if another object below 
// probably used more for copy data
function element_grab()
{
    //          let fields = Object.keys(doc.data());
//          console.log(fields);
//          await console.log(doc.data()[temp]);
//          fields.forEach(function(element){
//             
//              let type_test = doc.data()[String(element)];
//              let the_type = typeof type_test;
//              //console.log(typeof type_test);
//              if(the_type === 'object' && the_type !== null)
//                  {
//                      let element_fields = Object.keys(type_test);
//                      let element_data = [];
//                      let k = 0;
//                      element_fields.forEach(function(childElement)
//                         {
//                            
//                            element_data.push(type_test[String(childElement)]);
//                            console.log(childElement + ":" + element_data[k]);
//                          k+=1;
//                            // parent elment[this element] = value
//                          // floor 2 [available ] = 8
//                         })
//                  }
//              console.log(element + ": " + type_test + ":" + the_type);
//          } )
    
}
let test =["PSU","Parking Structure 1"]; //db.collection("PSU").doc("Parking Structure 1");
//let test2 = ["PSU"]; //db.collection("PSU");
grab_data(test);
//grab_data(test2);