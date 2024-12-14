#include <FastLED.h>
#include <MIDIUSB.h>

#define NUM_LEDS 72
#define DATA_PIN A1

CRGB leds[NUM_LEDS];

unsigned long sliderTimer;
unsigned long knobTimer;

// Toggles
int togglePins[6] = {
  1, 0, 2, 3, 4, 5
};

int prevToggleStates[6] = {
  0, 0, 0, 0, 0, 0
};

int toggleNotes[6] = {
  48, 49, 50, 51, 52, 53
};

// Switch Pins
int switchPins[2] = {
  A0, A1
};

int switchValues[2] = {
  0, 0
};

int switchNotes[2][6] = {
  {57, 58, 59, 60, 61, 62}, 
  {63, 64, 65, 66, 67, 68}
};

int sliderPins[3][3] = {
  {A5,11,12},
  {A4,9,10},
  {A3,7,8}
};
int sliderValues[3] = {
  0, 0, 0
};
// 0 = idle, 1=moving
int sliderStates[3] = {
  1, 1, 1
};
int sliderNotes[3] = {
  55, 54, 56
};

int sliderInputNotes[3] = {
  45, 46, 47
};

// Knobs
int knobPins[2][2] = {
  {6, A0},
  {13, A2},
};

int knobPinStates[2] = {
  0, 0
};

int knobValues[2] = {
  0, 0
};

int knobNotes[3] = {
  43, 44
};

int opacityNotes[6] = {
  10, 11, 12, 13, 14, 15
};

int opacityValues[6] = {
  0, 0, 0, 0, 0, 0
};

int effectNotes[2][12] = {
  {
    16, 17, 18, 
    19, 20, 21, 
    22, 23, 24,
    25, 26, 27
  },
  {
    28, 29, 30,
    31, 32, 33, 
    34, 35, 36,
    37, 38, 39
  }
};

int effectValues[2][12] = {
  {
    0, 0, 0,
    0, 0, 0,
    0, 0, 0,
    0, 0, 0
  },
  {
    0, 0, 0,
    0, 0, 0,
    0, 0, 0,
    0, 0, 0
  }
};

int effectColors[6][3] = {
  {31, 119, 178},
  {52, 159, 45},
  {224, 26, 30},
  {255, 128, 0},
  {106, 61, 153},
  {175, 87, 40}
};


// Create an 'object' for our actual Momentary Button
void setup() {
  FastLED.addLeds<NEOPIXEL, DATA_PIN>(leds, NUM_LEDS); 
  
  for (int i=0; i<6; i++) {
    pinMode(togglePins[i], INPUT_PULLUP);
  }

  for (int i=0; i<2; i++) {
    pinMode(knobPins[i][0], INPUT);
    pinMode(knobPins[i][1], INPUT);

    knobPinStates[i] = digitalRead(knobPins[i][0]);
  }

  // for (int i=0; i<2; i++) {
  //   pinMode(switchPins[i], INPUT);

  //   int sensorValue = analogRead(switchPins[i]);
  //   switchValues[i] = round(sensorValue / 170 );
  // }

  for (int i=0; i<3; i++) {
    pinMode(sliderPins[i][0], INPUT);
    pinMode(sliderPins[i][1], OUTPUT);
    pinMode(sliderPins[i][2], OUTPUT);
  }

  Serial.begin(115200);
}

void setLEDS() {
  int brightness = 1;
  for (int i=0; i<6; i++) {
    int value = opacityValues[i];
    int offset = i * 8;
    
    for (int j=0; j<8; j++) {
      int pixel = offset + j;
      int intensity = floor(value / 12);

      if (j < intensity) {
        leds[pixel].r = 12 * brightness;
      } else if (j == intensity) {
        leds[pixel].r = value % 12;
      } else if (j > intensity) {
        leds[pixel].r = 0;
      }
    }
  }

  for (int i=0; i<2; i++) {
    for (int j=0; j<12; j++) {
      int colorIdx = floor(j / 2);

      int r  = effectColors[colorIdx][0];
      int g  = effectColors[colorIdx][1];
      int b  = effectColors[colorIdx][2];

      int value = effectValues[i][j];
      int pixel = 48 + (i * 12) + j;
      
      if (value == 127) {
        r = 10; 
        g = 10;
        b = 10;
      } else {
        r = floor(r  * (value * 0.1) * 0.1); 
        g = floor(g  * (value * 0.1) * 0.1);
        b = floor(b  * (value * 0.1) * 0.1);
      }

      leds[pixel].r = r;
      leds[pixel].g = g;
      leds[pixel].b = b;
    }
  }

  // leds[0].r = 100;
  FastLED.show();
}

void noteOn(byte channel, byte pitch, byte velocity) {
  midiEventPacket_t noteOn = {0x09, 0x90 | channel, pitch, velocity};
  MidiUSB.sendMIDI(noteOn);
}

void noteOff(byte channel, byte pitch, byte velocity) {
  midiEventPacket_t noteOff = {0x08, 0x80 | channel, pitch, velocity};
  MidiUSB.sendMIDI(noteOff);
}

