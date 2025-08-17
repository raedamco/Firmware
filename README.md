# Parking Sensor Firmware & Server System

A comprehensive IoT parking management system that uses ultrasonic sensors to detect parking spot occupancy and provides real-time analytics through a modern server infrastructure.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ESP32 Sensors │    │   UDP Server    │    │  Firebase DB    │
│                 │───▶│                 │───▶│                 │
│ • Ultrasonic    │    │ • Data Processing│   │ • Real-time     │
│ • WiFi/BLE      │    │ • Analytics     │   │ • Analytics     │
│ • Mesh Network  │    │ • Notifications │   │ • Cloud Functions│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
Firmware/
├── Archive Firmware (ESP32)/          # Legacy Arduino firmware
│   ├── Arduino-ESP-Node/             # Mesh network node firmware
│   ├── Arduino-ESP-WiFi/             # WiFi-enabled sensor firmware
│   └── Arduino-ESP-WiFi-InternalTesting/ # Testing version
├── Functions/                         # Firebase Cloud Functions
│   ├── functions/                     # Function source code
│   │   ├── index.js                  # Main functions
│   │   ├── package.json              # Dependencies
│   │   └── .eslintrc.js             # Linting rules
│   ├── firebase.json                 # Firebase configuration
│   └── firestore.rules               # Database security rules
├── Server/                           # Node.js UDP server
│   ├── UDP_Server.js                 # Main UDP server
│   ├── DataTransfer.js               # Database migration utilities
│   ├── Averaging.js                  # Occupancy analytics
│   ├── dataHolder.js                 # Data structure classes
│   ├── package.json                  # Server dependencies
│   └── serverKey.json                # Firebase credentials
└── README.md                         # This file
```

## 🚀 Features

### Core Functionality
- **Real-time Parking Detection**: Ultrasonic sensors detect vehicle presence
- **Mesh Network Support**: ESP32 nodes communicate in mesh topology
- **WiFi Connectivity**: Direct WiFi connection for standalone sensors
- **BLE Integration**: Bluetooth Low Energy for mobile app connectivity

### Server Capabilities
- **UDP Data Processing**: High-performance UDP server for sensor data
- **Real-time Analytics**: Occupancy rate calculations and trend analysis
- **Firebase Integration**: Cloud database with real-time updates
- **Slack Notifications**: Automated alerts for system issues
- **Data Migration**: Tools for database restructuring and migration

### Analytics & Reporting
- **Hourly Occupancy Rates**: Automated calculation of parking utilization
- **Trend Analysis**: Historical data analysis and pattern recognition
- **Multi-floor Support**: Separate analytics for different parking levels
- **Performance Metrics**: Success rates and data quality indicators

## 🛠️ Technology Stack

### Hardware
- **ESP32 Microcontrollers**: WiFi + Bluetooth + Dual-core processing
- **Ultrasonic Sensors**: HC-SR04 or similar distance measurement
- **Power Management**: Battery monitoring and low-power modes

### Software
- **Arduino Framework**: ESP32 development environment
- **Node.js**: Server-side JavaScript runtime
- **Firebase**: Cloud database and functions
- **Firestore**: NoSQL document database
- **UDP Protocol**: Lightweight data transmission

### Development Tools
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Nodemon**: Development server with auto-reload

## 📋 Prerequisites

- **Node.js**: Version 18 or higher
- **Arduino IDE**: For ESP32 firmware development
- **Firebase CLI**: For cloud function deployment
- **ESP32 Board Package**: Arduino ESP32 development board support

## 🔧 Installation & Setup

### 1. Server Setup

```bash
cd Server
npm install
```

### 2. Firebase Functions Setup

```bash
cd Functions/functions
npm install
```

### 3. Firebase Configuration

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (if not already done)
firebase init functions
```

### 4. Environment Configuration

Create a `.env` file in the Server directory:

```env
FIREBASE_PROJECT_ID=your-project-id
SLACK_WEBHOOK_URL=your-slack-webhook
UDP_PORT=15000
DEBUG_MODE=true
```

## 🚀 Usage

### Starting the UDP Server

```bash
cd Server
npm start          # Production mode
npm run dev        # Development mode with auto-reload
```

### Running Analytics

```bash
cd Server
npm run analyze    # Run occupancy analysis
npm run transfer   # Run data migration
```

### Deploying Cloud Functions

```bash
cd Functions
firebase deploy --only functions
```

### Testing

```bash
# Server tests
cd Server
npm test

# Function tests
cd Functions/functions
npm test
```

## 📊 Data Flow

1. **Sensor Detection**: Ultrasonic sensors measure distance to detect vehicles
2. **Data Transmission**: ESP32 sends UDP packets to server
3. **Server Processing**: UDP server processes and validates sensor data
4. **Database Update**: Firestore database is updated with occupancy status
5. **Analytics**: Automated analysis calculates occupancy rates and trends
6. **Notifications**: Slack alerts for system issues and low battery warnings

## 🔒 Security

- **Firebase Security Rules**: Database access control
- **Service Account Keys**: Secure credential management
- **Input Validation**: Server-side data validation
- **Error Handling**: Comprehensive error logging and monitoring

## 📈 Performance

- **UDP Protocol**: Low-latency data transmission
- **Batch Operations**: Efficient database writes
- **Connection Pooling**: Optimized database connections
- **Memory Management**: Efficient data structures and cleanup

## 🧪 Testing

### Unit Tests
- Server functions with Jest
- Data processing utilities
- Analytics calculations

### Integration Tests
- UDP packet processing
- Database operations
- Firebase function triggers

### Load Testing
- High-volume sensor data
- Concurrent database operations
- Memory usage under stress

## 🐛 Troubleshooting

### Common Issues

1. **UDP Server Not Starting**
   - Check port availability
   - Verify Firebase credentials
   - Check Node.js version

2. **Sensor Data Not Processing**
   - Verify packet format
   - Check database connectivity
   - Review error logs

3. **Analytics Not Running**
   - Check cron schedule
   - Verify database permissions
   - Review function logs

### Debug Mode

Enable debug logging by setting `DEBUG_MODE=true` in environment variables.

### Log Files

Server logs are output to console with timestamps and log levels.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- **Raedam Team**: Original development and architecture
- **Omar Waked**: ESP32 firmware and system integration
- **Austin McKee**: Server-side analytics and data processing

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section

## 🔄 Version History

- **v2.0.0** (Current): Modernized codebase, improved documentation, updated dependencies
- **v1.0.0**: Initial release with basic functionality

---

**Note**: This system is designed for production use in parking management applications. Ensure proper testing and validation before deployment in critical environments.
