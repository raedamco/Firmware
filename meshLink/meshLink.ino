//************************************************************
// this is a simple example that uses the painlessMesh library
// 
// This example shows how to build a mesh with named nodes
//
//************************************************************
#include "namedMesh.h"

#define MESH_SSID     "RaedamSSID"
#define MESH_PASSWORD "RaedamPassword"
#define MESH_PORT     5555

Scheduler     userScheduler; // to control your personal task
namedMesh  mesh;

String previousNodeName = "12";
String nodeName = "13"; // Name needs to be unique
String nextNodeName = "14";

Task taskSendMessage(TASK_SECOND*30, TASK_FOREVER, []() { //send every 30 seconds
    String msg = "TEST FROM SENSOR: " + nodeName;
    String to = nextNodeName;
    mesh.sendSingle(to, msg); 
});

void setup() {
  Serial.begin(115200);

//  mesh.setDebugMsgTypes(ERROR | DEBUG | CONNECTION);

    mesh.init(MESH_SSID, MESH_PASSWORD, &userScheduler, MESH_PORT);
    mesh.setName(nodeName);
    
    mesh.onReceive([](String &from, String &msg) {
      Serial.printf("Received message by name from: %s, %s\n", from.c_str(), msg.c_str());
      String fromSensor = from.c_str();
      String messageFromSensor = msg.c_str();
      String msg1 = String(fromSensor + messageFromSensor);
      String to1 = nextNodeName;
      mesh.sendSingle(to1, msg1); 
    });

  mesh.onChangedConnections([]() {
    Serial.printf("Changed connection\n");
  });

  userScheduler.addTask(taskSendMessage);
  taskSendMessage.enable();
}

void loop() {
  // it will run the user scheduler as well
  mesh.update();
}
