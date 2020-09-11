//
//  Firmware.ino
//  Raedam
//
//  Created on 1/10/2019. Modified on 9/10/2020.
//  Copyright © 2020 Raedam Inc. All rights reserved.
//

#include "config.h"
#include "ultrasonic.h"
#include "BLEDevice.h"

ultrasonic ultra = ultrasonic(PIN_TRIG,PIN_ECHO);

static BLEUUID serviceUUID("9c1b9a0d-b5be-4a40-8f7a-66b36d0a5176"); //Sensor UUID we are connecting to 
static BLEUUID    charUUID("1c1b9a0d-b5be-4a40-8f7a-66b36d0a5176"); //This sensor's UUID: replace the first digit with sensors' ID

static boolean doConnect = false;
static boolean connected = false;
static boolean doScan = false;
static BLERemoteCharacteristic* pRemoteCharacteristic;
static BLEAdvertisedDevice* myDevice;

String NodeID = "RaedamUnit" + String(UNIQUE_ID); 

unsigned long lastUpdate = 0;

static void notifyCallback(BLERemoteCharacteristic* pBLERemoteCharacteristic, uint8_t* pData, size_t length, bool isNotify) {
    #ifdef DEBUG
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
    #ifdef DEBUG
      Serial.println("onDisconnect");
    #endif
  }
};

bool connectToServer() {
    #ifdef DEBUG
      Serial.print("Forming a connection to ");
      Serial.println(myDevice->getAddress().toString().c_str());
    #endif
    
    BLEClient*  pClient  = BLEDevice::createClient();
    #ifdef DEBUG
      Serial.println(" - Created client");
    #endif
    pClient->setClientCallbacks(new MyClientCallback());

    // Connect to the remove BLE Server.
    pClient->connect(myDevice);  // if you pass BLEAdvertisedDevice instead of address, it will be recognized type of peer device address (public or private)
    #ifdef DEBUG
      Serial.println(" - Connected to server");
    #endif
    
    // Obtain a reference to the service we are after in the remote BLE server.
    BLERemoteService* pRemoteService = pClient->getService(serviceUUID);
    if (pRemoteService == nullptr) {
      #ifdef DEBUG
        Serial.print("Failed to find our service UUID: ");
        Serial.println(serviceUUID.toString().c_str());
      #endif
      pClient->disconnect();
      return false;
    }
    
    #ifdef DEBUG
      Serial.println(" - Found our service");
    #endif

    // Obtain a reference to the characteristic in the service of the remote BLE server.
    pRemoteCharacteristic = pRemoteService->getCharacteristic(charUUID);
    if (pRemoteCharacteristic == nullptr) {
      #ifdef DEBUG
        Serial.print("Failed to find our characteristic UUID: ");
        Serial.println(charUUID.toString().c_str());
      #endif
      pClient->disconnect();
      return false;
    }
    #ifdef DEBUG
      Serial.println(" - Found our characteristic");
    #endif
    
    // Read the value of the characteristic.
    if(pRemoteCharacteristic->canRead()) {
      std::string value = pRemoteCharacteristic->readValue();
      #ifdef DEBUG
        Serial.print("The characteristic value was: ");
        Serial.println(value.c_str());
      #endif
    }

    if(pRemoteCharacteristic->canNotify())
      pRemoteCharacteristic->registerForNotify(notifyCallback);
      
    connected = true;
    return true;
}


class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks { //Scan for BLE servers and find the first one that advertises the service we are looking for.
  void onResult(BLEAdvertisedDevice advertisedDevice) { //Called for each advertising BLE server.
    #ifdef DEBUG
      Serial.print("BLE Advertised Device found: ");
      Serial.println(advertisedDevice.toString().c_str());
    #endif
    
    if (advertisedDevice.haveServiceUUID() && advertisedDevice.isAdvertisingService(serviceUUID)) { //Found a device, see if it contains the service we are looking for.
      BLEDevice::getScan()->stop();
      myDevice = new BLEAdvertisedDevice(advertisedDevice);
      doConnect = true;
      doScan = true;
    } // Found our server
  } // onResult
}; // MyAdvertisedDeviceCallbacks

void setup() {
  Serial.begin(115200);
  setupBLE();
}

void loop() {
  
  if(millis() - lastUpdate >= COLLECT_TIME){
        lastUpdate = millis(); //update old_time to current millis()
        sendPacket(ULTRASONIC_CID, ultra.get());
    }
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

  sendData(buff, buffer_length);
}


void setupBLE(){
  BLEDevice::init("RaedamUnit1"); //Replace with NodeID
  BLEScan* pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pBLEScan->setInterval(1349);
  pBLEScan->setWindow(449);
  pBLEScan->setActiveScan(true);
  pBLEScan->start(60, false);
}

void sendData(uint8_t* buff, uint8_t buffer_length){
  if (doConnect == true) {
    if (connectToServer()) {
      #ifdef DEBUG
        Serial.println("We are now connected to the BLE Server.");
      #endif
    } else {
      #ifdef DEBUG
        Serial.println("We have failed to connect to the server; there is nothin more we will do.");
      #endif
    }
    doConnect = false;
  }

  if (connected) {
    pRemoteCharacteristic->writeValue(buff, buffer_length);
  }else if(doScan){
    BLEDevice::getScan()->start(0);  // this is just eample to start scan after disconnect, most likely there is better way to do it in arduino
  }
}
