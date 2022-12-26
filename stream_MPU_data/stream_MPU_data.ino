#include "Wire.h"
#include <MPU6050_light.h>

#include "BluetoothSerial.h"

#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error Bluetooth is not enabled! Please run `make menuconfig` to and enable it
#endif

#if !defined(CONFIG_BT_SPP_ENABLED)
#error Serial Bluetooth not available or not enabled. It is only available for the ESP32 chip.
#endif

BluetoothSerial SerialBT;

MPU6050 mpu(Wire);

long timer = 0;

float Xacc;
float Yacc;
float Zacc;

void setup() {
  Serial.begin(9600);
  SerialBT.begin("ESP32test");
  delay(1000);
  Wire.begin();
  
  byte status = mpu.begin();
  SerialBT.println(F("MPU6050 status: "));
  SerialBT.println(status);
  while(status!=0){ } // stop everything if could not connect to MPU6050
}

void loop() {
  while (millis() - timer > 30){
    mpu.update();
    Xacc =mpu.getAccX();
    Yacc = mpu.getAccY();
    Zacc = mpu.getAccZ();
    
    SerialBT.print(Xacc);
    SerialBT.print(",");
    SerialBT.print(Yacc);
    SerialBT.print(",");
    SerialBT.println(Zacc);
    
    timer = millis();
  }
  
 }
