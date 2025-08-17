/**
 * UDP Server for Parking Sensor Data Processing
 *
 * This server handles UDP communication between parking sensors and the database,
 * processing ultrasonic sensor data and updating occupancy status in real-time.
 *
 * @author Raedam Team
 * @version 2.0.0
 * @since 2020
 */

const dgram = require('dgram');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const slack = require('slack-notify')(
  'https://hooks.slack.com/services/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',
);

// Configuration
const CONFIG = {
  PORT: 15000,
  DEBUG: true,
  OCCUPIED_DISTANCE_INCHES: 48, // 4 feet in inches
  SOUND_SPEED_MPS: 343, // Speed of sound in m/s
  CONVERSION_FACTOR: 0.000001, // Microsecond to second conversion
  INCHES_PER_METER: 39.37,
};

// Initialize Firebase Admin SDK
const serviceAccount = require('./serverKey.json');
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const database = db.collection('Companies');
const server = dgram.createSocket('udp4');

// Configure Firestore settings
db.settings({
  ignoreUndefinedProperties: true,
});

/**
 * Logging utility function
 * @param {string} message - Message to log
 * @param {string} level - Log level (info, warn, error)
 */
const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  if (CONFIG.DEBUG || level === 'error') {
    console.log(logMessage);
  }
};

/**
 * Send notification to Slack
 * @param {string} message - Message to send
 */
const sendSlackNotification = async(message) => {
  try {
    await slack.alert({
      text: `🚨 Parking Sensor Alert: ${message}`,
      channel: '#parking-alerts',
    });
    log(`Slack notification sent: ${message}`);
  } catch (error) {
    log(`Failed to send Slack notification: ${error.message}`, 'error');
  }
};

/**
 * Calculate distance from ultrasonic sensor data
 * @param {Buffer} msg - UDP message buffer
 * @return {number} Distance in inches
 */
const calculateDistance = (msg) => {
  const timeMicroseconds = msg.readUIntLE(1, 2);
  const timeSeconds = timeMicroseconds * CONFIG.CONVERSION_FACTOR;
  const distanceMeters = (timeSeconds * CONFIG.SOUND_SPEED_MPS) / 2;
  const distanceInches = distanceMeters * CONFIG.INCHES_PER_METER;
  return parseFloat(distanceInches.toFixed(3));
};

/**
 * Determine occupancy status based on distance
 * @param {number} distance - Distance in inches
 * @return {boolean} True if occupied, false if vacant
 */
const determineOccupancy = (distance) => {
  return distance <= CONFIG.OCCUPIED_DISTANCE_INCHES;
};

/**
 * Process sensor data and update database
 * @param {Object} sensorData - Sensor information from database
 * @param {number} distance - Calculated distance
 * @param {boolean} occupied - Occupancy status
 * @param {Date} timestamp - Current timestamp
 */
const processSensorData = async (sensorData, distance, occupied, timestamp) => {
  const { Company: company, Location: location, Floor: floor, SpotID: sensorId } = sensorData;

  log(`Processing sensor data: ${company}/${location}/${floor}/${sensorId} - Distance: ${distance}in, Occupied: ${occupied}`);

  try {
    await appendData(company, location, floor, String(sensorId), occupied, '', timestamp, distance);
    await queryDatabase(company, location, floor);
    await databaseListener(company, location, floor);
  } catch (error) {
    log(`Error processing sensor data: ${error.message}`, 'error');
    await sendSlackNotification(`Data processing error: ${error.message}`);
  }
};

/**
 * Add data entry for parking spot
 * @param {string} company - Company name
 * @param {string} location - Location identifier
 * @param {string} floor - Floor identifier
 * @param {string} sensorId - Sensor ID
 * @param {boolean} state - Occupancy state
 * @param {string} occupant - Occupant information
 * @param {Date} time - Timestamp
 * @param {number} distance - Distance measurement
 */
const appendData = async (company, location, floor, sensorId, state, occupant, time, distance) => {
  try {
    const sensorDoc = await database
      .doc(company)
      .collection('Data')
      .doc(location)
      .collection(floor)
      .doc(sensorId)
      .get();

    if (!sensorDoc.exists) {
      log(`Document does not exist for sensor ID: ${sensorId}`, 'warn');
      return;
    }

    await spotLogCheck(company, location, floor, sensorId, state, occupant, time, distance);
  } catch (error) {
    log(`Error getting document: ${error.message}`, 'error');
    throw error;
  }
};

/**
 * Check if spot logging should be updated or new document created
 * @param {string} company - Company name
 * @param {string} location - Location identifier
 * @param {string} floor - Floor identifier
 * @param {string} sensorId - Sensor ID
 * @param {boolean} state - Occupancy state
 * @param {string} occupant - Occupant information
 * @param {Date} time - Timestamp
 * @param {number} distance - Distance measurement
 */
const spotLogCheck = async (company, location, floor, sensorId, state, occupant, time, distance) => {
  try {
    const dataCollection = database
      .doc(company)
      .collection('Data')
      .doc(location)
      .collection(floor)
      .doc(sensorId)
      .collection('Data');

    const snapshot = await dataCollection.get();

    if (snapshot.size === 0) {
      await addSpotDocument(company, location, floor, sensorId, state, occupant, time, distance);
    } else {
      await processExistingData(company, location, floor, sensorId, state, occupant, time, distance);
    }
  } catch (error) {
    log(`Error in spotLogCheck: ${error.message}`, 'error');
    throw error;
  }
};

/**
 * Add new spot document to database
 * @param {string} company - Company name
 * @param {string} location - Location identifier
 * @param {string} floor - Floor identifier
 * @param {string} sensorId - Sensor ID
 * @param {boolean} state - Occupancy state
 * @param {string} occupant - Occupant information
 * @param {Date} time - Timestamp
 * @param {number} distance - Distance measurement
 */
