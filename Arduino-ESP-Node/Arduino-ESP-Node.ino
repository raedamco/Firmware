//
//  Arduino-ESP.ino
//  Raedam
//
//  Created on 1/10/2019. Modified on 8/27/2020.
//  Copyright © 2020 Raedam Inc. All rights reserved.
//

#include "config.h"
#include "ultrasonic.h"
#include "namedMesh.h"

Scheduler userScheduler;
namedMesh mesh;

ultrasonic ultra = ultrasonic(PIN_TRIG,PIN_ECHO);

String nextNode = NEXT_NODE_ID;

void setup() {
  Serial.begin(115200);
  setupBLEMesh();
}

void loop() {
  mesh.update(); //run the user scheduler as well
}

void sendPacket(uint8_t sensor_cid, unsigned long r) {
  unsigned long uid = UNIQUE_ID;          // 4 uint8_t 
  unsigned long result = r;               // 4 uint8_t

  const unsigned long buffer_length = 4+4;
  uint8_t buff[buffer_length] = { 0 };
  {
    int i=0;
    memcpy(&buff[i], &uid, sizeof(uid));
    i+=sizeof(uid);
    memcpy(&buff[i], &result, sizeof(result));
    i+=sizeof(result);
  }

  char sensorData[buffer_length];

  for(int i=0; i<buffer_length; i++){
      sensorData[i] = buff[i];
  }

  String forwardString;
  for(int i=0; i<buffer_length; i++){
    String convertedString = String(sensorData[i]);
    forwardString+= convertedString; 
  }

  const char* t1 = new char [buffer_length];
  t1 = forwardString.c_str();

  mesh.sendSingle(nextNode, forwardString);
  #ifdef DEBUGGING
     Serial.println(String("SENT DATA TO NEXT NODE: " + forwardString)); //log what node sent the info and what the msg was passed along
   #endif 
}

Task taskSendMessage(TASK_SECOND*COLLECT_TIME, TASK_FOREVER, []() { //collect and send every 30 seconds
  sendPacket(ULTRASONIC_CID, ultra.get());
});

void setupBLEMesh(){
    mesh.init(MESH_SSID, MESH_PASSWORD, &userScheduler, MESH_PORT); //initialize ble mesh
    String NodeName = String(UNIQUE_ID);
    mesh.setName(NodeName); //assign number to this node

   //forward the previous msgs to the next node in line
     mesh.onReceive([](String &from, String &msg) { //ble mesh recieved msg
       String fromSensor = from.c_str(); //get node number that sent msg
       String messageFromSensor = msg.c_str(); //msg recieved
       
       #ifdef DEBUGGING
         Serial.println(String("GOT DATA FROM Sensor: " + fromSensor + " Message: " + messageFromSensor)); //log what node sent the info and what the msg was passed along
       #endif
      
       mesh.sendSingle(nextNode, messageFromSensor); //forward recieved msg to next node in chain until it reaches sensor w/ WiFi connection
    });
    
    mesh.onChangedConnections([]() {
      #ifdef DEBUGGING
        Serial.printf("Changed connection\n");
      #endif
    });

    userScheduler.addTask(taskSendMessage); //add task to send msg from this node
    taskSendMessage.enable(); //enable task to send msg from this node
}

/******Documentation*****
  WiFi                https://www.arduino.cc/en/Reference/WiFi
  WiFi.begion()       https://www.arduino.cc/en/Reference/WiFiBegin
  WiFi.status()       https://www.arduino.cc/en/Reference/WiFiStatus
  WiFi.write()        https://www.arduino.cc/en/Reference/WiFiServerWrite
*/
