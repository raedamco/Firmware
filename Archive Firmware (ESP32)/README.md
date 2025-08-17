# ESP32 Parking Sensor Firmware

This directory contains the Arduino firmware for ESP32-based parking sensors used in the Raedam parking management system.

## 🏗️ Firmware Architecture

The system consists of three main firmware variants:

### 1. WiFi-Enabled Sensor (`Arduino-ESP-WiFi/`)
- **Primary Function**: Direct WiFi connection to server
- **Features**: 
  - Ultrasonic distance sensing with advanced error handling
  - WiFi mesh networking for data transmission
  - Bluetooth Low Energy (BLE) for mobile connectivity
  - Scheduled data collection and transmission
  - Direct UDP packet sending
  - Modern C++ class structure with comprehensive error handling

### 2. Mesh Node (`Arduino-ESP-Node/`)
- **Primary Function**: Mesh network relay node
- **Features**:
  - Ultrasonic distance sensing with validation
  - Mesh network data forwarding
  - Chain-based data transmission
  - No direct WiFi connection
  - Optimized for battery life and reliability

### 3. Internal Testing (`Arduino-ESP-WiFi-InternalTesting/`)
- **Primary Function**: Development and testing environment
- **Features**:
  - All WiFi sensor capabilities
  - Direct UDP communication to testing server
  - Enhanced debugging and monitoring
  - Testing-specific configurations
  - Development tools integration

## 📁 File Structure

```
Archive Firmware (ESP32)/
├── Arduino-ESP-WiFi/              # WiFi-enabled sensor firmware
│   ├── Arduino-ESP-WiFi.ino      # Main Arduino sketch (v2.0.0)
│   ├── config.h                   # Configuration constants (v2.0.0)
│   ├── ultrasonic.h               # Ultrasonic sensor class header (v2.0.0)
│   ├── ultrasonic.cpp             # Ultrasonic sensor implementation (v2.0.0)
│   └── namedMesh.h                # Extended mesh networking class (v2.0.0)
├── Arduino-ESP-Node/              # Mesh network node firmware
│   ├── Arduino-ESP-Node.ino      # Main Arduino sketch (v2.0.0)
│   ├── config.h                   # Configuration constants (v2.0.0)
│   ├── ultrasonic.h               # Ultrasonic sensor class header (v2.0.0)
│   ├── ultrasonic.cpp             # Ultrasonic sensor implementation (v2.0.0)
│   └── namedMesh.h                # Extended mesh networking class (v2.0.0)
├── Arduino-ESP-WiFi-InternalTesting/  # Testing version (v2.0.0-TESTING)
│   ├── Arduino-ESP-WiFi-InternalTesting.ino  # Main Arduino sketch
│   ├── config.h                   # Testing configuration constants
│   ├── ultrasonic.h               # Ultrasonic sensor class header
│   ├── ultrasonic.cpp             # Ultrasonic sensor implementation
│   └── namedMesh.h                # Extended mesh networking class
└── README.md                      # This file
```

## 🆕 What's New in Version 2.0.0

### Code Modernization
- **Modern C++**: Updated to use C++11/14 features
- **Class Structure**: Improved ultrasonic sensor class with better encapsulation
- **Error Handling**: Comprehensive error checking and validation
- **Memory Management**: Better memory usage and optimization
- **Code Organization**: Cleaner, more maintainable code structure

### Enhanced Functionality
- **Sensor Validation**: Distance measurement validation and error counting
- **Status Reporting**: Detailed sensor status and performance metrics
- **Configuration Management**: Centralized configuration with clear organization
- **Debug Output**: Structured logging with consistent formatting
- **Power Management**: Configurable power-saving options

### Improved Reliability
- **Timeout Handling**: Proper timeout mechanisms for sensor operations
- **Connection Management**: Better WiFi and BLE connection handling
- **Data Validation**: Input validation and error recovery
- **Performance Monitoring**: Built-in performance metrics and diagnostics

## 🛠️ Hardware Requirements

### ESP32 Development Board
- **Model**: ESP32-WROOM-32 or compatible
- **Flash**: 4MB minimum
- **RAM**: 520KB minimum
- **WiFi**: 802.11 b/g/n
- **Bluetooth**: Bluetooth 4.2 BR/EDR and BLE

### Ultrasonic Sensor
- **Model**: HC-SR04 or compatible
- **Operating Voltage**: 5V
- **Range**: 2cm - 400cm
- **Accuracy**: ±3mm
- **Trigger Pulse**: 10μs minimum

### Power Supply
- **Voltage**: 3.3V (ESP32) + 5V (sensor)
- **Current**: 500mA minimum
- **Recommended**: LiPo battery with voltage regulator

## 🔧 Software Requirements

### Arduino IDE
- **Version**: 1.8.19 or higher
- **Board Package**: ESP32 by Espressif Systems

### Required Libraries
```cpp
// Core ESP32 libraries (included with board package)
#include "WiFi.h"
#include "BLEDevice.h"
#include "BLEClient.h"
#include "BLEScan.h"
#include "BLERemoteService.h"
#include "BLERemoteCharacteristic.h"

// Third-party libraries (install via Library Manager)
#include "painlessMesh.h"        // Mesh networking
#include "ArduinoJson.h"         // JSON parsing (v6.x recommended)
#include "TaskScheduler.h"       // Task scheduling
```

## ⚙️ Configuration

### Basic Configuration (`config.h`)
```cpp
// Mesh Network
#define MESH_SSID           "RaedamSSID"
#define MESH_PASSWORD       "RaedamPassword"
#define MESH_PORT           5555

// Device Identification
#define UNIQUE_ID           8
#define DEVICE_NAME         "RaedamUnit8"
#define FIRMWARE_VERSION    "2.0.0"

// Pin Configuration
#define PIN_ECHO           27
#define PIN_TRIG           12

// Timing
#define COLLECT_TIME       900     // 15 minutes
#define MESH_UPDATE_INTERVAL 100   // 100ms
```

