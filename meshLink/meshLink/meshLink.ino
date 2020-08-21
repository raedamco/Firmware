#include "namedMesh.h"

#define MESH_SSID     "RaedamSSID"
#define MESH_PASSWORD "RaedamPassword"
#define MESH_PORT     5555

Scheduler userScheduler;
namedMesh mesh;

String previousNodeName = "10"; //previous neighboring node id
String nodeName = "11"; //this node id
String nextNodeName = "12"; //next neighboring node id

Task taskSendMessage(TASK_SECOND*30, TASK_FOREVER, []() { //send every 30 seconds
    String msg = "0b 00 00 00 01 80 15 00 00 00"; //msg to send to next node
    String to = nextNodeName; //send msg to next node
    mesh.sendSingle(to, msg); //send next node the msg
});

void setup() {
    Serial.begin(115200);
    mesh.init(MESH_SSID, MESH_PASSWORD, &userScheduler, MESH_PORT); //initialize ble mesh
    mesh.setName(nodeName); //assign number to this node
   
    mesh.onReceive([](String &from, String &msg) { //ble mesh recieved msg
      String fromSensor = from.c_str(); //get node number that sent msg
      String messageFromSensor = msg.c_str(); //msg recieved
      Serial.println(String("Sensor: " + fromSensor + " Message: " + messageFromSensor)); //log what node sent the info and what the msg was passed along
      String to1 = nextNodeName; //next node to recieve forwarded info
      mesh.sendSingle(to1, messageFromSensor); //forward recieved msg to next node in chain until it reaches sensor w/ WiFi connection
    });

    mesh.onChangedConnections([]() {
      Serial.printf("Changed connection\n");
    });

    userScheduler.addTask(taskSendMessage); //add task to send msg from this node
    taskSendMessage.enable(); //enable task to send msg from this node
}

void loop() {
  mesh.update(); // it will run the user scheduler as well
}
