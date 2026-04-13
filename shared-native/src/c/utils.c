#include "utils.h"

static int count_digits(uint64_t v) 
{		
  static uint64_t powers[] = {
    10, 100, 1000, 10000, 100000,
    1000000, 10000000, 100000000,
    1000000000, 10000000000, 100000000000,
    1000000000000, 10000000000000, 100000000000000, 
    1000000000000000, 10000000000000000, 100000000000000000, 
    1000000000000000000, 10000000000000000000u
  };
  int i = 0;
  while (v >= powers[i++] && i < 19);
  return i;		
}

size_t grdu_uint64ToString(uint64_t value, char* buffer)
{
  if (value == 0) {
    buffer[0] = '0';
    buffer[1] = '\0';
    return 1;
  }
  int len = count_digits(value);		
  int cursor = len;		
  buffer[cursor] = '\0';

  static const char DIGIT_TABLE[201] =
    "00010203040506070809"
    "10111213141516171819"
    "20212223242526272829"
    "30313233343536373839"
    "40414243444546474849"
    "50515253545556575859"
    "60616263646566676869"
    "70717273747576777879"
    "80818283848586878889"
    "90919293949596979899";

  // process 2 digits at a time
  while (value >= 100) {
    uint64_t q = value / 100;
    uint64_t r = value - q * 100;
    buffer[--cursor] = DIGIT_TABLE[r * 2 + 1];
    buffer[--cursor] = DIGIT_TABLE[r * 2];
    value = q;
  }

  // last 1 or 2 digits
  if (value < 10) {
    buffer[--cursor] = '0' + (char)value;
  }
  else {
    buffer[--cursor] = DIGIT_TABLE[value * 2 + 1];
    buffer[--cursor] = DIGIT_TABLE[value * 2];
  }
  return len;
}