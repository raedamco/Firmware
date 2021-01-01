//
//  ultrasonic.h
//  Raedam
//
//  Created on 1/10/2019. Modified on 9/19/2020.
//  Copyright © 2020 Raedam Inc. All rights reserved.
//

#ifndef ULTRASONIC_H
#define ULTRASONIC_H

#define ULTRASONIC_CID 1

class ultrasonic {
  
public:
  ultrasonic(int trig, int echo);
  int get();
  float getCM();
  float getIN();
  bool isOccupied();
  
private:
  void init();
  const int _ECHO_DURATION = 10;
  const float _ECHO_TO_CM = 58.2;
  const float _ECHO_TO_IN = 144;
  const int _IS_OCCUPIED_DISTANCE_CM = 100;

  int _pinTrig;
  int _pinEcho;
};

#endif