### Advanced Configuration
```cpp
// Ultrasonic Sensor
#define OCCUPIED_DISTANCE_CM 100   // Occupancy threshold
#define MIN_VALID_DISTANCE_CM      2     // Minimum valid distance
#define MAX_VALID_DISTANCE_CM      400   // Maximum valid distance

// BLE Settings
#define BLE_SCAN_INTERVAL   1349   // Scan interval in ms
#define BLE_SCAN_WINDOW     449    // Scan window in ms
#define BLE_SCAN_TIMEOUT    60     // Scan timeout in seconds

// Power Management
#define DEEP_SLEEP_ENABLED  false  // Enable deep sleep
#define SLEEP_DURATION      300    // Sleep duration in seconds
```

## 🚀 Installation & Setup

### 1. Install Arduino IDE
1. Download Arduino IDE from [arduino.cc](https://www.arduino.cc/en/software)
2. Install ESP32 board package:
   - Go to `Tools > Board > Boards Manager`
   - Search for "ESP32"
   - Install "ESP32 by Espressif Systems"

### 2. Install Required Libraries
1. Go to `Tools > Manage Libraries`
2. Install the following libraries:
   - `painlessMesh` by Gmag12
   - `ArduinoJson` by Benoit Blanchon
   - `TaskScheduler` by Anatoli Arkhipenko

### 3. Configure Firmware
1. Open the appropriate `.ino` file
2. Modify `config.h` with your settings:
   - Set unique device ID
   - Configure WiFi credentials
   - Adjust timing parameters
   - Set pin assignments

### 4. Upload Firmware
1. Connect ESP32 via USB
2. Select correct board: `Tools > Board > ESP32 Arduino > ESP32 Dev Module`
3. Select correct port
4. Click Upload button

## 📊 Data Flow

### WiFi Sensor Data Flow
```
Ultrasonic Sensor → ESP32 → WiFi Mesh → WiFi Gateway → UDP Server
                                    ↓
                              BLE Mobile App
```

### Mesh Node Data Flow
```
Ultrasonic Sensor → ESP32 → Mesh Network → Next Node → WiFi Gateway → UDP Server
```

### Data Packet Format
```cpp
struct SensorPacket {
  uint32_t uid;      // Device unique ID
  uint32_t result;   // Distance measurement in microseconds
};
```

## 🔍 Debugging & Monitoring

### Serial Output
Enable debug output by keeping `#define DEBUGGING` in `config.h`:

```
[System] ESP32 Parking Sensor v2.0.0
[System] Device ID: 8
[System] Node Name: 8
[System] Setup complete, entering main loop
[Ultrasonic] Initialized with pins: Trig=12, Echo=27
[Ultrasonic] Occupancy threshold: 100 cm
[Mesh] Initialized as node: 8
[BLE] Initialized as RaedamUnit8, scanning for services
```

### LED Indicators
- **Built-in LED (GPIO 2)**: System status
- **Blinking**: Normal operation
- **Solid ON**: Error condition
- **OFF**: Deep sleep mode

### Sensor Status
Use the `getStatus()` method to get comprehensive sensor information:
```cpp
String status = ultrasonic.getStatus();
Serial.println(status);
```

## 🔒 Security Considerations

### WiFi Security
- Use WPA2 or WPA3 encryption
- Change default mesh passwords
- Regularly update firmware

### Data Privacy
- BLE connections are unencrypted by default
- Consider implementing BLE encryption for sensitive data
- Validate all received data

## 📈 Performance Optimization

### Power Consumption
- Enable deep sleep when possible
- Reduce mesh update frequency
- Optimize BLE scan intervals

### Network Efficiency
- Use appropriate packet sizes
- Implement data compression if needed
- Batch multiple sensor readings

### Memory Usage
- Monitor heap memory usage
- Avoid dynamic memory allocation in loops
- Use appropriate data types

## 🧪 Testing

### Unit Testing
- Test ultrasonic sensor accuracy
- Verify mesh network connectivity
- Test BLE connection stability

### Integration Testing
- Test end-to-end data flow
- Verify server communication
- Test mobile app connectivity

### Load Testing
- Test with multiple nodes
- Verify network stability under load
- Test power consumption patterns

## 📝 Development Guidelines

### Code Style
- Use consistent naming conventions (PascalCase for classes, camelCase for methods)
- Add comprehensive JSDoc-style comments
- Follow Arduino coding standards
- Use modern C++ features where appropriate

### Error Handling
- Implement proper error checking
- Add timeout mechanisms
- Log all error conditions
- Provide meaningful error messages

### Documentation
- Update this README when making changes
- Document all configuration options
- Maintain change log
- Include code examples

## 🔄 Migration from v1.x

### Breaking Changes
- Class names changed from `ultrasonic` to `Ultrasonic`
- Class names changed from `namedMesh` to `NamedMesh`
- Method names updated for consistency
- Configuration constants reorganized

### Migration Steps
1. Update class instantiations
2. Update method calls
3. Review configuration files
4. Test thoroughly before deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For technical support:
- Check the troubleshooting section above
- Review Arduino ESP32 documentation
- Contact the development team

## 📄 License

This firmware is part of the Raedam parking management system.
Copyright © 2020-2024 Raedam Inc. All rights reserved.

---

**Note**: This firmware is designed for production use in parking management applications. Ensure proper testing and validation before deployment in critical environments. Version 2.0.0 represents a major modernization with improved reliability, performance, and maintainability.
