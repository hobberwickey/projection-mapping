#include <FastLED.h>
#define NUM_LEDS 120
#define DATA_PIN A9
CRGB leds[NUM_LEDS];

int idxs[120] = {
  6, 7, 0, 1, 2, 3, 4, 5,
  14, 15, 8, 9, 10, 11, 12, 13,
  22, 23, 16, 17, 18, 19, 20, 21, 
  26, 27, 28, 29, 30, 31, 24, 25,
  34, 35, 36, 37, 38, 39, 32, 33,
  42, 43, 44, 45, 46, 47, 40, 41,
  95, 94, 93, 92,
  88, 89, 90, 91,
  87, 86, 85, 84,
  80, 81, 82, 83, 
  79, 78, 77, 76,
  72, 73, 74, 75,
  71, 70, 69, 68,
  64, 65, 66, 67,
  63, 62, 61, 60,
  56, 57, 58, 59,
  55, 54, 53, 52,
  48, 49, 50, 51, 
  96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 
  108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119
};

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

// int effectColors[6][3] = {
//   {31, 119, 178},
//   {52, 159, 45},
//   {224, 26, 30},
//   {255, 128, 0},
//   {106, 61, 153},
//   {175, 87, 40}
// };

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
      int pixel = idxs[offset + j];
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
    // Check if selected
    bool isValueSelected = selectedValues[0] == floor(i / 2) || selectedValues[1] == floor(i / 2);

    // set the color
    int* currentColor = isValueSelected ? selectedColor : deselectedColor;
    
    // Get the value
    int value = effectValues[i];
    
    // Get the 0-119 index
    int offset = (i * 4) + 48;

    // The actual pixel index
    int pixel = idxs[offset];

    // Set the selector row
    if (isValueSelected) {
      leds[pixel].r = currentColor[0] * 12;
      leds[pixel].g = currentColor[1] * 12;
      leds[pixel].b = currentColor[2] * 12;
    } else {
      leds[pixel].r = 0;
      leds[pixel].g = 0;
      leds[pixel].b = 0;
    }

    // Set the effect pixels
    for (int j=0; j<3; j++) {
      int pixel = idxs[offset + (j + 1)];
      int intensity = floor(value / 42);

      leds[pixel].r = 0; 
      leds[pixel].g = 0;
      leds[pixel].b = 0;

      if (j < intensity) {
        leds[pixel].r = currentColor[0] * 12 * brightness;
        leds[pixel].g = currentColor[1] * 12 * brightness;
        leds[pixel].b = currentColor[2] * 12 * brightness;
      } else if (j == intensity) {
        leds[pixel].r = currentColor[0] * floor((value % 42) / 3);
        leds[pixel].g = currentColor[1] * floor((value % 42) / 3);
        leds[pixel].b = currentColor[2] * floor((value % 42) / 3);
      } else if (j > intensity) {
        leds[pixel].r = 0;
        leds[pixel].g = 0;
        leds[pixel].b = 0;
      }
    }
  }

  for (int i=0; i<6; i++) {
    if (selectedValues[1] == i) {
      int pixel = idxs[(i * 2) + 96];

      for (int j=0; j<2; j++) {
        leds[pixel + j].r = selectedColor[0] * 12;
        leds[pixel + j].g = selectedColor[1] * 12;
        leds[pixel + j].b = selectedColor[2] * 12;
      }
    } else {
      int pixel = idxs[(i * 2) + 96];

      for (int j=0; j<2; j++) {
        leds[pixel + j].r = 0;
        leds[pixel + j].g = 0;
        leds[pixel + j].b = 0;
      }
    }

    if (selectedValues[0] == i) {
      int pixel = idxs[(i * 2) + 96 + 12];

      for (int j=0; j<2; j++) {
        leds[pixel + j].r = selectedColor[0] * 12;
        leds[pixel + j].g = selectedColor[1] * 12;
        leds[pixel + j].b = selectedColor[2] * 12;
      }
    } else {
      int pixel = idxs[(i * 2) + 96 + 12];

      for (int j=0; j<2; j++) {
        leds[pixel + j].r = 0;
        leds[pixel + j].g = 0;
        leds[pixel + j].b = 0;
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
  //     int pixel = 96 + (i * 12) + j;
      
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