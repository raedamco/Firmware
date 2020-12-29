//
//  dataHolder.js
//  Raedam 
//
//  Created on 12/15/2020. Modified on 12/15/2020 by Austin Mckee.
//  Copyright © 2020 Raedam. All rights reserved.
//
// This file holds a generic class object that can be used to store a firestore documetn or collection

///////////////////////////////////////////////////////////////////////////////////////////////////////////
class dataHolder{
    
    constructor(id,doc)
    {
        this.id= id; // holds id for object doc/collection name
        this.data = doc; // object holding doc.data() 
        this.subDoc = []; // holds subcollection or docs
    }
}  