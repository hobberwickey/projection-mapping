#include <MIDIUSB.h>

#include "midi-out.h"
#include "leds.h"
#include "knobs.h"
#include "buttons.h"
#include "sliders.h"
#include "rotary-encoders.h"

//////////////////// 
/////// Pins ///////
////////////////////

///// Sliders //////
// A0, 11, 12
// A1, 10, 9

////// Knobs ///////
// A2
// A3
// A4
// A5
// A6
// A7

///// Buttons //////
// 7
// 6
// 5
// 4
// 3
// 2

////// Rotary //////
// 41, 40
// 39, 38

/////// LEDS ///////
// 32

void setup() {
  // motorizedSliderInit();
  ledsInit();
  buttonInit();
  knobInit();
}

void handleMidiIn(int header, int note, int velocity) {
  // for (int i=0; i<1; i++) {
  //   if (note == sliderInputNotes[i]) {
  //     sliderValues[i] = velocity;
  //     sliderStates[i] = 1;
  //   }
  // }

  int shouldSetLEDS = 0;
  
  for (int i=0; i<3; i++) {
    if (note == selectedNotes[i]) {
      selectedValues[i] = velocity;
      shouldSetLEDS = 1;
    }
  }
  
  for (int i=0; i<6; i++) {
    if (note == opacityNotes[i]) {
      opacityValues[i] = velocity;
      shouldSetLEDS = 1;
    }
  }

  for (int i=0; i<12; i++) {
    if (note == effectNotes[i]) {
        effectValues[i] = velocity;
        shouldSetLEDS = 1;
    }
  }

  if (shouldSetLEDS == 1) {
    setLEDS();
  }
}

void loop() {
  midiEventPacket_t rx;

  // for (int i=0; i<6; i++) {
  //   toggleHandler(i);
  // }

  // for (int i=0; i<1; i++) {
  //   sliderHandler(i);
  // }

  for (int i=0; i<1; i++) {
    knobHandler(i);
  }

  for (int i=0; i<1; i++) {
    buttonHandler(i);
  }

  do {
    rx = MidiUSB.read();
    if (rx.header != 0) {
      handleMidiIn(rx.byte1, rx.byte2, rx.byte3);
    }
  } while (rx.header != 0);

  delay(100);
}