#include <WiFi.h>
#include "AsyncUDP.h"
AsyncUDP udp;

#ifndef OFFLINE
#include <WiFiUdp.h>
#endif OFFLINE

#include "config.h"
#include "ultrasonic.h"

ultrasonic ultra = ultrasonic(PIN_TRIG,PIN_ECHO);

RTC_DATA_ATTR int bootCount = 0;

boolean NETWORK_ACTIVE = 0;
WiFiUDP socket;

long unsigned int WAKE_TIME = 0;
char incomingPacket[255];

void setup() {
  Serial.begin(115200);

  // START WIFI CONNECTION //
  #ifndef OFFLINE   //If NOT Offline Build
    Serial.printf("SSID: %s\n", WIFI_SSID);
    
    #ifdef WIFI_PASS
      WiFi.begin(WIFI_SSID, WIFI_PASS);
    #else
      WiFi.begin(WIFI_SSID);
    #endif
 
    socket.begin(SERVER_PORT);
   
  #endif
  // END WIFI CONNECTION //
  
  recievePackets();
}

void loop() {
  // START DATA SEND //
  if (WiFi.status() == WL_CONNECTED) {
      #ifndef OFFLINE   //If NOT Offline Build      
      sendPacket(ULTRASONIC_CID, ultra.get());
      
      ++bootCount;
      
      delay(TIME_TO_DELAY_SLEEP); 
      #ifdef DEBUG
        Serial.println("Boot number: " + String(bootCount));
        Serial.println("Going to sleep now");
      #endif
      esp_sleep_enable_timer_wakeup(TIME_TO_SLEEP * uS_TO_S_FACTOR); //Set unit wakeup time
      esp_deep_sleep_start();    
    }else{
      Serial.flush(); 
    }
    #endif
   //END DATA SEND //
}

#ifndef OFFLINE

void sendPacket(uint8_t sensor_cid, unsigned long r) {
  
  uint8_t protocol = 1;                   // 1 uint8_t
  unsigned long uid = UNIQUE_ID;          // 4 uint8_t
  uint8_t sensor = sensor_cid;            // 1 uint8_t
  unsigned long result = r;               // 4 uint8_t

  const unsigned long buffer_length = 1+4+1+4;
  
  uint8_t buff[buffer_length] = { 0 };
  {
    int i=0;
    memcpy(&buff[i], &uid, sizeof(uid));
    i+=sizeof(uid);
    memcpy(&buff[i], &sensor, sizeof(sensor));
    i+=sizeof(sensor);
    memcpy(&buff[i], &result, sizeof(result));
    i+=sizeof(result);
  }

#ifdef DEBUG
  Serial.printf("Sent: UID=%lu, S_CID=%u, RESULT=%u\n     ", uid, sensor_cid, r);
  for (int i=0; i<buffer_length; i++) {
    Serial.printf(" %02x",buff[i]);
  }
  Serial.printf("\n");
#endif

  socket.beginPacket(SERVER_IP, SERVER_PORT);
  socket.write(buff, buffer_length);
  socket.endPacket();
}
#endif

void recievePackets(){
  if (udp.listen(HOST_PORT)) {
    udp.onPacket([](AsyncUDPPacket packet) {
      
      #ifdef DEBUG
        Serial.print(" Recieved Data From: ");
        Serial.print(packet.remoteIP());
        Serial.print(":");
        Serial.print(packet.remotePort());
        Serial.print(", Data Content: ");
        Serial.write(packet.data(), packet.length());
        Serial.println();
      #endif
      
      String UDPstring = (const char*)packet.data();
      if (UDPstring == "SEND"){
        sendPacket(ULTRASONIC_CID, ultra.get());
        packet.printf("SUCCESS: DATA SENT FOR SENSOR: %lu", UNIQUE_ID);
      }else if (UDPstring == "COUNT"){
        packet.printf("SUCCESS: SENSOR: %lu, BOOTCOUNT IS: %lu", UNIQUE_ID, bootCount);
      }else{
        packet.printf("ERROR: SENSOR: %lu, [REQUEST FOLLOWING: SEND OR COUNT]", UNIQUE_ID);
      }
    });
  }
}


/******Documentation*****
  WiFi                https://www.arduino.cc/en/Reference/WiFi
  WiFi.begion()       https://www.arduino.cc/en/Reference/WiFiBegin
  WiFi.status()       https://www.arduino.cc/en/Reference/WiFiStatus
*/
