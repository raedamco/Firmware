//
//  config.h
//  Raedam
//
//  Created on 1/10/2019. Modified on 8/27/2020.
//  Copyright © 2020 Raedam Inc. All rights reserved.
//

#ifndef CONFIG_H
#define CONFIG_H

#define MESH_SSID     "RaedamSSID-InternalTesting"
#define MESH_PASSWORD "RaedamPassword"
#define MESH_PORT     5555

#define UNIQUE_ID 2          //this node
#define NEXT_NODE_ID "3"     //node to forward previous node + this node's info to

#define PIN_ECHO 27
#define PIN_TRIG 12

#define DEBUGGING

#define COLLECT_TIME 900000  // in milliseconds = 15 minutes

#endif
