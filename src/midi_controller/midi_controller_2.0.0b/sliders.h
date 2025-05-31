#include <MIDIUSB.h>


// #include <FastLED.h>
// #define NUM_LEDS 120
// #define DATA_PIN A11
// CRGB leds[NUM_LEDS];

int sliderPins[2][3] = {
  {A0,11,12},
  {A1,9,10}
};
int sliderValues[2] = {
  0, 0
};
// 0 = idle, 1=moving
int sliderStates[2] = {
  0, 0
};

int sliderActive[2] = {
  0, 0
};

int sliderNotes[2] = {
  40, 41
};

int sliderInputNotes[2] = {
  42, 43
};

int sliderMin = 0;
int sliderMax = 1024;

unsigned long sliderTimer;

// void setup() {
//   for (int i=0; i<1; i++) {
//     pinMode(sliderPins[i][0], INPUT);
//     pinMode(sliderPins[i][1], OUTPUT);
//     pinMode(sliderPins[i][2], OUTPUT);
//   }
// }

// void handleMidiIn(int header, int note, int velocity) {
//   for (int i=0; i<1; i++) {
//     if (note == sliderInputNotes[i]) {
//       sliderValues[i] = velocity;
//       sliderStates[i] = 1;
//     }
//   }
// }

// void noteOn(byte channel, byte pitch, byte velocity) {
//   midiEventPacket_t noteOn = {0x09, 0x90 | channel, pitch, velocity};
//   MidiUSB.sendMIDI(noteOn);
// }

// void noteOff(byte channel, byte pitch, byte velocity) {
//   midiEventPacket_t noteOff = {0x08, 0x80 | channel, pitch, velocity};
//   MidiUSB.sendMIDI(noteOff);
// }

// void controlChange(byte channel, byte control, byte value) {
//   midiEventPacket_t event = {0x0B, 0xB0 | channel, control, value};
//   MidiUSB.sendMIDI(event);
// }

void sliderHandler(int idx) {
  int sensorValue = analogRead(sliderPins[idx][0]);
  int velocity = constrain(map(sensorValue, sliderMin, sliderMax, 0, 127), 0, 127);

  if (sliderStates[idx] == 0) {
    if (abs(velocity - sliderValues[idx]) > 1) {
      controlChange(0, sliderNotes[idx], velocity);
      sliderValues[idx] = velocity;
    }
  } else {
    if (sliderActive[idx] == 1) {
      digitalWrite(sliderPins[idx][1], LOW);
      digitalWrite(sliderPins[idx][2], LOW);
      sliderActive[idx] = 0;
    } else {
      sliderActive[idx] = 1;
      
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
        sliderActive[idx] = 0;

        digitalWrite(sliderPins[idx][1], LOW);
        digitalWrite(sliderPins[idx][2], LOW);
        sliderValues[idx] = velocity;

        controlChange(0, sliderNotes[idx], velocity);
      }
    }
  }
}

// void _sliderHandler(int idx) {
//   // return;
  
//   int sensorValue = analogRead(sliderPins[idx][0]);
  
//   int max = 15;
//   int min = 989;
//   int velocity = constrain(map(sensorValue, min, max, 0, 127), 0, 127);

//   if (sliderStates[idx] == 0) {
//     if (abs(velocity - sliderValues[idx]) > 1) {
//       controlChange(0, sliderNotes[idx], velocity);
//       MidiUSB.flush();

//       sliderValues[idx] = velocity;
//     }
//   } else {
//     while (velocity < sliderValues[idx]) {
//       digitalWrite(sliderPins[idx][1], LOW);
//       digitalWrite(sliderPins[idx][2], LOW);
//       delayMicroseconds(1000);
      
//       sensorValue = analogRead(sliderPins[idx][0]);
//       velocity = constrain(map(sensorValue, min, max, 0, 127), 0, 127);

//       if (velocity < sliderValues[idx]) {
//         digitalWrite(sliderPins[idx][1], HIGH);
//         digitalWrite(sliderPins[idx][2], LOW);
//         delayMicroseconds(1000);
//       }
//     }

//     while (velocity > sliderValues[idx]) {
//       digitalWrite(sliderPins[idx][1], LOW);
//       digitalWrite(sliderPins[idx][2], LOW);
//       delayMicroseconds(1000);

//       sensorValue = analogRead(sliderPins[idx][0]);
//       velocity = constrain(map(sensorValue, min, max, 0, 127), 0, 127);

//       if (velocity > sliderValues[idx]) {
//         digitalWrite(sliderPins[idx][1], LOW);
//         digitalWrite(sliderPins[idx][2], HIGH);  
//         delayMicroseconds(1000);
//       }
//     }

//     sliderStates[idx] = 0;
//     digitalWrite(sliderPins[idx][1], LOW);
//     digitalWrite(sliderPins[idx][2], LOW);
//     sliderValues[idx] = velocity;

//     controlChange(0, sliderNotes[idx], velocity);
//     MidiUSB.flush();
//     // }
//   }
// }

void motorizedSliderInit() {
  for (int i=0; i<2; i++) {
    pinMode(sliderPins[i][0], INPUT);
    pinMode(sliderPins[i][1], OUTPUT);
    pinMode(sliderPins[i][2], OUTPUT);
  }
}

void calibrateSliders() {
  if (millis() < 2500) {
    for (int i=0; i<2; i++) {
      digitalWrite(sliderPins[i][1], HIGH);
      digitalWrite(sliderPins[i][2], LOW); 

      int sensorValue = analogRead(sliderPins[i][0]);
      // sliderMax = 0;
      sliderMax = min(sliderMax, sensorValue);
    }
  } else {
    for (int i=0; i<2; i++) {
      digitalWrite(sliderPins[i][1], LOW);
      digitalWrite(sliderPins[i][2], HIGH); 

      int sensorValue = analogRead(sliderPins[i][0]);
      // sliderMin = 1024;
      sliderMin = max(sliderMin, sensorValue);
    }
  }
}

void resetSliders() {
  for (int i=0; i<2; i++) {
    digitalWrite(sliderPins[i][1], LOW);
    digitalWrite(sliderPins[i][2], LOW); 
  }

  sliderMin = sliderMin - 5;
  sliderMax = sliderMax + 5;
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
