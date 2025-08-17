/**
 * ESP32 Mesh Node Firmware for Parking Sensor System
 * 
 * This firmware implements a mesh network node that:
 * - Receives data from other sensors via mesh network
 * - Forwards data to the next node in the chain
 * - Collects its own ultrasonic sensor data
 * - Maintains mesh network connectivity
 * 
 * @author Raedam Team
 * @version 2.0.0
 * @since 2019
 */

#include "config.h"
#include "ultrasonic.h"
#include "namedMesh.h"

// ============================================================================
// Global Objects and Variables
// ============================================================================

Scheduler userScheduler;
NamedMesh mesh;
Ultrasonic ultrasonic(PIN_TRIG, PIN_ECHO, OCCUPIED_DISTANCE_CM);

String nodeName = String(UNIQUE_ID);
String nextNode = NEXT_NODE_ID;
unsigned long lastUpdate = 0;

// ============================================================================
// Mesh Network Functions
// ============================================================================

/**
 * Initialize mesh network with forwarding capabilities
 */
void setupMesh() {
  mesh.init(MESH_SSID, MESH_PASSWORD, &userScheduler, MESH_PORT);
  mesh.setName(nodeName);
  
  // Handle received messages from other sensors
  mesh.onReceive([](String& from, String& msg) {
    #ifdef DEBUGGING
      Serial.printf("[Mesh] Received from %s: %s\n", from.c_str(), msg.c_str());
    #endif
    
    // Forward message to next node in chain
    if (msg.length() >= PACKET_TOTAL_SIZE) {
      bool forwarded = mesh.sendSingle(nextNode, msg);
      
      #ifdef DEBUGGING
        if (forwarded) {
          Serial.printf("[Mesh] Forwarded message to %s\n", nextNode.c_str());
        } else {
          Serial.printf("[Mesh] Failed to forward message to %s\n", nextNode.c_str());
        }
      #endif
    }
  });
  
  // Handle connection topology changes
  mesh.onChangedConnections([]() {
    #ifdef DEBUGGING
      Serial.println("[Mesh] Connection topology changed");
    #endif
  });
  
  #ifdef DEBUGGING
    Serial.printf("[Mesh] Initialized as node: %s, forwarding to: %s\n", 
                  nodeName.c_str(), nextNode.c_str());
  #endif
}

// ============================================================================
// Data Packet Functions
// ============================================================================

/**
 * Create and send sensor data packet
 * @param sensorCid - Sensor component ID
 * @param distance - Distance measurement in microseconds
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
  
  // Convert packet to string for mesh transmission
  String packetString;
  for (size_t i = 0; i < sizeof(packet); i++) {
    packetString += (char)((uint8_t*)&packet)[i];
  }
  
  // Send to next node in chain
  bool sent = mesh.sendSingle(nextNode, packetString);
  
  #ifdef DEBUGGING
    if (sent) {
      Serial.printf("[Packet] Sent to %s: UID=%lu, Distance=%lu μs\n", 
                    nextNode.c_str(), packet.uid, packet.result);
    } else {
      Serial.printf("[Packet] Failed to send to %s\n", nextNode.c_str());
    }
  #endif
}

// ============================================================================
// Sensor Data Collection
// ============================================================================

/**
 * Collect sensor data and send packet
 */
void collectAndSendData() {
  // Perform ultrasonic measurement
  if (ultrasonic.measure()) {
    uint32_t distance = ultrasonic.getEchoTime();
    sendPacket(ULTRASONIC_CID, distance);
    
    #ifdef DEBUGGING
      Serial.printf("[Sensor] Collected data: Distance=%.2f cm, Occupied=%s\n",
                    ultrasonic.getLastDistanceCm(),
                    ultrasonic.isOccupied() ? "Yes" : "No");
    #endif
  } else {
    #ifdef DEBUGGING
      Serial.println("[Sensor] Failed to collect sensor data");
    #endif
  }
}

// ============================================================================
// Arduino Setup and Loop
// ============================================================================

void setup() {
  #ifdef DEBUGGING
    Serial.begin(SERIAL_BAUD_RATE);
    Serial.println("\n" + String("=") * 50);
    Serial.printf("[System] ESP32 Mesh Node v%s\n", FIRMWARE_VERSION);
    Serial.printf("[System] Device ID: %d\n", UNIQUE_ID);
    Serial.printf("[System] Node Name: %s\n", nodeName.c_str());
    Serial.printf("[System] Forwarding to: %s\n", nextNode.c_str());
    Serial.println(String("=") * 50);
  #endif
  
  // Initialize ultrasonic sensor
  ultrasonic.begin();
  
  // Initialize mesh network
  setupMesh();
  
  #ifdef DEBUGGING
    Serial.println("[System] Setup complete, entering main loop");
  #endif
}

void loop() {
  // Update mesh network
  mesh.update();
  
  // Collect and send sensor data at specified intervals
  if (millis() - lastUpdate >= (COLLECT_TIME * 1000)) {
    lastUpdate = millis();
    collectAndSendData();
  }
  
  // Small delay to prevent watchdog issues
  delay(MESH_UPDATE_INTERVAL);
}



/******Documentation*****
  WiFi                https://www.arduino.cc/en/Reference/WiFi
  WiFi.begion()       https://www.arduino.cc/en/Reference/WiFiBegin
  WiFi.status()       https://www.arduino.cc/en/Reference/WiFiStatus
  WiFi.write()        https://www.arduino.cc/en/Reference/WiFiServerWrite
*/
