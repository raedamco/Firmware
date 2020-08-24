//
//  Arduino-ESP.ino
//  Raedam
//
//  Created on 1/10/2019. Modified on 8/21/2020.
//  Copyright © 2020 Raedam Inc. All rights reserved.
//

#include <WiFi.h>
#include "AsyncUDP.h"
AsyncUDP udp;

#ifndef OFFLINE
#include <WiFiUdp.h>
#endif OFFLINE

#include "config.h"
#include "ultrasonic.h"
#include "namedMesh.h"

Scheduler userScheduler;
namedMesh mesh;

ultrasonic ultra = ultrasonic(PIN_TRIG,PIN_ECHO);
boolean NETWORK_ACTIVE = 0;
WiFiUDP socket;

long unsigned int WAKE_TIME = 0;
char incomingPacket[255];
const byte MaxByteArraySize = 1024;

void setup() {
  Serial.begin(115200);
  setupBLEMesh();
  if (WiFi_NODE == true) {
    // START WIFI CONNECTION //
    #ifndef OFFLINE   //If NOT Offline Build
      Serial.printf("SSID: %s\n", WIFI_SSID);
      #ifdef WIFI_PASS
        WiFi.begin(WIFI_SSID, WIFI_PASS);
      #else
        WiFi.begin(WIFI_SSID);
      #endif
      socket.begin(SERVER_PORT);
    #endif
    // END WIFI CONNECTION //
  }
}

void loop() {
  mesh.update(); // run the user scheduler as well
  
  // START DATA SEND //
    if (WiFi.status() == WL_CONNECTED) { //ensure connection to WiFi before collecting + sending data
       #ifndef OFFLINE   //If NOT Offline Build      
       sendPacket(ULTRASONIC_CID, ultra.get());
       delay(COLLECT_TIME*1000); //convert from milliseconds to seconds
    }else{
       Serial.flush(); 
    }
      #endif
  //END DATA SEND //   
}

#ifndef OFFLINE

void sendPacket(uint8_t sensor_cid, unsigned long r) {
  uint8_t protocol = 1;                   // 1 uint8_t
  unsigned long uid = UNIQUE_ID;          // 4 uint8_t
  uint8_t sensor = sensor_cid;            // 1 uint8_t
  unsigned long result = r;               // 4 uint8_t
  const unsigned long buffer_length = 1+4+1+4;
  
  uint8_t buff[buffer_length] = { 0 };
  {
    int i=0;
    memcpy(&buff[i], &uid, sizeof(uid));
    i+=sizeof(uid);
    memcpy(&buff[i], &sensor, sizeof(sensor));
    i+=sizeof(sensor);
    memcpy(&buff[i], &result, sizeof(result));
    i+=sizeof(result);
  }


  if (WiFi_NODE == false){ //if not connected to wifi, send next node infortmation for this sensor's reading
    Serial.print(String(buff));
    //TO DO: CONVERT BUFF TO STRING AND SEND IT TO NEXT NODE
//      String msg = buff;//"0b 00 00 00 01 77 2c 00 00 00"; //converted string of collected data
      mesh.sendSingle(NEXT_NODE_ID, msg); //send string of collected sensor data to next node
  }else{ //if connected to wifi, send sensor's reading to the server as a udp
      socket.beginPacket(SERVER_IP, SERVER_PORT);
      socket.write(buff, buffer_length);
      socket.endPacket();
  }
}
#endif

void setupBLEMesh(){
    mesh.init(MESH_SSID, MESH_PASSWORD, &userScheduler, MESH_PORT); //initialize ble mesh
    String NodeName = String(UNIQUE_ID);
    mesh.setName(NodeName); //assign number to this node

   if (WiFi_NODE == true){
    mesh.onReceive([](String &from, String &msg) { //ble mesh recieved msg
        String fromSensor = from.c_str(); //get node number that sent msg
        String messageFromSensor = msg.c_str(); //msg recieved
        Serial.println(String("Sensor: " + fromSensor + " Message: " + messageFromSensor)); //log what node sent the info and what the msg was passed along
        
        //TO DO: CONVERT (messageFromSensor) STRING to BYTE

//        Serial.println(messageFromSensor);
//        socket.beginPacket(SERVER_IP, SERVER_PORT); //send ble mesh forwarded info to server as a udp packet
//        socket.write();
//        socket.endPacket();
      });
   }else{ //if this node is not connected to WiFi forward the previous msgs to the next node in line
      mesh.onReceive([](String &from, String &msg) { //ble mesh recieved msg
        String fromSensor = from.c_str(); //get node number that sent msg
        String messageFromSensor = msg.c_str(); //msg recieved
        Serial.println(String("Sensor: " + fromSensor + " Message: " + messageFromSensor)); //log what node sent the info and what the msg was passed along
        String to1 = NEXT_NODE_ID; //next node to recieve forwarded info
        mesh.sendSingle(to1, messageFromSensor); //forward recieved msg to next node in chain until it reaches sensor w/ WiFi connection
      });
   }
    
    mesh.onChangedConnections([]() {
      Serial.printf("Changed connection\n");
    });
}

/******Documentation*****
  WiFi                https://www.arduino.cc/en/Reference/WiFi
  WiFi.begion()       https://www.arduino.cc/en/Reference/WiFiBegin
  WiFi.status()       https://www.arduino.cc/en/Reference/WiFiStatus
  WiFi.write()        https://www.arduino.cc/en/Reference/WiFiServerWrite
*/
