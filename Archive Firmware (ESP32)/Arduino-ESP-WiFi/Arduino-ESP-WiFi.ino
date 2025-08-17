/**
 * ESP32 WiFi Parking Sensor Firmware
 * 
 * This firmware implements a parking sensor system using ESP32 with:
 * - Ultrasonic distance sensing for occupancy detection
 * - WiFi mesh networking for data transmission
 * - Bluetooth Low Energy (BLE) for mobile connectivity
 * - Scheduled data collection and transmission
 * 
 * @author Raedam Team
 * @version 2.0.0
 * @since 2019
 */

#include "config.h"
#include "ultrasonic.h"
#include "namedMesh.h"
#include "BLEDevice.h"
#include "BLEClient.h"
#include "BLEScan.h"
#include "BLERemoteService.h"
#include "BLERemoteCharacteristic.h"

// ============================================================================
// Global Objects and Variables
// ============================================================================

Scheduler userScheduler;
NamedMesh mesh;
Ultrasonic ultrasonic(PIN_TRIG, PIN_ECHO, OCCUPIED_DISTANCE_CM);

String nodeName = String(UNIQUE_ID);

// BLE Configuration
static BLEUUID serviceUUID(BLE_SERVICE_UUID);
static BLEUUID charUUID(BLE_CHAR_UUID);

// BLE State Variables
static bool doConnect = false;
static bool connected = false;
static bool doScan = false;
static BLERemoteCharacteristic* pRemoteCharacteristic = nullptr;
static BLEAdvertisedDevice* myDevice = nullptr;

// ============================================================================
// BLE Callback Classes
// ============================================================================

/**
 * BLE Client callbacks for connection management
 */
class MyClientCallback : public BLEClientCallbacks {
public:
  void onConnect(BLEClient* pclient) override {
    #ifdef DEBUGGING
      Serial.println("[BLE] Connected to server");
    #endif
  }

  void onDisconnect(BLEClient* pclient) override {
    connected = false;
    #ifdef DEBUGGING
      Serial.println("[BLE] Disconnected from server");
    #endif
  }
};

/**
 * BLE Advertised device callbacks for device discovery
 */
class MyAdvertisedDeviceCallbacks : public BLEAdvertisedDeviceCallbacks {
public:
  void onResult(BLEAdvertisedDevice advertisedDevice) override {
    #ifdef DEBUGGING
      Serial.printf("[BLE] Advertised Device found: %s\n", advertisedDevice.toString().c_str());
    #endif
    
    // Check if device has the service we're looking for
    if (advertisedDevice.haveServiceUUID() && advertisedDevice.isAdvertisingService(serviceUUID)) {
      BLEDevice::getScan()->stop();
      myDevice = new BLEAdvertisedDevice(advertisedDevice);
      doConnect = true;
      doScan = true;
      
      #ifdef DEBUGGING
        Serial.println("[BLE] Found target server, attempting connection");
      #endif
    }
  }
};

// ============================================================================
// BLE Functions
// ============================================================================

/**
 * Initialize BLE device and scanning
 */
void setupBLE() {
  BLEDevice::init(DEVICE_NAME);
  BLEScan* pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pBLEScan->setInterval(BLE_SCAN_INTERVAL);
  pBLEScan->setWindow(BLE_SCAN_WINDOW);
  pBLEScan->setActiveScan(true);
  pBLEScan->start(BLE_SCAN_TIMEOUT, false);
  
  #ifdef DEBUGGING
    Serial.printf("[BLE] Initialized as %s, scanning for services\n", DEVICE_NAME);
  #endif
}

/**
 * Connect to BLE server
 * @return true if connection successful, false otherwise
 */
bool connectToServer() {
  if (!myDevice) {
    #ifdef DEBUGGING
      Serial.println("[BLE] No device to connect to");
    #endif
    return false;
  }
  
  #ifdef DEBUGGING
    Serial.printf("[BLE] Forming connection to %s\n", myDevice->getAddress().toString().c_str());
  #endif
  
  BLEClient* pClient = BLEDevice::createClient();
  if (!pClient) {
    #ifdef DEBUGGING
      Serial.println("[BLE] Failed to create client");
    #endif
    return false;
  }
  
  pClient->setClientCallbacks(new MyClientCallback());
  
  // Connect to the remote BLE server
  if (!pClient->connect(myDevice)) {
    #ifdef DEBUGGING
      Serial.println("[BLE] Failed to connect to server");
    #endif
    pClient->disconnect();
    return false;
  }
  
  #ifdef DEBUGGING
    Serial.println("[BLE] Connected to server");
  #endif
  
  // Get the service
  BLERemoteService* pRemoteService = pClient->getService(serviceUUID);
  if (!pRemoteService) {
    #ifdef DEBUGGING
      Serial.printf("[BLE] Failed to find service UUID: %s\n", serviceUUID.toString().c_str());
    #endif
    pClient->disconnect();
    return false;
  }
  
  #ifdef DEBUGGING
    Serial.println("[BLE] Found target service");
  #endif
  
  // Get the characteristic
  pRemoteCharacteristic = pRemoteService->getCharacteristic(charUUID);
  if (!pRemoteCharacteristic) {
    #ifdef DEBUGGING
      Serial.printf("[BLE] Failed to find characteristic UUID: %s\n", charUUID.toString().c_str());
    #endif
    pClient->disconnect();
    return false;
  }
  
  #ifdef DEBUGGING
    Serial.println("[BLE] Found target characteristic");
    
    // Read characteristic value if possible
    if (pRemoteCharacteristic->canRead()) {
      std::string value = pRemoteCharacteristic->readValue();
      Serial.printf("[BLE] Characteristic value: %s\n", value.c_str());
    }
  #endif
  
  // Register for notifications if supported
  if (pRemoteCharacteristic->canNotify()) {
    pRemoteCharacteristic->registerForNotify([](BLERemoteCharacteristic* pBLERemoteCharacteristic, 
                                                uint8_t* pData, size_t length, bool isNotify) {
      #ifdef DEBUGGING
        Serial.printf("[BLE] Notification: length=%d, data=%s\n", length, (char*)pData);
      #endif
    });
  }
  
  connected = true;
  return true;
}

