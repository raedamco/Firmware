/**
 * Configuration Header for ESP32 WiFi Internal Testing Firmware
 * 
 * This file contains all configuration constants and defines for the
 * ESP32-based parking sensor internal testing system, including WiFi,
 * mesh network, BLE, and ultrasonic sensor settings.
 * 
 * @author Raedam Team
 * @version 2.0.0
 * @since 2019
 */

#ifndef CONFIG_H
#define CONFIG_H

// ============================================================================
// WiFi Configuration (Direct Connection)
// ============================================================================
#define WIFI_SSID           "PSU Registered Devices"
#define WIFI_PASS           ""
#define SERVER_IP           "35.247.56.47"
#define SERVER_PORT         15100

// ============================================================================
// Mesh Network Configuration
// ============================================================================
#define MESH_SSID           "RaedamSSID-InternalTesting"
#define MESH_PASSWORD       "RaedamPassword"
#define MESH_PORT           5555
#define MESH_CHANNEL        1
#define MESH_MAX_CONNECTIONS 10

// ============================================================================
// Device Identification
// ============================================================================
#define UNIQUE_ID           3
#define DEVICE_NAME         "RaedamTestUnit3"
#define FIRMWARE_VERSION    "2.0.0-TESTING"

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
#define BLE_SCAN_INTERVAL  1349    // BLE scan interval in milliseconds
#define BLE_SCAN_WINDOW    449     // BLE scan window in milliseconds
#define BLE_SCAN_TIMEOUT   60      // BLE scan timeout in seconds
#define MESH_UPDATE_INTERVAL 100   // Mesh update interval in milliseconds

// ============================================================================
// BLE Configuration
// ============================================================================
#define BLE_SERVICE_UUID   "9c1b9a0d-b5be-4a40-8f7a-66b36d0a5176"
#define BLE_CHAR_UUID      "b4250401-fb4b-4746-b2b0-93f0e61122c6"

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

// ============================================================================
// Testing Configuration
// ============================================================================
#define TESTING_MODE        true   // Enable testing-specific features
#define UDP_ENABLED         true   // Enable UDP communication
#define MESH_ENABLED        true   // Enable mesh networking
#define BLE_ENABLED         true   // Enable BLE functionality

#endif // CONFIG_H
