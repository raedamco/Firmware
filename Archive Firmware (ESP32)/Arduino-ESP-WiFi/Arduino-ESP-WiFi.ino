//
//  Arduino-ESP-WiFi.ino
//  Raedam
//
//  Created on 1/10/2019. Modified on 8/27/2020.
//  Copyright © 2020 Raedam Inc. All rights reserved.
//

#include "config.h"
#include "ultrasonic.h"
#include "namedMesh.h"
#include "BLEDevice.h"

Scheduler userScheduler;
namedMesh mesh;

ultrasonic ultra = ultrasonic(PIN_TRIG,PIN_ECHO);

String NodeName = String(UNIQUE_ID);

static BLEUUID serviceUUID("9c1b9a0d-b5be-4a40-8f7a-66b36d0a5176");
static BLEUUID    charUUID("b4250401-fb4b-4746-b2b0-93f0e61122c6");

static boolean doConnect = false;
static boolean connected = false;
static boolean doScan = false;
static BLERemoteCharacteristic* pRemoteCharacteristic;
static BLEAdvertisedDevice* myDevice;

static void notifyCallback(BLERemoteCharacteristic* pBLERemoteCharacteristic, uint8_t* pData, size_t length, bool isNotify) {
    #ifdef DEBUGGING
      Serial.print("Notify callback for characteristic ");
      Serial.print(pBLERemoteCharacteristic->getUUID().toString().c_str());
      Serial.print(" of data length ");
      Serial.println(length);
      Serial.print("data: ");
      Serial.println((char*)pData);
    #endif
}

class MyClientCallback : public BLEClientCallbacks {
  void onConnect(BLEClient* pclient) {
  }

  void onDisconnect(BLEClient* pclient) {
    connected = false;
    #ifdef DEBUGGING
      Serial.println("onDisconnect");
      #endif
  }
};

bool connectToServer() {
    #ifdef DEBUGGING
      Serial.print("Forming a connection to ");
      Serial.println(myDevice->getAddress().toString().c_str());
    #endif
    
    BLEClient*  pClient  = BLEDevice::createClient();
    
    #ifdef DEBUGGING
      Serial.println(" - Created client");
    #endif

    pClient->setClientCallbacks(new MyClientCallback());

    // Connect to the remove BLE Server.
    pClient->connect(myDevice);  // if you pass BLEAdvertisedDevice instead of address, it will be recognized type of peer device address (public or private)

    #ifdef DEBUGGING
      Serial.println(" - Connected to server");
    #endif
    
    // Obtain a reference to the service we are after in the remote BLE server.
    BLERemoteService* pRemoteService = pClient->getService(serviceUUID);
    if (pRemoteService == nullptr) {
      
      #ifdef DEBUGGING
        Serial.print("Failed to find our service UUID: ");
        Serial.println(serviceUUID.toString().c_str());
      #endif endif
      
      pClient->disconnect();
      return false;
    }

    #ifdef DEBUGGING
      Serial.println(" - Found our service");
    #endif 

    // Obtain a reference to the characteristic in the service of the remote BLE server.
    pRemoteCharacteristic = pRemoteService->getCharacteristic(charUUID);
    if (pRemoteCharacteristic == nullptr) {
      #ifdef DEBUGGING
        Serial.print("Failed to find our characteristic UUID: ");
        Serial.println(charUUID.toString().c_str());
      #endif
      pClient->disconnect();
      return false;
    }
    
    #ifdef DEBUGGING
      Serial.println(" - Found our characteristic");
   
    // Read the value of the characteristic.
    if(pRemoteCharacteristic->canRead()) {
      std::string value = pRemoteCharacteristic->readValue();
      Serial.print("The characteristic value was: ");
      Serial.println(value.c_str());
    }
    #endif
    
    if(pRemoteCharacteristic->canNotify())
      pRemoteCharacteristic->registerForNotify(notifyCallback);

    connected = true;
    return true;
}

//Scan for BLE servers and find the first one that advertises the service we are looking for.
class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
//Called for each advertising BLE server.
  void onResult(BLEAdvertisedDevice advertisedDevice) {
    #ifdef DEBUGGING
      Serial.print("BLE Advertised Device found: ");
      Serial.println(advertisedDevice.toString().c_str());
    #endif
    
    // We have found a device, let us now see if it contains the service we are looking for.
    if (advertisedDevice.haveServiceUUID() && advertisedDevice.isAdvertisingService(serviceUUID)) {
      BLEDevice::getScan()->stop();
      myDevice = new BLEAdvertisedDevice(advertisedDevice);
      doConnect = true;
      doScan = true;

    } // Found our server
  } // onResult
}; // MyAdvertisedDeviceCallbacks


void setupBLE(){
  BLEDevice::init("RaedamUnit8");
  BLEScan* pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pBLEScan->setInterval(1349);
  pBLEScan->setWindow(449);
  pBLEScan->setActiveScan(true);
  pBLEScan->start(60, false);
}

void verifyBLEConnection(){
  if (doConnect == true) {
    if (connectToServer()) {
      Serial.println("We are now connected to the BLE Server.");
    } else {
      Serial.println("We have failed to connect to the server; there is nothin more we will do.");
    }
    doConnect = false;
  }
}

void sendData(uint8_t* buff, uint8_t buffer_length){
  verifyBLEConnection();
  if (connected) {
    pRemoteCharacteristic->writeValue(buff, buffer_length);
  }else if(doScan){
    BLEDevice::getScan()->start(0); // this is just eample to start scan after disconnect, most likely there is better way to do it in arduino
  }
}

void setup() {
  #ifdef DEBUGGING
    Serial.begin(115200);
  #endif
  setupMesh();
  setupBLE();
}

void loop() {
  mesh.update();
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

  for(int i=0; i<buffer_length; i++){
      buff[i] = t1[i];
  }

  sendData(buff, buffer_length);
}

Task taskSendMessage(TASK_SECOND*COLLECT_TIME, TASK_FOREVER, []() { //collect and send every 30 seconds
    sendPacket(ULTRASONIC_CID, ultra.get());
});

void setupMesh(){
    mesh.init(MESH_SSID, MESH_PASSWORD, &userScheduler, MESH_PORT); //initialize ble mesh
    mesh.setName(NodeName); //assign number to this node

    mesh.onReceive([](String &from, String &msg) { //ble mesh recieved msg
        String fromSensor = from.c_str(); //get node number that sent msg
        String messageFromSensor = msg.c_str(); //msg recieved

        #ifdef DEBUGGING
         Serial.println(String("GOT DATA FROM Sensor: " + fromSensor + " Message: " + messageFromSensor)); //log what node sent the info and what the msg was passed along
        #endif
        
        const unsigned long buffer_length = 4+4;
        uint8_t buff[buffer_length] = { 0 };
        
        for(int i=0; i<buffer_length; i++){
            buff[i] = messageFromSensor[i];
        }
        
        sendData(buff,buffer_length);
      });
    
    mesh.onChangedConnections([]() {});

    userScheduler.addTask(taskSendMessage); //add task to send msg from this node
    taskSendMessage.enable(); //enable task to send msg from this node
}
