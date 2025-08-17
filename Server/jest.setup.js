/**
 * Jest setup file for Server tests
 * This file runs before each test file
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DEBUG_MODE = 'false';

// Mock Firebase Admin SDK for tests
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  cert: jest.fn(),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            collection: jest.fn(() => ({
              get: jest.fn(),
              add: jest.fn(),
              update: jest.fn(),
              set: jest.fn(),
              orderBy: jest.fn(() => ({
                limit: jest.fn(() => ({
                  get: jest.fn(),
                })),
              })),
              where: jest.fn(() => ({
                orderBy: jest.fn(() => ({
                  get: jest.fn(),
                })),
              })),
            })),
            get: jest.fn(),
            update: jest.fn(),
            set: jest.fn(),
            listCollections: jest.fn(),
          })),
        })),
      })),
    })),
    settings: jest.fn(),
    batch: jest.fn(() => ({
      set: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      commit: jest.fn(),
    })),
  })),
}));

// Mock UDP module
jest.mock('dgram', () => ({
  createSocket: jest.fn(() => ({
    on: jest.fn(),
    bind: jest.fn(),
    close: jest.fn(),
  })),
}));

// Mock Slack notifications
jest.mock('slack-notify', () => jest.fn(() => ({
  alert: jest.fn(),
  send: jest.fn(),
})));

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

// Global test utilities
global.testUtils = {
  // Create mock sensor data
  createMockSensorData: (overrides = {}) => ({
    Company: 'Test Company',
    Location: 'Test Location',
    Floor: 'Test Floor',
    SpotID: 'Test Spot',
    ...overrides,
  }),

  // Create mock UDP message
  createMockUDPMessage: (uniqueId = 1, distance = 100) => {
    const buffer = Buffer.alloc(8);
    buffer.writeUIntLE(uniqueId, 0, 1);
    buffer.writeUIntLE(distance, 1, 2);
    return buffer;
  },

  // Create mock timestamp
  createMockTimestamp: () => new Date('2024-01-01T12:00:00Z'),

  // Wait for async operations
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Mock console methods
  mockConsole: () => {
    const originalConsole = { ...console };
    const mockConsole = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };

    Object.keys(mockConsole).forEach((key) => {
      console[key] = mockConsole[key];
    });

    return {
      mockConsole,
      restore: () => {
        Object.keys(originalConsole).forEach((key) => {
          console[key] = originalConsole[key];
        });
      },
    };
  },
};

// Suppress console output during tests unless explicitly enabled
if (process.env.LOG_LEVEL !== 'verbose') {
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();

  // Restore console methods after tests
  afterAll(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });
}
