//
//  Arduino-ESP.ino
//  Raedam
//
//  Created on 1/10/2019. Modified on 8/21/2020.
//  Copyright © 2020 Raedam Inc. All rights reserved.
//

#include <WiFi.h>

#ifndef OFFLINE
#include <WiFiUdp.h>
#endif OFFLINE

#include "config.h"
#include "ultrasonic.h"
#include "namedMesh.h"

const byte MaxByteArraySize = 8;

Scheduler userScheduler;
namedMesh mesh;

ultrasonic ultra = ultrasonic(PIN_TRIG,PIN_ECHO);
WiFiUDP socket;

String NodeName = String(UNIQUE_ID);

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

  String sensorData;
  for(int i=0; i<buffer_length; i++){
    String convertedString= String(buff[i],HEX);
    sensorData+= convertedString;
  }
  
//  #ifdef DEBUGGING
//    Serial.printf("Sent: UID=%lu, RESULT=%u\n     ", uid, r);
//    for (int i=0; i<buffer_length; i++) {
//      Serial.printf(" %02x",buff[i]);
//    }
//    Serial.printf("\n");
//    Serial.println(sensorData);
//  #endif
//
  socket.beginPacket(SERVER_IP, SERVER_PORT);
  socket.write(buff,buffer_length);
  socket.endPacket();
  
}

Task taskSendMessage(TASK_SECOND*COLLECT_TIME, TASK_FOREVER, []() { //collect and send every 30 seconds
  sendPacket(ULTRASONIC_CID, ultra.get());
});

void setupBLEMesh(){
  mesh.init(MESH_SSID, MESH_PASSWORD, &userScheduler, MESH_PORT); //initialize ble mesh
    mesh.setName(NodeName); //assign number to this node
    mesh.stationManual(WIFI_SSID, WIFI_PASS);

    socket.begin(SERVER_PORT);
    
    mesh.onReceive([](String &from, String &msg) { //ble mesh recieved msg
        String fromSensor = from.c_str(); //get node number that sent msg
        String messageFromSensor = msg.c_str(); //msg recieved
        Serial.println(String("Sensor: " + fromSensor + " Message: " + messageFromSensor)); //log what node sent the info and what the msg was passed along
        
        byte byteArray[MaxByteArraySize] = {0};
        hexCharacterStringToBytes(byteArray, msg.c_str());
        dumpByteArray(byteArray, MaxByteArraySize);
           
        Serial.println(messageFromSensor);
        socket.beginPacket(SERVER_IP, SERVER_PORT); //send ble mesh forwarded info to server as a udp packet
        socket.write(byteArray,MaxByteArraySize);
        socket.endPacket();
      });
    
    mesh.onChangedConnections([]() {
      Serial.printf("Changed connection\n");
    });

    userScheduler.addTask(taskSendMessage); //add task to send msg from this node
    taskSendMessage.enable(); //enable task to send msg from this node
}

void hexCharacterStringToBytes(byte *byteArray, const char *hexString){
  bool oddLength = strlen(hexString) & 1;

  byte currentByte = 0;
  byte byteIndex = 0;

  for (byte charIndex = 0; charIndex < strlen(hexString); charIndex++){
    bool oddCharIndex = charIndex & 1;

    if (oddLength){
      // If the length is odd
      if (oddCharIndex){
        // odd characters go in high nibble
        currentByte = nibble(hexString[charIndex]) << 4;
      }else{
        // Even characters go into low nibble
        currentByte |= nibble(hexString[charIndex]);
        byteArray[byteIndex++] = currentByte;
        currentByte = 0;
      }
    }else{
      // If the length is even
      if (!oddCharIndex){
        // Odd characters go into the high nibble
        currentByte = nibble(hexString[charIndex]) << 4;
      }else{
        // Odd characters go into low nibble
        currentByte |= nibble(hexString[charIndex]);
        byteArray[byteIndex++] = currentByte;
        currentByte = 0;
      }
    }
  }
}

void dumpByteArray(const byte * byteArray, const byte arraySize){
  for (int i = 0; i < arraySize; i++){
    Serial.print("0x");
    if (byteArray[i] < 0x10)
      Serial.print("0");
      Serial.print(byteArray[i], HEX);
      Serial.print(", ");
    }
  Serial.println();
}

byte nibble(char c){
  if (c >= '0' && c <= '9')
    return c - '0';

  if (c >= 'a' && c <= 'f')
    return c - 'a' + 10;

  if (c >= 'A' && c <= 'F')
    return c - 'A' + 10;

  if (c == '0')
    return 0;  

  return 0;  // Not a valid hexadecimal character
}

/******Documentation*****
  WiFi                https://www.arduino.cc/en/Reference/WiFi
  WiFi.begion()       https://www.arduino.cc/en/Reference/WiFiBegin
  WiFi.status()       https://www.arduino.cc/en/Reference/WiFiStatus
  WiFi.write()        https://www.arduino.cc/en/Reference/WiFiServerWrite
*/