const addSpotDocument = async (company, location, floor, sensorId, state, occupant, time, distance) => {
  try {
    const timeData = {
      Start: time,
      End: time,
    };

    const documentData = {
      Occupied: state,
      Occupant: occupant,
      Time: timeData,
      Distance: distance,
    };

    await database
      .doc(company)
      .collection('Data')
      .doc(location)
      .collection(floor)
      .doc(sensorId)
      .collection('Data')
      .add(documentData);

    log(`New spot document added for sensor: ${sensorId}`);
  } catch (error) {
    log(`Error adding spot document: ${error.message}`, 'error');
    throw error;
  }
};

/**
 * Process existing data and determine if merge or new document is needed
 * @param {string} company - Company name
 * @param {string} location - Location identifier
 * @param {string} floor - Floor identifier
 * @param {string} sensorId - Sensor ID
 * @param {boolean} state - Occupancy state
 * @param {string} occupant - Occupant information
 * @param {Date} time - Timestamp
 * @param {number} distance - Distance measurement
 */
const processExistingData = async (company, location, floor, sensorId, state, occupant, time, distance) => {
  try {
    const dataCollection = database
      .doc(company)
      .collection('Data')
      .doc(location)
      .collection(floor)
      .doc(sensorId)
      .collection('Data');

    const latestDoc = await dataCollection
      .orderBy('Time.End', 'desc')
      .limit(1)
      .get();

    if (latestDoc.empty) {
      await addSpotDocument(company, location, floor, sensorId, state, occupant, time, distance);
      return;
    }

    const latestData = latestDoc.docs[0].data();
    const latestOccupied = latestData.Occupied;
    const latestTime = latestData.Time.End;

    // Check if state changed or if it's been more than 5 minutes
    const timeDiff = Math.abs(time - latestTime) / (1000 * 60); // minutes
    const shouldCreateNew = state !== latestOccupied || timeDiff > 5;

    if (shouldCreateNew) {
      await addSpotDocument(company, location, floor, sensorId, state, occupant, time, distance);
    } else {
      // Update existing document end time
      await latestDoc.docs[0].ref.update({
        'Time.End': time,
        'Distance': distance,
      });
    }
  } catch (error) {
    log(`Error processing existing data: ${error.message}`, 'error');
    throw error;
  }
};

/**
 * Query database for current occupancy data
 * @param {string} company - Company name
 * @param {string} location - Location identifier
 * @param {string} floor - Floor identifier
 */
const queryDatabase = async (company, location, floor) => {
  try {
    const snapshot = await database
      .doc(company)
      .collection('Data')
      .doc(location)
      .collection(floor)
      .get();

    let totalSpots = 0;

    snapshot.forEach((_doc) => {
      totalSpots++;
      // Additional logic for counting occupied spots can be added here
    });

    log(`Database query completed for ${company}/${location}/${floor} - Total spots: ${totalSpots}`);
  } catch (error) {
    log(`Error querying database: ${error.message}`, 'error');
  }
};

/**
 * Set up database listener for real-time updates
 * @param {string} company - Company name
 * @param {string} location - Location identifier
 * @param {string} floor - Floor identifier
 */
const databaseListener = async (company, location, floor) => {
  try {
    const listener = database
      .doc(company)
      .collection('Data')
      .doc(location)
      .collection(floor)
      .onSnapshot((_snapshot) => {
        log(`Database listener active for ${company}/${location}/${floor}`);
      }, (error) => {
        log(`Database listener error: ${error.message}`, 'error');
      });

    return listener;
  } catch (error) {
    log(`Error setting up database listener: ${error.message}`, 'error');
  }
};

// UDP Server event handlers
server.on('error', (error) => {
  log(`UDP Server error: ${error.message}`, 'error');
  server.close();
});

server.on('message', async (msg, info) => {
  const timestamp = new Date();

  log('─'.repeat(100));
  log(`PACKET RECEIVED: Length: [${msg.length}] | Address: [${info.address}] | Port: [${info.port}] | Time: [${timestamp}]`);

  // Validate packet length
  if (msg.length !== 8 && msg.length !== 3) {
    const hexString = msg.toString('hex');
    const errorMessage = `Invalid packet length: ${msg.length}. Packet data: ${hexString}`;
    log(errorMessage, 'error');
    await sendSlackNotification(errorMessage);
    return;
  }

  try {
    const uniqueId = msg.readUIntLE(0, 1);

    // Get sensor data from database
    const sensorDoc = await db.collection('Sensors').doc(String(uniqueId)).get();

    if (!sensorDoc.exists) {
      log(`Sensor not found in database: ${uniqueId}`, 'warn');
      return;
    }

    const sensorData = sensorDoc.data();
    const distance = calculateDistance(msg);
    const occupied = determineOccupancy(distance);

    log(`Sensor: ${sensorData.Company}/${sensorData.Location}/${sensorData.Floor}/${sensorData.SpotID} | Distance: ${distance}in | Occupied: ${occupied}`);

    await processSensorData(sensorData, distance, occupied, timestamp);
  } catch (error) {
    log(`Error processing UDP message: ${error.message}`, 'error');
    await sendSlackNotification(`UDP processing error: ${error.message}`);
  }
});

// Start server
server.bind(CONFIG.PORT, () => {
  log(`UDP Server started on port ${CONFIG.PORT}`);
  log('Server is ready to receive parking sensor data');
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('Shutting down UDP server...');
  server.close(() => {
    log('UDP Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  log('Shutting down UDP server...');
  server.close(() => {
    log('UDP Server stopped');
    process.exit(0);
  });
});
