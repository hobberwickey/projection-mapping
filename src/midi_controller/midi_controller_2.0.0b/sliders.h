#include <MIDIUSB.h>

int sliderPins[2][4] = {
  {A0,11,12,29},
  {A1,9,10,28}
};
int sliderValues[2] = {
  0, 0
};
// 0 = idle, 1=moving
int sliderStates[2] = {
  0, 0
};

int sliderNotes[2] = {
  40, 41
};

int sliderInputNotes[2] = {
  42, 43
};

int sliderMin[2] = {
  0, 0
};

int sliderMax[2] = {
  1024, 1024
};

int sliderCounter[2] = {
  0, 0
};

int sliderAverages[2][10] = {
  {0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
  {0, 0, 0, 0, 0, 0, 0, 0, 0, 0}
};

void sliderHandler(int idx) {
  
  int sensorValue = analogRead(sliderPins[idx][0]);
  
  sliderAverages[idx][sliderCounter[idx]] = sensorValue;
  int avgSensor = 0;
  for (int cntr=0; cntr<10; cntr++) {
    avgSensor += sliderAverages[idx][cntr];
  }
  avgSensor = floor(avgSensor / 10);
  
  sliderCounter[idx] += 1;
  if (sliderCounter[idx] >= 10) {
    sliderCounter[idx] = 0;
  }

  int velValue = sensorValue;
  if (sliderStates[idx] == 0) {
    velValue = avgSensor;
  }

  int velocity = constrain(map(velValue, sliderMin[idx], sliderMax[idx], 0, 127), 0, 127);

  if (sliderStates[idx] == 0) {
    if (abs(velocity - sliderValues[idx]) > 1) {
      controlChange(0, sliderNotes[idx], velocity);
      sliderValues[idx] = velocity;
    }
  } else {
    if (velocity < sliderValues[idx]) {
      digitalWrite(sliderPins[idx][1], HIGH);
      digitalWrite(sliderPins[idx][2], LOW);
    }

    if (velocity > sliderValues[idx]) {
      digitalWrite(sliderPins[idx][1], LOW);
      digitalWrite(sliderPins[idx][2], HIGH);  
    }
  
    if (abs(velocity - sliderValues[idx]) <= 1) {
      sliderStates[idx] = 0;

      digitalWrite(sliderPins[idx][1], LOW);
      digitalWrite(sliderPins[idx][2], LOW);
      sliderValues[idx] = velocity;

      controlChange(0, sliderNotes[idx], velocity);
    }
  }
  
  int timing = 1000;
  if (sliderStates[idx] == 1) {
    timing = 100; // Read much faster when the sliders are moving
  }

  int diff = abs(velocity - sliderValues[idx]);
  int pmw = constrain(map(diff, 0, 127, 190, 255), 190, 255);

  analogWrite(sliderPins[idx][3], pmw);
  timer.in(timing, sliderHandler, idx);
}

void motorizedSliderInit() {
  for (int i=0; i<2; i++) {
    pinMode(sliderPins[i][0], INPUT);
    pinMode(sliderPins[i][1], OUTPUT);
    pinMode(sliderPins[i][2], OUTPUT);

    pinMode(sliderPins[i][3], OUTPUT);
  }

  analogWrite(sliderPins[0][3], 255);
  analogWrite(sliderPins[1][3], 255);
}

void resetSliders() {
  for (int i=0; i<2; i++) {
    digitalWrite(sliderPins[i][1], LOW);
    digitalWrite(sliderPins[i][2], LOW); 
    
    sliderMin[i] = sliderMin[i] - 10;
    sliderMax[i] = sliderMax[i] + 10;

    timer.in(1000, sliderHandler, i);
  }
}

void calibrateSliders() {
  if (millis() < 2500) {
    for (int i=0; i<2; i++) {
      digitalWrite(sliderPins[i][1], HIGH);
      digitalWrite(sliderPins[i][2], LOW); 

      int sensorValue = analogRead(sliderPins[i][0]);
      // sliderMax = 0;
      sliderMax[i] = min(sliderMax[i], sensorValue);
    }
  } else {
    for (int i=0; i<2; i++) {
      digitalWrite(sliderPins[i][1], LOW);
      digitalWrite(sliderPins[i][2], HIGH); 

      int sensorValue = analogRead(sliderPins[i][0]);
      // sliderMin = 1024;
      sliderMin[i] = max(sliderMin[i], sensorValue);
    }
  }

  if (millis() < 5000) {
    timer.in(1000, calibrateSliders);
  } 
  
  if (millis() >= 5000) {
    resetSliders();
  }
}

// 1 - VCC
// 2 - Signal
// 3 - Ground

// void loop() {
//   midiEventPacket_t rx;

//   for (int i=0; i<1; i++) {
//     sliderHandler(i);
//   }

//   do {
//     rx = MidiUSB.read();
//     if (rx.header != 0) {
//       handleMidiIn(rx.byte1, rx.byte2, rx.byte3);
//     }
//   } while (rx.header != 0);

//   delay(100);
// }
