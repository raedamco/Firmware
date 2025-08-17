/**
 * Parking Occupancy Analytics and Averaging Module
 *
 * This module calculates average occupancy rates for parking structures and floors,
 * providing insights into parking utilization patterns over time.
 *
 * @author Raedam Team
 * @version 2.0.0
 * @since 2020
 */

const cron = require('node-cron');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Configuration
const CONFIG = {
  DEBUG: true,
  DOCUMENT_AMOUNT: 4, // Number of documents to analyze (60 = 1 hour at 1 doc/min)
  AVERAGE_OCCUPANCY_THRESHOLD: 1, // Minimum occupancy count to mark as occupied
  CRON_SCHEDULE: '0 * * * *', // Every hour at minute 0
  DEFAULT_COMPANY: 'Portland State University',
  DEFAULT_STRUCTURE: 'Parking Structure 1',
  DEFAULT_FLOOR: 'Floor 2',
};

// Initialize Firebase Admin SDK
const serviceAccount = require('./serverKey.json');
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

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
 * Check if a timestamp is within the last hour
 * @param {Date} timestamp - Timestamp to check
 * @return {boolean} True if within last hour
 */
const isWithinLastHour = (timestamp) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return timestamp >= oneHourAgo;
};

/**
 * Get average occupancy for a specific floor
 * @param {string} structureId - Structure identifier
 * @param {string} floorId - Floor identifier
 * @param {number} documentAmount - Number of documents to analyze
 */