void controlChange(byte channel, byte control, byte value) {
  midiEventPacket_t event = {0x0B, 0xB0 | channel, control, value};
  MidiUSB.sendMIDI(event);
}

void toggleHandler(int idx) {
  int prevState = prevToggleStates[idx];
  int pinState = digitalRead(togglePins[idx]);
  
  if ((pinState == HIGH) && (prevState == 0)) {
    prevToggleStates[idx] = 1;
    noteOff(0, toggleNotes[idx], 64);
    MidiUSB.flush();
  } else if ((pinState == LOW) && (prevState == 1)) {
    prevToggleStates[idx] = 0;
    noteOn(0, toggleNotes[idx], 64);   // Channel 0, middle C, normal velocity
    MidiUSB.flush();
  }
}

void switchHandler(int idx) {
  int sensorValue = analogRead(switchPins[idx]);
  int position = round(sensorValue / 170 );
  
  if (abs(position - switchValues[idx]) > 0) {
    controlChange(0, switchNotes[idx][position], 64);
    MidiUSB.flush();
  }

  switchValues[idx] = position;
}

void sliderHandler(int idx) {
  
  int sensorValue = analogRead(sliderPins[idx][0]);
  int position = round(sensorValue / 8 );
  
  unsigned long now = micros();
  double timeChange = (double)(now - sliderTimer);
    
  if (sliderStates[idx] == 0) {
    if (timeChange > 1000) {
      if (abs(position - sliderValues[idx]) > 1) {
        int note = floor(sensorValue / 128);
        int vel = sensorValue % 128;
        // controlChange(0, note, vel);
        controlChange(0, sliderNotes[idx], position);
        MidiUSB.flush();

        sliderValues[idx] = position;
      }

      sliderTimer = now;
    }
  } else {
    if (abs(position - sliderValues[idx]) < 1) {
      digitalWrite(sliderPins[idx][1], LOW);
      digitalWrite(sliderPins[idx][2], LOW);
      
      controlChange(0, sliderNotes[idx], position);
      MidiUSB.flush();

      sliderValues[idx] = position;
      sliderStates[idx] = 0;

      sliderTimer = micros();
    } else {
      if (timeChange < 1000) {
        if (position < sliderValues[idx]) {
          digitalWrite(sliderPins[idx][1], LOW);
          digitalWrite(sliderPins[idx][2], HIGH);
        } else if (position > sliderValues[idx]) {
          digitalWrite(sliderPins[idx][2], LOW);
          digitalWrite(sliderPins[idx][1], HIGH);
        }
      } else {
        digitalWrite(sliderPins[idx][1], LOW);
        digitalWrite(sliderPins[idx][2], LOW);

        delayMicroseconds(500);
        sliderTimer = micros();
      }
    }
  }
}

void knobHandler(int idx) {
  unsigned long now = micros();
  double timeChange = (double)(now - knobTimer);

  if (timeChange > 1000) {
    int aVal = digitalRead(knobPins[idx][0]);
    if (aVal != knobPinStates[idx]) {
      if (digitalRead(knobPins[idx][1]) != aVal) { // Means pin A Changed first - We're Rotating Clockwise
        if (knobValues[idx] == 1) {
          controlChange(0, knobNotes[idx], 0);   // Channel 0, middle C, normal velocity
          MidiUSB.flush();
          knobValues[idx] = 0;
        } else {
          knobValues[idx] = 1;
        }
      } else {// Otherwise B changed first and we're moving CCW
        if (knobValues[idx] == 1) {
          controlChange(0, knobNotes[idx], 127);   // Channel 0, middle C, normal velocity
          MidiUSB.flush();
          knobValues[idx] = 0;
        } else {
          knobValues[idx] = 1;
        }
      }

      knobPinStates[idx] = aVal;
    }

    knobTimer = now;
  }
}

void handleMidiIn(int header, int note, int velocity) {
  // TODO: Remove with new HBridge
  for (int i=0; i<3; i++) {
    if (note == sliderInputNotes[i]) {
      sliderValues[i] = velocity;
      sliderStates[i] = 1;
    }
  }

  int shouldSetLEDS = 0;
  for (int i=0; i<6; i++) {
    if (note == opacityNotes[i]) {
      opacityValues[i] = velocity;
      shouldSetLEDS = 1;
    }
  }

  for (int i=0; i<2; i++) {
    for (int j=0; j<12; j++) {
      if (note == effectNotes[i][j]) {
        effectValues[i][j] = velocity;
        shouldSetLEDS = 1;
      }
    }
  }

  if (shouldSetLEDS = 1) {
    setLEDS();
  }
}

void loop() {
  midiEventPacket_t rx;

  for (int i=0; i<6; i++) {
    toggleHandler(i);
  }

  for (int i=0; i<2; i++) {
    knobHandler(i);
  }

  for (int i=0; i<3; i++) {
    sliderHandler(i);
  }

  do {
    rx = MidiUSB.read();
    if (rx.header != 0) {
      handleMidiIn(rx.byte1, rx.byte2, rx.byte3);
    }
  } while (rx.header != 0);
}