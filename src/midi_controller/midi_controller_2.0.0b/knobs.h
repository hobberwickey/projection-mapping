#include <MIDIUSB.h>

int knobPins[6] = {
  A2, A3, A4, A5, A6, A7,
};
int knobValues[6] = {
  0, 0, 0, 0, 0, 0
};

int knobNotes[6] = {
  10, 11, 12, 13, 14, 15
};

void knobInit() {
  for (int i=0; i<6; i++) {
    pinMode(knobPins[i], INPUT);
  }
}

void knobHandler(int idx) {
  int sensorValue = analogRead(knobPins[idx]);

  int min = 0;
  int max = 1023;
  int velocity = map(sensorValue, min, max, 0, 127);

  if (abs(knobValues[idx] - velocity) > 5) {
    controlChange(0, knobNotes[idx], velocity);
    MidiUSB.flush();
    knobValues[idx] = velocity;
  }
}