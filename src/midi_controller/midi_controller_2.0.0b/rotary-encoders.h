#include <MIDIUSB.h>

#define DIR_NONE 0x00           // No complete step yet.
#define DIR_CW   0x10           // Clockwise step.
#define DIR_CCW  0x20           // Anti-clockwise step.
#define R_START     0x3
#define R_CW_BEGIN  0x1
#define R_CW_NEXT   0x0
#define R_CW_FINAL  0x2
#define R_CCW_BEGIN 0x6
#define R_CCW_NEXT  0x4
#define R_CCW_FINAL 0x5

const unsigned char ttable[8][4] = {
    {R_CW_NEXT,  R_CW_BEGIN,  R_CW_FINAL,  R_START},                // R_CW_NEXT
    {R_CW_NEXT,  R_CW_BEGIN,  R_CW_BEGIN,  R_START},                // R_CW_BEGIN
    {R_CW_NEXT,  R_CW_FINAL,  R_CW_FINAL,  R_START | DIR_CW},       // R_CW_FINAL
    {R_START,    R_CW_BEGIN,  R_CCW_BEGIN, R_START},                // R_START
    {R_CCW_NEXT, R_CCW_FINAL, R_CCW_BEGIN, R_START},                // R_CCW_NEXT
    {R_CCW_NEXT, R_CCW_FINAL, R_CCW_FINAL, R_START | DIR_CCW},      // R_CCW_FINAL
    {R_CCW_NEXT, R_CCW_BEGIN, R_CCW_BEGIN, R_START},                // R_CCW_BEGIN
    {R_START,    R_START,     R_START,     R_START}                 // ILLEGAL
};
    
unsigned long rotaryTimer;

int rotaryPins[2][2] = {
  {38, 39},
  {40, 41},
};

int rotaryPinStates[2] = {
  0, 0
};

int rotaryValues[2] = {
  0, 0
};

int rotaryNotes[3] = {
  30, 31
};

void rotaryHandler(int idx) {
  int aVal = (digitalRead(rotaryPins[idx][0]) << 1) | digitalRead(rotaryPins[idx][1]);
  int val = ttable[rotaryPinStates[idx] & 0x07][aVal];
  
  if (val & DIR_CW) { // Means pin A Changed first - We're Rotating Clockwise
    controlChange(0, rotaryNotes[idx], 0);   // Channel 0, middle C, normal velocity
    // MidiUSB.flush();
  }
      
  if (val & DIR_CCW) {
    controlChange(0, rotaryNotes[idx], 127);   // Channel 0, middle C, normal velocity
    // MidiUSB.flush();
  }

  rotaryPinStates[idx] = val;
}

void rotaryHandler0() {
  rotaryHandler(0);
}


void rotaryHandler1() {
  rotaryHandler(1);
}

void rotaryInit() {
  for (int i=0; i<2; i++) {
    pinMode(rotaryPins[i][0], INPUT);
    pinMode(rotaryPins[i][1], INPUT);

    rotaryPinStates[i] = (digitalRead(rotaryPins[i][0]) << 1) | digitalRead(rotaryPins[i][1]);
  }

  attachInterrupt(digitalPinToInterrupt(rotaryPins[0][0]), rotaryHandler0, CHANGE);
	attachInterrupt(digitalPinToInterrupt(rotaryPins[0][1]), rotaryHandler0, CHANGE);

  attachInterrupt(digitalPinToInterrupt(rotaryPins[1][0]), rotaryHandler1, CHANGE);
	attachInterrupt(digitalPinToInterrupt(rotaryPins[1][1]), rotaryHandler1, CHANGE);
    
}