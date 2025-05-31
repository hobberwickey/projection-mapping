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
// A9

int calibrated = 0;

void setup() {
  motorizedSliderInit();
  ledsInit();
  buttonInit();
  knobInit();
  rotaryInit();
}

int handleMidiIn(int header, int note, int velocity) {
  for (int i=0; i<2; i++) {
    if (note == sliderInputNotes[i]) {
      sliderValues[i] = velocity;
      sliderStates[i] = 1;
    }
  }

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

  return shouldSetLEDS;
  // if (shouldSetLEDS == 1) {
  //   setLEDS();
  // }
}



void loop() {
  if (calibrated == 0) {
    calibrateLEDS();
    calibrateSliders();

    if (millis() > 5000) {
      calibrated = 1;
      resetLEDS();
      resetSliders();

      delay(1);
      return;
    }

    delay(1);
    return;
  }

  midiEventPacket_t rx;

  for (int i=0; i<2; i++) {
    sliderHandler(i);
  }

  for (int i=0; i<6; i++) {
    knobHandler(i);
  }

  for (int i=0; i<6; i++) {
    buttonHandler(i);
  }

  for (int i=0; i<2; i++) {
    rotaryHandler(i);
  }

  int shouldSetLEDS = 0;
  do {
    rx = MidiUSB.read();
    if (rx.header != 0) {
      shouldSetLEDS = max(handleMidiIn(rx.byte1, rx.byte2, rx.byte3), shouldSetLEDS);
    }
  } while (rx.header != 0);

  if (shouldSetLEDS == 1) {
    setLEDS();
  }

  MidiUSB.flush();
  delay(1);
}