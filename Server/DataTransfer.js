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
    let root = grab_data(src); // will return object of class dataHolder that acts as root of tree
}
// function that takes in source destination
// function copies desination including all sub-documents and stores in data structure that it returns 
function grab_data(src)
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
              console.log("doc");
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
           doc_grab(data_path);
              
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
     console.log(data_path);
            console.log("is doc in doc");
           const doc =  await data_path.get(); 
           console.log(doc.data());
          let fields = Object.keys(doc.data());
          console.log(fields);
          console.log(fields[0]);
//            (snapshot => {
//                snapshot.docs.forEach(doc =>{
//               console.log("in first firEach");
//               let fields = Object.keys(doc.data());
//               console.log("field test: " + fields[i]);
//               let data_array= [];
//               let i = 0;
//               fields.forEach(element => data_array.push(doc.data().element) )
//                    console.log("seconf for each");
//                    console.log(data_array[i]);
//                    i +=1;
//                        
//                    
//                
//             })
//                
//            })
}
let test =["PSU","Parking Structure 1"]; //db.collection("PSU").doc("Parking Structure 1");
//let test2 = ["PSU"]; //db.collection("PSU");
grab_data(test);
//grab_data(test2);