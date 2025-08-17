/**
 * Configuration Header for ESP32 Mesh Node Firmware
 * 
 * This file contains all configuration constants and defines for the
 * ESP32-based mesh network node, including mesh network, ultrasonic
 * sensor, and forwarding settings.
 * 
 * @author Raedam Team
 * @version 2.0.0
 * @since 2019
 */

#ifndef CONFIG_H
#define CONFIG_H

// ============================================================================
// Mesh Network Configuration
// ============================================================================
#define MESH_SSID           "RaedamSSID"
#define MESH_PASSWORD       "RaedamPassword"
#define MESH_PORT           5555
#define MESH_CHANNEL        1
#define MESH_MAX_CONNECTIONS 10

// ============================================================================
// Device Identification
// ============================================================================
#define UNIQUE_ID           8
#define NEXT_NODE_ID        "9"  // ID of the next node in the chain
#define DEVICE_NAME         "RaedamNode8"
#define FIRMWARE_VERSION    "2.0.0"

// ============================================================================
// Pin Configuration
// ============================================================================
#define PIN_ECHO           27
#define PIN_TRIG           12
#define PIN_LED            2  // Built-in LED for status indication

// ============================================================================
// Ultrasonic Sensor Configuration
// ============================================================================
#define ULTRASONIC_CID     1
#define OCCUPIED_DISTANCE_CM 100
#define OCCUPIED_DISTANCE_IN 39.37  // 100cm in inches
#define MIN_DISTANCE_CM    2
#define MAX_DISTANCE_CM    400

// ============================================================================
// Timing Configuration
// ============================================================================
#define COLLECT_TIME       900     // Data collection interval in seconds (15 minutes)
#define MESH_UPDATE_INTERVAL 100   // Mesh update interval in milliseconds

// ============================================================================
// Debug and Development
// ============================================================================
#define DEBUGGING          // Comment out to disable debug output
#define SERIAL_BAUD_RATE   115200

// ============================================================================
// Data Packet Configuration
// ============================================================================
#define PACKET_HEADER_SIZE 4
#define PACKET_DATA_SIZE   4
#define PACKET_TOTAL_SIZE  (PACKET_HEADER_SIZE + PACKET_DATA_SIZE)

// ============================================================================
// Error Handling
// ============================================================================
#define MAX_RETRY_ATTEMPTS 3
#define CONNECTION_TIMEOUT 30000   // 30 seconds

// ============================================================================
// Power Management
// ============================================================================
#define DEEP_SLEEP_ENABLED false   // Enable deep sleep for battery optimization
#define SLEEP_DURATION     300     // Sleep duration in seconds (5 minutes)

#endif // CONFIG_H
