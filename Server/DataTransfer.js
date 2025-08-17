/**
 * Data Transfer Utility for Firestore Database Operations
 *
 * This module provides utilities for transferring data between different locations
 * in the Firestore database, including copying documents and collections with
 * their sub-documents and sub-collections.
 *
 * @author Raedam Team
 * @version 2.0.0
 * @since 2020
 */

const cron = require('node-cron');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const DataHolder = require('./dataHolder.js');

// Configuration
const CONFIG = {
  DEBUG: true,
  BATCH_SIZE: 500, // Firestore batch write limit
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
 * Main function to move data in Firestore database
 * @param {string} dest - Destination path in database
 * @param {string} src - Source path to copy from
 */
async function moveData(dest, src) {
  try {
    log(`Starting data transfer from ${src} to ${dest}`);

    // Validate input parameters
    if (!dest || !src) {
      throw new Error('Destination and source paths are required');
    }

    // Check that dest and src match document type (doc or collection)
    const root = await grabData(src);
    if (!root) {
      throw new Error('Failed to retrieve source data');
    }

    await copyData(root, dest);
    log(`Data transfer completed successfully from ${src} to ${dest}`);
  } catch (error) {
    log(`Error in moveData: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Retrieve data from source location including all sub-documents and sub-collections
 * @param {string[]} src - Source path array
 * @return {Promise<DataHolder>} Root data holder object
 */
async function grabData(src) {
  try {
    log(`Grabbing data from: ${src.join('/')}`);

    if (!src || src.length === 0) {
      throw new Error('No source path provided for grabData function');
    }

    // Determine if src is a document or collection
    const isDocument = src.length % 2 === 0;
    const isCollection = src.length % 2 === 1;

    if (!isDocument && !isCollection) {
      throw new Error('Invalid source path structure');
    }

    // Build the data path
    const dataPath = buildDataPath(src);

    if (isDocument) {
      const docInfo = await getDocumentData(dataPath);
      const root = new DataHolder(src[src.length - 1], docInfo.data);

      // Process sub-collections recursively
      const subCollections = await docInfo.subCollections;
      for (const subCollection of subCollections) {
        const subPath = [...src, subCollection];
        const subData = await grabData(subPath);
        root.subDoc.push(subData);
      }

      return root;
    } else {
      // Handle collection
      const collectionInfo = await getCollectionData(dataPath);
      const root = new DataHolder(src[src.length - 1], collectionInfo.data);

      // Process sub-documents recursively
      for (const subDoc of collectionInfo.subDocuments) {
        const subPath = [...src, subDoc];
        const subData = await grabData(subPath);
        root.subDoc.push(subData);
      }

      return root;
    }
  } catch (error) {
    log(`Error in grabData: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Build Firestore data path from path array
 * @param {string[]} pathArray - Array of path segments
 * @return {Object} Firestore reference
 */
function buildDataPath(pathArray) {
  let dataPath;

  for (let i = 0; i < pathArray.length; i++) {
    if (i === 0) {
      dataPath = db.collection(pathArray[i]);
    } else if (i % 2 === 0) {
      dataPath = dataPath.collection(pathArray[i]);
    } else {
      dataPath = dataPath.doc(pathArray[i]);
    }
  }

  return dataPath;
}

/**
 * Get document data and sub-collections
 * @param {Object} docRef - Firestore document reference
 * @return {Promise<Object>} Document data and sub-collections
 */
async function getDocumentData(docRef) {
  try {
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error('Document does not exist');
    }

    const subCollections = await docRef.listCollections();
    return {
      data: doc.data(),
      subCollections: subCollections.map((col) => col.id),
    };
  } catch (error) {
    log(`Error getting document data: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Get collection data and sub-documents
 * @param {Object} colRef - Firestore collection reference
 * @return {Promise<Object>} Collection data and sub-documents
 */
async function getCollectionData(colRef) {
  try {
    const snapshot = await colRef.get();
    const subDocuments = snapshot.docs.map((doc) => doc.id);

    return {
      data: { size: snapshot.size, empty: snapshot.empty },
      subDocuments,
    };
  } catch (error) {
    log(`Error getting collection data: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Copy data to destination location
 * @param {DataHolder} root - Root data holder object
 * @param {string[]} dest - Destination path array
 */
async function copyData(root, dest) {
  try {
    log(`Copying data to destination: ${dest.join('/')}`);

    if (!root || !dest || dest.length === 0) {
      throw new Error('Invalid parameters for copyData');
    }

    // Build destination path
    const destPath = buildDataPath(dest);

    // Copy root data
    if (root.data && typeof root.data === 'object') {
      if (dest.length % 2 === 0) {
        // Destination is a document
        await destPath.set(root.data);
      } else {
        // Destination is a collection - create a new document
        await destPath.add(root.data);
      }
    }

    // Copy sub-documents recursively
    for (const subDoc of root.subDoc) {
      const subDestPath = [...dest, subDoc.id];
      await copyData(subDoc, subDestPath);
    }

    log(`Data copied successfully to ${dest.join('/')}`);
  } catch (error) {
    log(`Error in copyData: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Batch copy data for better performance with large datasets
 * @param {DataHolder} root - Root data holder object
 * @param {string[]} dest - Destination path array
 */
async function batchCopyData(root, dest) {
  try {
    log(`Starting batch copy to destination: ${dest.join('/')}`);

    let batch = db.batch();
    let operationCount = 0;

    const processBatch = async(dataHolder, path) => {
      if (operationCount >= CONFIG.BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        operationCount = 0;
      }

      // Add operations to batch
      const destPath = buildDataPath(path);
      if (path.length % 2 === 0) {
        batch.set(destPath, dataHolder.data);
      } else {
        batch.add(destPath, dataHolder.data);
      }
      operationCount++;

      // Process sub-documents
      for (const subDoc of dataHolder.subDoc) {
        const subPath = [...path, subDoc.id];
        await processBatch(subDoc, subPath);
      }
    };

    await processBatch(root, dest);

    // Commit any remaining operations
    if (operationCount > 0) {
      await batch.commit();
    }

    log(`Batch copy completed successfully to ${dest.join('/')}`);
  } catch (error) {
    log(`Error in batchCopyData: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Validate data integrity after transfer
 * @param {string[]} src - Source path
 * @param {string[]} dest - Destination path
 * @return {Promise<boolean>} True if validation passes
 */
async function validateTransfer(src, dest) {
  try {
    log(`Validating transfer from ${src.join('/')} to ${dest.join('/')}`);

    const srcData = await grabData(src);
    const destData = await grabData(dest);

    // Basic validation - check if data exists
    if (!srcData || !destData) {
      log('Validation failed: Missing source or destination data', 'error');
      return false;
    }

    // Compare data structures
    const srcKeys = Object.keys(srcData.data || {});
    const destKeys = Object.keys(destData.data || {});

    if (srcKeys.length !== destKeys.length) {
      log('Validation failed: Data structure mismatch', 'error');
      return false;
    }

    log('Transfer validation completed successfully');
    return true;
  } catch (error) {
    log(`Error in validation: ${error.message}`, 'error');
    return false;
  }
}

// Export functions
module.exports = {
  moveData,
  grabData,
  copyData,
  batchCopyData,
  validateTransfer,
};
