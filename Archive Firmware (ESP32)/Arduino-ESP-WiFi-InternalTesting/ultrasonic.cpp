//
//  ultrasonic.cpp
//  Raedam
//
//  Created on 1/10/2019. Modified on 9/19/2020.
//  Copyright © 2020 Raedam Inc. All rights reserved.
//

#include <Arduino.h>
#include "ultrasonic.h"
#include "config.h"

ultrasonic::ultrasonic(int trig, int echo) {
  _pinTrig = trig;
  _pinEcho = echo;

  init();
}

void ultrasonic::init() {
  pinMode(_pinTrig, OUTPUT);
  pinMode(_pinEcho, INPUT);
  digitalWrite(_pinTrig, LOW);
}

int ultrasonic::get() {
#ifdef DEBUGGING
  Serial.printf("Ultrasonic on {%d} reads ", _pinTrig);
#endif

  digitalWrite(_pinTrig, HIGH);
  delayMicroseconds(_ECHO_DURATION);
  digitalWrite(_pinTrig, LOW);
  int replyTime = pulseIn(_pinEcho, HIGH);
  
#ifdef DEBUGGING
  Serial.printf("%d microseconds, %.2fcm, %.2fin\n", replyTime, replyTime/_ECHO_TO_CM, replyTime/_ECHO_TO_IN);
#endif

  return replyTime;
}

float ultrasonic::getCM() {
  return(get() / _ECHO_TO_CM);
}

float ultrasonic::getIN() {
  return(get() / _ECHO_TO_IN);
}

bool ultrasonic::isOccupied() {
  return(getCM()<_IS_OCCUPIED_DISTANCE_CM);
}