async function getAverageFloor(structureId, floorId, documentAmount) {
  try {
    log(`Starting average occupancy calculation for ${structureId}/${floorId}`);

    const result = await parseDatabase(structureId, floorId, documentAmount);
    log(`Average occupancy calculation completed for ${structureId}/${floorId}: ${result}`);

    return result;
  } catch (error) {
    log(`Error calculating average floor occupancy: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Parse database to calculate occupancy averages
 * @param {string} structureId - Structure identifier
 * @param {string} floorId - Floor identifier
 * @param {number} documentAmount - Number of documents to analyze
 * @return {Promise<number>} Average occupancy percentage
 */
async function parseDatabase(structureId, floorId, documentAmount) {
  try {
    log(`Parsing database for ${structureId}/${floorId} with ${documentAmount} documents`);

    const querySnapshot = await db
      .collection('Companies')
      .doc(CONFIG.DEFAULT_COMPANY)
      .collection('Data')
      .doc(structureId)
      .collection(floorId)
      .get();

    if (querySnapshot.empty) {
      log(`No documents found for ${structureId}/${floorId}`, 'warn');
      return 0;
    }

    let totalAverage = 0;
    let itemsProcessed = 0;
    const totalSpots = querySnapshot.size;

    // Process each parking spot
    for (const doc of querySnapshot.docs) {
      try {
        const spotId = doc.id;
        const spotAverage = await retrieveData(structureId, floorId, spotId, documentAmount);
        totalAverage += spotAverage;
        itemsProcessed++;

        log(`Processed spot ${spotId}: ${spotAverage} (${itemsProcessed}/${totalSpots})`);
      } catch (error) {
        log(`Error processing spot ${doc.id}: ${error.message}`, 'error');
        // Continue processing other spots
      }
    }

    if (itemsProcessed === 0) {
      log('No spots were processed successfully', 'warn');
      return 0;
    }

    const finalAverage = totalAverage / totalSpots;
    log(`Final average occupancy for ${structureId}/${floorId}: ${finalAverage.toFixed(2)}%`);

    // Add aggregated data to database
    await addAggregatedData(structureId, floorId, finalAverage, totalSpots, itemsProcessed);

    return finalAverage;
  } catch (error) {
    log(`Error parsing database: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Retrieve and analyze data for a specific parking spot
 * @param {string} structureId - Structure identifier
 * @param {string} floorId - Floor identifier
 * @param {string} spotId - Parking spot identifier
 * @param {number} documentAmount - Number of documents to analyze
 * @return {Promise<number>} Average occupancy for the spot
 */
async function retrieveData(structureId, floorId, spotId, documentAmount) {
  try {
    const querySnapshot = await db
      .collection('Companies')
      .doc(CONFIG.DEFAULT_COMPANY)
      .collection('Data')
      .doc(structureId)
      .collection(floorId)
      .doc(spotId)
      .collection('Data')
      .orderBy('Time.End', 'desc')
      .limit(documentAmount)
      .get();

    if (querySnapshot.empty) {
      log(`No data found for spot ${spotId}`, 'warn');
      return 0;
    }

    let occupiedCount = 0;
    let validDataCount = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const timeEnd = data.Time?.End;

      if (timeEnd && isWithinLastHour(timeEnd)) {
        const occupied = data.Occupied;
        if (occupied === true) {
          occupiedCount++;
        }
        validDataCount++;
      } else {
        log(`Spot ${spotId} data not from last hour. Time: ${timeEnd}`, 'debug');
      }
    });

    if (validDataCount === 0) {
      log(`No valid data found for spot ${spotId}`, 'warn');
      return 0;
    }

    const occupancyPercentage = (occupiedCount / validDataCount) * 100;
    log(`Spot ${spotId} occupancy: ${occupiedCount}/${validDataCount} = ${occupancyPercentage.toFixed(2)}%`);

    return occupancyPercentage;
  } catch (error) {
    log(`Error retrieving data for spot ${spotId}: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Add aggregated occupancy data to the database
 * @param {string} structureId - Structure identifier
 * @param {string} floorId - Floor identifier
 * @param {number} averageOccupancy - Calculated average occupancy
 * @param {number} totalSpots - Total number of spots
 * @param {number} processedSpots - Number of spots successfully processed
 */
async function addAggregatedData(structureId, floorId, averageOccupancy, totalSpots, processedSpots) {
  try {
    const timestamp = new Date();
    const data = {
      timestamp,
      averageOccupancy: parseFloat(averageOccupancy.toFixed(2)),
      totalSpots,
      processedSpots,
      successRate: parseFloat(((processedSpots / totalSpots) * 100).toFixed(2)),
      documentAmount: CONFIG.DOCUMENT_AMOUNT,
      calculationMethod: 'hourly_average',
    };

    await db
      .collection('Companies')
      .doc(CONFIG.DEFAULT_COMPANY)
      .collection('Analytics')
      .doc(structureId)
      .collection(floorId)
      .add(data);

    log(`Aggregated data added for ${structureId}/${floorId}`);
  } catch (error) {
    log(`Error adding aggregated data: ${error.message}`, 'error');
    // Don't throw error as this is not critical to the main function
  }
}

/**
 * Get historical occupancy data for trend analysis
 * @param {string} structureId - Structure identifier
 * @param {string} floorId - Floor identifier
 * @param {number} days - Number of days to look back
 * @return {Promise<Array>} Array of historical data points
 */
async function getHistoricalData(structureId, floorId, days = 7) {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const querySnapshot = await db
      .collection('Companies')
      .doc(CONFIG.DEFAULT_COMPANY)
      .collection('Analytics')
      .doc(structureId)
      .collection(floorId)
      .where('timestamp', '>=', startDate)
      .orderBy('timestamp', 'desc')
      .get();

    const historicalData = [];
    querySnapshot.forEach((doc) => {
      historicalData.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    log(`Retrieved ${historicalData.length} historical data points for ${structureId}/${floorId}`);
    return historicalData;
  } catch (error) {
    log(`Error retrieving historical data: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Calculate trend analysis for occupancy patterns
 * @param {Array} historicalData - Array of historical data points
 * @return {Object} Trend analysis results
 */
function calculateTrends(historicalData) {
  if (historicalData.length < 2) {
    return { trend: 'insufficient_data', message: 'Need at least 2 data points for trend analysis' };
  }

  const sortedData = historicalData.sort((a, b) => a.timestamp - b.timestamp);
  const occupancies = sortedData.map((d) => d.averageOccupancy);

  // Simple linear regression
  const n = occupancies.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = occupancies.reduce((sum, val) => sum + val, 0);
  const sumXY = occupancies.reduce((sum, val, index) => sum + (index * val), 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const averageChange = slope * 24; // Change per day

  let trend;
  if (Math.abs(averageChange) < 1) {
    trend = 'stable';
  } else if (averageChange > 1) {
    trend = 'increasing';
  } else {
    trend = 'decreasing';
  }

  return {
    trend,
    averageChange: parseFloat(averageChange.toFixed(2)),
    currentAverage: occupancies[occupancies.length - 1],
    historicalAverage: parseFloat((sumY / n).toFixed(2)),
    dataPoints: n,
  };
}

// Schedule the main analysis function
cron.schedule(CONFIG.CRON_SCHEDULE, async() => {
  try {
    log('Starting scheduled occupancy analysis');

    // Analyze default structure and floor
    await getAverageFloor(CONFIG.DEFAULT_STRUCTURE, CONFIG.DEFAULT_FLOOR, CONFIG.DOCUMENT_AMOUNT);

    // Add more floors here as needed
    // await getAverageFloor('Parking Structure 1', 'Floor 1', CONFIG.DOCUMENT_AMOUNT);
    // await getAverageFloor('Parking Structure 1', 'Floor 3', CONFIG.DOCUMENT_AMOUNT);

    log('Scheduled occupancy analysis completed');
  } catch (error) {
    log(`Error in scheduled analysis: ${error.message}`, 'error');
  }
});

// Export functions for external use
module.exports = {
  getAverageFloor,
  parseDatabase,
  retrieveData,
  getHistoricalData,
  calculateTrends,
  addAggregatedData,
};
