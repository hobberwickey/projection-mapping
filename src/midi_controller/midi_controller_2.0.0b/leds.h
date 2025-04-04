#include <FastLED.h>
#define NUM_LEDS 96
#define DATA_PIN A9
CRGB leds[NUM_LEDS];

int selectedNotes[3] = { 
  // 50: script
  // 51: effect
  // 52: opacity
  50, 51, 52
};

int opacityNotes[6] = {
  // MIDI Notes for setting opacity layers 1-6
  56, 57, 58, 59, 60, 61
};

int effectNotes[12] = {
  // Mido notes for setting [x,y] for layers 1-6
  62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73
};

int selectedValues[3] = {
  // Initial selected values 127 = Not selected
  127, 127, 127
};

int opacityValues[6] = {
  // Initial layer opacity
  0, 0, 0, 0, 0, 0
};

int effectValues[12] = {
  // Initial effect values
  0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0
};

void ledsInit() {
  FastLED.addLeds<NEOPIXEL, DATA_PIN>(leds, NUM_LEDS); 
}

void setLEDS() {
  // Brightness factor
  int brightness = 1;
  int selectedColor[3] = {0,1,0};
  int deselectedColor[3] = {1,1,1};

  for (int i=0; i<6; i++) {
    int value = opacityValues[i];
    int offset = i * 8;
    
    bool isSelected = selectedValues[2] == i;
    for (int j=0; j<8; j++) {
      int pixel = offset + j;
      int intensity = floor(value / 12);

      leds[pixel].r = 0; 
      leds[pixel].g = 0;
      leds[pixel].b = 0;

      if (j < intensity) {
        leds[pixel].r = deselectedColor[0] * 12 * brightness;
        leds[pixel].g = deselectedColor[1] * 12 * brightness;
        leds[pixel].b = deselectedColor[2] * 12 * brightness;
        if (isSelected) {
          leds[pixel].r = selectedColor[0] * 12 * brightness;
          leds[pixel].g = selectedColor[1] * 12 * brightness;
          leds[pixel].b = selectedColor[2] * 12 * brightness;
        }
      } else if (j == intensity) {
        leds[pixel].r = deselectedColor[0] * value % 12;
        leds[pixel].g = deselectedColor[1] * value % 12;
        leds[pixel].b = deselectedColor[2] * value % 12;
        if (isSelected) {
          leds[pixel].r = selectedColor[0] * value % 12;
          leds[pixel].g = selectedColor[1] * value % 12;
          leds[pixel].b = selectedColor[2] * value % 12;
        }
      } else if (j > intensity) {
        leds[pixel].r = 0;
        leds[pixel].g = 0;
        leds[pixel].b = 0;
      }
    }
  } 

  for (int i=0; i<12; i++) {
    bool isValueSelected = selectedValues[0] == floor(i / 2) || selectedValues[1] == floor(i / 2);
    bool flip = i % 2 != 0;

    int value = effectValues[i];
    int offset = (i * 4) + 48;
    
    int slotIndex = offset;
    if (flip) {
      slotIndex += 3;
    }

    if (isValueSelected) {
      leds[slotIndex].r = 10;
      leds[slotIndex].g = 10;
      leds[slotIndex].b = 10;
    } else {
      leds[slotIndex].r = 0;
      leds[slotIndex].g = 0;
      leds[slotIndex].b = 0;
    }

    for (int j=0; j<3; j++) {
      int pixel = slotIndex + (j + 1);
      if (flip) {
        pixel = slotIndex - (j + 1);
      }
      int intensity = floor(value / 42);

      leds[pixel].r = 0; 
      leds[pixel].g = 0;
      leds[pixel].b = 0;

      if (j < intensity) {
        leds[pixel].r = 12 * brightness;
        if (isValueSelected) {
          leds[pixel].g = 12 * brightness;
          leds[pixel].b = 12 * brightness;
        }
      } else if (j == intensity) {
        leds[pixel].r = floor((value % 42) / 3);
        if (isValueSelected) {
          leds[pixel].g = floor((value % 42) / 3);
          leds[pixel].b = floor((value % 42) / 3);
        }
      } else if (j > intensity) {
        leds[pixel].r = 0;
        leds[pixel].g = 0;
        leds[pixel].b = 0;
      }
    }
  }

  // for (int i=0; i<2; i++) {
  //   for (int j=0; j<12; j++) {
  //     int colorIdx = floor(j / 2);

  //     int r  = effectColors[colorIdx][0];
  //     int g  = effectColors[colorIdx][1];
  //     int b  = effectColors[colorIdx][2];

  //     int value = effectValues[i][j];
  //     int pixel = 48 + (i * 12) + j;
      
  //     if (value == 127) {
  //       r = 10; 
  //       g = 10;
  //       b = 10;
  //     } else {
  //       r = floor(r  * (value * 0.1) * 0.1); 
  //       g = floor(g  * (value * 0.1) * 0.1);
  //       b = floor(b  * (value * 0.1) * 0.1);
  //     }

  //     leds[pixel].r = r;
  //     leds[pixel].g = g;
  //     leds[pixel].b = b;
  //   }
  // }

  // leds[0].r = 100;
  FastLED.show();
}

// void loop() {
//   midiEventPacket_t rx;

//   do {
//     rx = MidiUSB.read();
//     if (rx.header != 0) {
//       handleMidiIn(rx.byte1, rx.byte2, rx.byte3);
//     }
//   } while (rx.header != 0);
// }