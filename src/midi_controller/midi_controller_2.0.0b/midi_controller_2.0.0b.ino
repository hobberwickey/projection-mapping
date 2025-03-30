#include <MIDIUSB.h>

// #include <FastLED.h>
// #define NUM_LEDS 120
// #define DATA_PIN A11
// CRGB leds[NUM_LEDS];

int sliderPins[1][3] = {
  {A7,22,23},
};
int sliderValues[2] = {
  127, 0
};
// 0 = idle, 1=moving
int sliderStates[2] = {
  1, 1
};
int sliderNotes[2] = {
  40, 41
};

int sliderInputNotes[2] = {
  42, 43
};

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

void motorizedSliderInit() {
  for (int i=0; i<1; i++) {
    pinMode(sliderPins[i][0], INPUT);
    pinMode(sliderPins[i][1], OUTPUT);
    pinMode(sliderPins[i][2], OUTPUT);
  }
}

void sliderHandler(int idx) {
  int sensorValue = analogRead(sliderPins[idx][0]);
  
  int min = 15;
  int max = 1010;
  int velocity = map(sensorValue, min, max, 0, 127);

  if (sliderStates[idx] == 0) {
    if (velocity - sliderValues[idx] < 1) {
      controlChange(0, 40, velocity);
      MidiUSB.flush();

      sliderValues[idx] = velocity;
    }
  } else {
    while (velocity < sliderValues[idx]) {
      sensorValue = analogRead(sliderPins[idx][0]);
      velocity = map(sensorValue, min, max, 0, 127);

      digitalWrite(sliderPins[idx][1], LOW);
      digitalWrite(sliderPins[idx][2], LOW);
      
      delayMicroseconds(1000);
      
      digitalWrite(sliderPins[idx][1], LOW);
      digitalWrite(sliderPins[idx][2], HIGH);

      delayMicroseconds(1000);
    }

    while (velocity > sliderValues[idx]) {
      sensorValue = analogRead(sliderPins[idx][0]);
      velocity = map(sensorValue, min, max, 0, 127);

      digitalWrite(sliderPins[idx][1], LOW);
      digitalWrite(sliderPins[idx][2], LOW);

      delayMicroseconds(1000);
      
      digitalWrite(sliderPins[idx][1], HIGH);
      digitalWrite(sliderPins[idx][2], LOW);

      delayMicroseconds(1000);
    }

    if (velocity - sliderValues[idx] < 1) {
      digitalWrite(sliderPins[idx][1], LOW);
      digitalWrite(sliderPins[idx][2], LOW);
      sliderStates[idx] = 0;

      controlChange(0, 40, velocity);
      MidiUSB.flush();
    }
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
