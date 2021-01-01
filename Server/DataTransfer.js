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
  
    
    // check that dest and src match doc type (doc or collection)
    let root = grab_data(src); // will return object of class dataHolder that acts as root of tree
    element_grab(root);
    //copy_data(root,dest)
}
// function that takes in source destination
// function copies desination including all sub-documents and stores in data structure that it returns 
async function grab_data(src)
{
    //console.log("Grabing data from: " +src);
    let doc = false;
    let collection = false;
     //determine if src is a doc or collection      
     if(src.length == 0)
         {
             return console.error("no argument for grab data function");
             
         }
     else if (src.length % 2 == 0)
         {
             // console.log("doc");
             doc =true;
         }
    else
        {
            // console.log("collection");
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
            //console.log("id: "+ src[src.length-1] + "data: " + doc_info[0]);
                 // if doc for each/ recursive call
            let sub_collections = await doc_info[1];
            
            for( let i =0; i<sub_collections.length; i+=1)
                {
                    let temp =[]; 
                    src.forEach(level => {
                        temp.push(level);
                    })
                    temp.push(sub_collections[i]);
                    let sub = await grab_data(temp);
                    root.subDoc.push(sub);
                }
            return root;
       
        }
    
      // create dataHolder object collection   
    else 
        {
            let collection_info = await collection_grab(data_path);
             let root = new dataHold.dataHolder(src[src.length-1],null);
            // if collection for each / recursive call
            for(let i =0; i<collection_info.length; i+=1) // may need if statement to make sure length > 0
                {
                    let temp = [];
                    src.forEach(level => {
                        temp.push(level);
                    }) 
                    temp.push(collection_info[i]);
                    let sub = await grab_data(temp);
                    root.subDoc.push(sub);
                }
              return root;
    
        }
  
    
   
    
    
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
           
          // console.log(doc_info);
     
           return doc_info;
}
//gets all subdocuments from a collection and returns them as an array 
async function collection_grab(data_path)
{
    
    const subDocs = []; 
  let test = data_path.get().then(snapshot => {
         snapshot.docs.forEach(theDoc =>{
        let currentID = theDoc.id;
        subDocs.push(currentID);
    })       
        //console.log("pre return : " + subDocs[1]);    
      return  subDocs;
    })
                
       return await test;
}
function copy_data(root,dest)
{
    // create spot to copy root in dest// figure out collection or doc
     let data_path;
    let doc = false;
    let collection = true;
     // true == collection false == doc
     for(let i =0; i<dest.length; i+=1)
         {
             if(i == 0)
                 {
                    data_path = db.collection(dest[i]);
                      if(i == (dest.length-1))
                           {
                               collection = true;
                           }
                     //console.log("collection");
                 }
             else if (i %2 == 0)
                 {
                     data_path = data_path.collection(dest[i]);
                      if(i == (dest.length-1))
                           {
                               collection = true;
                           }
                     //console.log("collection");
                 }
                else{
                       data_path = data_path.doc(dest[i]);
                       if(i == (dest.length-1))
                           {
                               doc = true;
                           }
                       // console.log("doc");  
                    }             
         }
      
    
    // call correct function based of type // roots id not copied not copied subdocs copied
    if(doc === true)
        {
            data_path.set(root.data);
            // for each sub collection 
             root.subDoc.forEach(subcollection =>{
                 
                 
             })
            // write sub collection names to doc 
               
            // call copy_data(root = subdoc object we just used // dest - dest.push(subdoc key we just wrote))
        }
    else if (collection === true) 
    {
        // for each sub doc 
        // write sub doc name(id) to collection 
    
      // call copy_data(root = subdoc object we just used // dest - dest.push(subdoc key we just wrote))
        
    }
}
// child = element_fields parent type_test
// recursive return "new" type test if another object below 
// probably used more for copy data
async function element_grab(root)
{
             let fields = Object.keys(root.data);
         // console.log(fields);
          //db.collection('data-test-dest').doc('1').set(root.data);
         if(root.subDoc.length >0)
             {
                    let subdoc = await root.subDoc[0];
       // console.log(subdoc);
             }
          root.subDoc.forEach(subcollection =>{
                 
                 db.collection("data-test-dest").doc("1").set(subcollection.id);
             })
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
//    
}
//let test =["PSU","Parking Structure 1"]; //db.collection("PSU").doc("Parking Structure 1");
let test =["data-test-src","1"];
//let test2 = ["PSU"]; //db.collection("PSU");
async function test_function()
{
    let root =await  grab_data(test);
element_grab(root);
}
test_function();
//grab_data(test2);