/**
 * Verify and maintain BLE connection
 */
void verifyBLEConnection() {
  if (doConnect) {
    if (connectToServer()) {
      #ifdef DEBUGGING
        Serial.println("[BLE] Successfully connected to BLE server");
      #endif
    } else {
      #ifdef DEBUGGING
        Serial.println("[BLE] Failed to connect to server");
      #endif
    }
    doConnect = false;
  }
  
  // Restart scanning if disconnected
  if (!connected && doScan) {
    BLEDevice::getScan()->start(0);
  }
}

/**
 * Send data via BLE
 * @param buff - Data buffer to send
 * @param bufferLength - Length of data buffer
 */
void sendData(uint8_t* buff, uint8_t bufferLength) {
  verifyBLEConnection();
  
  if (connected && pRemoteCharacteristic) {
    if (pRemoteCharacteristic->canWrite()) {
      pRemoteCharacteristic->writeValue(buff, bufferLength);
      #ifdef DEBUGGING
        Serial.printf("[BLE] Sent %d bytes\n", bufferLength);
      #endif
    } else {
      #ifdef DEBUGGING
        Serial.println("[BLE] Characteristic does not support writing");
      #endif
    }
  } else if (doScan) {
    BLEDevice::getScan()->start(0);
  }
}

// ============================================================================
// Data Packet Functions
// ============================================================================

/**
 * Create and send sensor data packet
 * @param sensorCid - Sensor component ID
 * @param distance - Distance measurement
 */
void sendPacket(uint8_t sensorCid, uint32_t distance) {
  // Create packet structure
  struct {
    uint32_t uid;
    uint32_t result;
  } packet = {
    .uid = UNIQUE_ID,
    .result = distance
  };
  
  // Send via BLE
  sendData((uint8_t*)&packet, sizeof(packet));
  
  #ifdef DEBUGGING
    Serial.printf("[Packet] Sent: UID=%lu, Distance=%lu μs\n", packet.uid, packet.result);
  #endif
}

// ============================================================================
// Mesh Network Functions
// ============================================================================

/**
 * Initialize mesh network
 */
void setupMesh() {
  mesh.init(MESH_SSID, MESH_PASSWORD, &userScheduler, MESH_PORT);
  mesh.setName(nodeName);
  
  // Handle received messages
  mesh.onReceive([](String& from, String& msg) {
    #ifdef DEBUGGING
      Serial.printf("[Mesh] Received from %s: %s\n", from.c_str(), msg.c_str());
    #endif
    
    // Forward message to BLE server
    if (msg.length() >= PACKET_TOTAL_SIZE) {
      uint8_t buffer[PACKET_TOTAL_SIZE];
      for (int i = 0; i < PACKET_TOTAL_SIZE && i < msg.length(); i++) {
        buffer[i] = msg.charAt(i);
      }
      sendData(buffer, PACKET_TOTAL_SIZE);
    }
  });
  
  // Handle connection changes
  mesh.onChangedConnections([]() {
    #ifdef DEBUGGING
      Serial.println("[Mesh] Connection topology changed");
    #endif
  });
  
  // Add scheduled task for sending sensor data
  Task taskSendMessage(TASK_SECOND * COLLECT_TIME, TASK_FOREVER, []() {
    uint32_t distance = ultrasonic.getEchoTime();
    sendPacket(ULTRASONIC_CID, distance);
  });
  
  userScheduler.addTask(taskSendMessage);
  taskSendMessage.enable();
  
  #ifdef DEBUGGING
    Serial.printf("[Mesh] Initialized as node: %s\n", nodeName.c_str());
  #endif
}

// ============================================================================
// Arduino Setup and Loop
// ============================================================================

void setup() {
  #ifdef DEBUGGING
    Serial.begin(SERIAL_BAUD_RATE);
    Serial.println("\n" + String("=") * 50);
    Serial.printf("[System] ESP32 Parking Sensor v%s\n", FIRMWARE_VERSION);
    Serial.printf("[System] Device ID: %d\n", UNIQUE_ID);
    Serial.printf("[System] Node Name: %s\n", nodeName.c_str());
    Serial.println(String("=") * 50);
  #endif
  
  // Initialize ultrasonic sensor
  ultrasonic.begin();
  
  // Initialize mesh network
  setupMesh();
  
  // Initialize BLE
  setupBLE();
  
  #ifdef DEBUGGING
    Serial.println("[System] Setup complete, entering main loop");
  #endif
}

void loop() {
  // Update mesh network
  mesh.update();
  
  // Update BLE connections
  verifyBLEConnection();
  
  // Small delay to prevent watchdog issues
  delay(MESH_UPDATE_INTERVAL);
}
