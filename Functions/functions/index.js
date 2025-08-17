/**
 * Cloud Functions for Firebase - Parking Sensor Data Processing
 *
 * This module handles real-time data processing for parking sensor systems,
 * including battery level notifications and occupancy tracking.
 *
 * @author Raedam Team
 * @version 2.0.0
 * @since 2020
 */

const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");

// Initialize Firebase Admin SDK
initializeApp();

// Firestore instance available for future use
// const db = getFirestore();

/**
 * Battery level notification function
 * Triggers when parking sensor data is updated and logs battery levels
 *
 * @param {Object} event - Firestore document update event
 * @param {Object} context - Function execution context
 * @returns {Promise<null>} - Returns null as this is a logging function
 */
exports.batteryLevelNotify = onDocumentUpdated(
  "Companies/{companyName}/Data/{structure}",
  async (event) => {
    try {
      const { companyName, structure } = event.params;
      const afterData = event.data?.after?.data();

      if (!afterData || !afterData["Main Units"]) {
        logger.warn(`No main units data found for structure: ${structure}`);
        return null;
      }

      const mainUnits = afterData["Main Units"];

      // Log battery levels for all units
      Object.entries(mainUnits).forEach(([unitId, unitData]) => {
        if (unitData["Battery Level"] !== undefined) {
          logger.info(`Battery Level for ${companyName}/${structure}/${unitId}: ${unitData["Battery Level"]}%`);
        }
      });

      // Check for low battery warnings (below 20%)
      Object.entries(mainUnits).forEach(([unitId, unitData]) => {
        const batteryLevel = unitData["Battery Level"];
        if (batteryLevel !== undefined && batteryLevel < 20) {
          logger.warn(`LOW BATTERY WARNING: ${companyName}/${structure}/${unitId} at ${batteryLevel}%`);
        }
      });

      return null;
    } catch (error) {
      logger.error("Error in batteryLevelNotify function:", error);
      throw error;
    }
  },
);

/**
 * Occupancy change notification function
 * Triggers when parking spot occupancy status changes
 *
 * @param {Object} event - Firestore document update event
 * @param {Object} context - Function execution context
 * @returns {Promise<null>} - Returns null as this is a logging function
 */
exports.occupancyChangeNotify = onDocumentUpdated(
  "Companies/{companyName}/Data/{structure}/{floor}/{spotId}/Data/{dataId}",
  async (event) => {
    try {
      const { companyName, structure, floor, spotId } = event.params;
      const afterData = event.data?.after?.data();

      if (!afterData) {
        return null;
      }

      const afterOccupied = afterData.Occupied;
      const status = afterOccupied ? "OCCUPIED" : "VACANT";

      logger.info(`Parking spot status: ${companyName}/${structure}/${floor}/${spotId} is ${status}`);

      // Log additional context if available
      if (afterData.Time?.End) {
        logger.info(`Status timestamp: ${afterData.Time.End}`);
      }

      return null;
    } catch (error) {
      logger.error("Error in occupancyChangeNotify function:", error);
      throw error;
    }
  },
);
