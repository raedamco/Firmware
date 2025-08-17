/**
 * Ultrasonic Sensor Class Header for ESP32 Parking Sensor
 * 
 * This class provides an interface for HC-SR04 ultrasonic distance sensors,
 * including distance measurement, occupancy detection, and data validation.
 * 
 * @author Raedam Team
 * @version 2.0.0
 * @since 2019
 */

#ifndef ULTRASONIC_H
#define ULTRASONIC_H

#include <Arduino.h>

// ============================================================================
// Ultrasonic Sensor Constants
// ============================================================================
#define ULTRASONIC_CID               1
#define ECHO_DURATION_MICROSECONDS   10
#define SOUND_SPEED_CM_PER_MICROSEC  0.0343  // Speed of sound in cm/μs
#define SOUND_SPEED_IN_PER_MICROSEC  0.0135  // Speed of sound in inches/μs
#define DEFAULT_OCCUPIED_DISTANCE_CM 100
#define MIN_VALID_DISTANCE_CM        2
#define MAX_VALID_DISTANCE_CM        400
#define TIMEOUT_MICROSECONDS         30000    // 30ms timeout

/**
 * Ultrasonic sensor class for distance measurement and occupancy detection
 */
class Ultrasonic {
public:
  /**
   * Constructor for ultrasonic sensor
   * @param trigPin - Trigger pin number
   * @param echoPin - Echo pin number
   * @param occupiedDistanceCm - Distance threshold for occupancy detection (default: 100cm)
   */
  Ultrasonic(uint8_t trigPin, uint8_t echoPin, uint16_t occupiedDistanceCm = DEFAULT_OCCUPIED_DISTANCE_CM);
  
  /**
   * Destructor
   */
  ~Ultrasonic() = default;
  
  /**
   * Initialize the sensor pins and settings
   */
  void begin();
  
  /**
   * Get raw echo time in microseconds
   * @return Echo time in microseconds, or 0 if timeout/error
   */
  uint32_t getEchoTime();
  
  /**
   * Get distance in centimeters
   * @return Distance in centimeters, or -1 if error
   */
  float getDistanceCm();
  
  /**
   * Get distance in inches
   * @return Distance in inches, or -1 if error
   */
  float getDistanceInches();
  
  /**
   * Get distance in millimeters
   * @return Distance in millimeters, or -1 if error
   */
  float getDistanceMm();
  
  /**
   * Check if parking spot is occupied based on distance
   * @return true if occupied, false if vacant
   */
  bool isOccupied();
  
  /**
   * Check if the last measurement was valid
   * @return true if valid, false if error or timeout
   */
  bool isValidMeasurement();
  
  /**
   * Get the last measured distance in centimeters
   * @return Last valid distance in centimeters
   */
  float getLastDistanceCm() const;
  
  /**
   * Get the last measured distance in inches
   * @return Last valid distance in inches
   */
  float getLastDistanceInches() const;
  
  /**
   * Set the occupancy distance threshold
   * @param distanceCm - New threshold in centimeters
   */
  void setOccupiedDistance(uint16_t distanceCm);
  
  /**
   * Get the current occupancy distance threshold
   * @return Current threshold in centimeters
   */
  uint16_t getOccupiedDistance() const;
  
  /**
   * Perform a complete measurement cycle
   * @return true if successful, false if error
   */
  bool measure();
  
  /**
   * Get sensor status information
   * @return String containing sensor status
   */
  String getStatus();

private:
  uint8_t _pinTrig;                    // Trigger pin
  uint8_t _pinEcho;                    // Echo pin
  uint16_t _occupiedDistanceCm;        // Occupancy threshold in cm
  float _lastDistanceCm;               // Last measured distance in cm
  bool _lastMeasurementValid;          // Validity of last measurement
  uint32_t _lastEchoTime;             // Last echo time in microseconds
  uint32_t _measurementCount;         // Total number of measurements
  uint32_t _errorCount;               // Total number of errors
  
  /**
   * Initialize hardware pins
   */
  void _initPins();
  
  /**
   * Validate distance measurement
   * @param distanceCm - Distance to validate
   * @return true if valid, false if out of range
   */
  bool _isValidDistance(float distanceCm);
  
  /**
   * Convert echo time to distance
   * @param echoTime - Echo time in microseconds
   * @return Distance in centimeters
   */
  float _echoTimeToDistance(uint32_t echoTime);
};

#endif // ULTRASONIC_H
