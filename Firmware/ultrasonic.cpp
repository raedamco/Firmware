//
//  ultrasonic.cpp
//  Raedam
//
//  Created on 1/10/2019. Modified on 9/10/2020.
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
	digitalWrite(_pinTrig, HIGH);
	delayMicroseconds(_ECHO_DURATION);
	digitalWrite(_pinTrig, LOW);
  int replyTime = pulseIn(_pinEcho, HIGH);
  
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
