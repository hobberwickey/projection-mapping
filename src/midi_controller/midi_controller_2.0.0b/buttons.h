#include <MIDIUSB.h>

int buttonPins[6] = {
  2, 3, 4, 5, 6, 7
};

int prevButtonStates[6] = {
  0, 0, 0, 0, 0, 0
};

int buttonNotes[6] = {
  0, 1, 2, 3, 4, 5
};

void buttonHandler(int idx) {
  int prevState = prevButtonStates[idx];
  int pinState = digitalRead(buttonPins[idx]);
  
  if ((pinState == HIGH) && (prevState == 0)) {
    prevButtonStates[idx] = 1;
    noteOff(0, buttonNotes[idx], 64);
    // MidiUSB.flush();
  } else if ((pinState == LOW) && (prevState == 1)) {
    prevButtonStates[idx] = 0;
    noteOn(0, buttonNotes[idx], 127); 
    // MidiUSB.flush();
  }

  timer.in(1000, buttonHandler, idx);
}

void buttonInit() {
  for (int i=0; i<6; i++) {
    pinMode(buttonPins[i], INPUT_PULLUP);
    timer.in(1000, buttonHandler, i);
  }
}