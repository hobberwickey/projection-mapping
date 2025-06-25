#include <MIDIUSB.h>

int knobPins[6] = {
  A2, A3, A4, A5, A6, A7,
};

int knobCounter[6] = {
  0, 0, 0, 0, 0, 0
};

int knobValues[6] = {
  0, 0, 0, 0, 0, 0
};

int knobAverages[6][10] = {
  {0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
  {0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
  {0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
  {0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
  {0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
  {0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
};

int knobNotes[6] = {
  10, 11, 12, 13, 14, 15
};

void knobHandler(int idx) {
  int sensorValue = analogRead(knobPins[idx]);

  knobAverages[idx][knobCounter[idx]] = sensorValue;
  int avgSensor = 0;
  for (int cntr=0; cntr<10; cntr++) {
    avgSensor += knobAverages[idx][cntr];
  }
  avgSensor = floor(avgSensor / 10);

  knobCounter[idx] += 1;
  if (knobCounter[idx] >= 10) {
    knobCounter[idx] = 0;
  }

  int min = 10;
  int max = 1014;
  int velocity = floor(constrain(map(avgSensor, min, max, 0, 127), 0, 127));

  if (abs(knobValues[idx] - velocity) > 5) {
    controlChange(0, knobNotes[idx], velocity);
    // MidiUSB.flush();
    knobValues[idx] = velocity;
  }

  timer.in(1, knobHandler, idx);
}

void knobInit() {
  for (int i=0; i<6; i++) {
    pinMode(knobPins[i], INPUT);
    timer.in(1, knobHandler, i);
  }

  
}