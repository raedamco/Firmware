/**
 * Ultrasonic Sensor Class Implementation for ESP32 Parking Sensor
 * 
 * This file implements the Ultrasonic class for HC-SR04 distance sensors,
 * providing robust distance measurement and occupancy detection.
 * 
 * @author Raedam Team
 * @version 2.0.0
 * @since 2019
 */

#include "ultrasonic.h"
#include "config.h"

// ============================================================================
// Constructor and Initialization
// ============================================================================

Ultrasonic::Ultrasonic(uint8_t trigPin, uint8_t echoPin, uint16_t occupiedDistanceCm)
  : _pinTrig(trigPin)
  , _pinEcho(echoPin)
  , _occupiedDistanceCm(occupiedDistanceCm)
  , _lastDistanceCm(0.0f)
  , _lastMeasurementValid(false)
  , _lastEchoTime(0)
  , _measurementCount(0)
  , _errorCount(0) {
}

void Ultrasonic::begin() {
  _initPins();
  
  #ifdef DEBUGGING
    Serial.printf("[Ultrasonic] Initialized with pins: Trig=%d, Echo=%d\n", _pinTrig, _pinEcho);
    Serial.printf("[Ultrasonic] Occupancy threshold: %d cm\n", _occupiedDistanceCm);
  #endif
}

void Ultrasonic::_initPins() {
  pinMode(_pinTrig, OUTPUT);
  pinMode(_pinEcho, INPUT);
  digitalWrite(_pinTrig, LOW);
  
  // Ensure trigger is low initially
  delayMicroseconds(2);
}

// ============================================================================
// Distance Measurement Methods
// ============================================================================

bool Ultrasonic::measure() {
  // Clear trigger pin
  digitalWrite(_pinTrig, LOW);
  delayMicroseconds(2);
  
  // Send trigger pulse
  digitalWrite(_pinTrig, HIGH);
  delayMicroseconds(ECHO_DURATION_MICROSECONDS);
  digitalWrite(_pinTrig, LOW);
  
  // Measure echo time
  _lastEchoTime = pulseIn(_pinEcho, HIGH, TIMEOUT_MICROSECONDS);
  
  if (_lastEchoTime == 0) {
    // Timeout or error
    _lastMeasurementValid = false;
    _errorCount++;
    
    #ifdef DEBUGGING
      Serial.println("[Ultrasonic] Measurement timeout or error");
    #endif
    
    return false;
  }
  
  // Calculate distance
  _lastDistanceCm = _echoTimeToDistance(_lastEchoTime);
  _lastMeasurementValid = _isValidDistance(_lastDistanceCm);
  _measurementCount++;
  
  if (!_lastMeasurementValid) {
    _errorCount++;
  }
  
  #ifdef DEBUGGING
    Serial.printf("[Ultrasonic] Echo: %lu μs, Distance: %.2f cm, Valid: %s\n", 
                  _lastEchoTime, _lastDistanceCm, _lastMeasurementValid ? "Yes" : "No");
  #endif
  
  return _lastMeasurementValid;
}

uint32_t Ultrasonic::getEchoTime() {
  if (!_lastMeasurementValid) {
    measure();
  }
  return _lastEchoTime;
}

float Ultrasonic::getDistanceCm() {
  if (!_lastMeasurementValid) {
    measure();
  }
  return _lastMeasurementValid ? _lastDistanceCm : -1.0f;
}

float Ultrasonic::getDistanceInches() {
  float distanceCm = getDistanceCm();
  return distanceCm > 0 ? distanceCm * 0.393701f : -1.0f;
}

float Ultrasonic::getDistanceMm() {
  float distanceCm = getDistanceCm();
  return distanceCm > 0 ? distanceCm * 10.0f : -1.0f;
}

// ============================================================================
// Occupancy Detection
// ============================================================================

bool Ultrasonic::isOccupied() {
  float distance = getDistanceCm();
  if (distance < 0) {
    return false; // Invalid measurement, assume not occupied
  }
  return distance < _occupiedDistanceCm;
}

// ============================================================================
// Utility Methods
// ============================================================================

bool Ultrasonic::isValidMeasurement() const {
  return _lastMeasurementValid;
}

float Ultrasonic::getLastDistanceCm() const {
  return _lastDistanceCm;
}

float Ultrasonic::getLastDistanceInches() const {
  return _lastDistanceCm * 0.393701f;
}

void Ultrasonic::setOccupiedDistance(uint16_t distanceCm) {
  if (distanceCm >= MIN_VALID_DISTANCE_CM && distanceCm <= MAX_VALID_DISTANCE_CM) {
    _occupiedDistanceCm = distanceCm;
    
    #ifdef DEBUGGING
      Serial.printf("[Ultrasonic] Occupancy threshold updated to: %d cm\n", _occupiedDistanceCm);
    #endif
  } else {
    #ifdef DEBUGGING
      Serial.printf("[Ultrasonic] Invalid occupancy distance: %d cm (valid range: %d-%d)\n", 
                    distanceCm, MIN_VALID_DISTANCE_CM, MAX_VALID_DISTANCE_CM);
    #endif
  }
}

uint16_t Ultrasonic::getOccupiedDistance() const {
  return _occupiedDistanceCm;
}

String Ultrasonic::getStatus() {
  String status = "Ultrasonic Sensor Status:\n";
  status += "  Pins: Trig=" + String(_pinTrig) + ", Echo=" + String(_pinEcho) + "\n";
  status += "  Occupancy Threshold: " + String(_occupiedDistanceCm) + " cm\n";
  status += "  Last Distance: " + String(_lastDistanceCm, 2) + " cm\n";
  status += "  Last Echo Time: " + String(_lastEchoTime) + " μs\n";
  status += "  Measurement Valid: " + String(_lastMeasurementValid ? "Yes" : "No") + "\n";
  status += "  Total Measurements: " + String(_measurementCount) + "\n";
  status += "  Error Count: " + String(_errorCount) + "\n";
  status += "  Success Rate: " + String(_measurementCount > 0 ? 
              (100.0f * (_measurementCount - _errorCount) / _measurementCount) : 0.0f, 1) + "%";
  
  return status;
}

// ============================================================================
// Private Helper Methods
// ============================================================================

bool Ultrasonic::_isValidDistance(float distanceCm) {
  return distanceCm >= MIN_VALID_DISTANCE_CM && distanceCm <= MAX_VALID_DISTANCE_CM;
}

float Ultrasonic::_echoTimeToDistance(uint32_t echoTime) {
  // Distance = (Echo Time × Speed of Sound) / 2
  // Speed of sound = 343 m/s = 0.0343 cm/μs
  return (echoTime * SOUND_SPEED_CM_PER_MICROSEC) / 2.0f;
}
