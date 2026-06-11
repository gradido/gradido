#include "gradido_blockchain_core/utils/converter.h"
#include "gradido_blockchain_core/memory.h"
#include "gradido_blockchain_core/result.h"

#ifdef USE_SODIUM
#include "sodium.h"
#endif // USE_SODIUM

#include <assert.h>
#include <string.h>

/**
 * @brief Compute the number of decimal digits of a uint64_t value.
 *
 * This function returns the length of the decimal representation of `v`
 * without converting it to a string.
 *
 * Implementation details:
 * - Uses a fully unrolled decision tree of comparisons against powers of 10.
 * - Avoids loops, divisions, and memory lookups.
 * - Runs in O(1) time with a small, fixed number of branches.
 *
 * Rationale:
 * - A naive implementation (e.g., repeated division by 10 or scanning a powers[] array)
 *   introduces loops, branch dependencies, and potential cache access.
 * - This version minimizes branch depth and allows the CPU branch predictor
 *   to perform efficiently, making it faster in hot paths.
 *
 * Range:
 * - Supports full uint64_t range [0, UINT64_MAX].
 * - Maximum return value is 19 (since UINT64_MAX < 10^20).
 *
 * Notes:
 * - The structure may look unusual, but it is intentionally optimized for performance.
 * - Any modification should preserve the exact boundary conditions (powers of 10),
 *   otherwise subtle off-by-one errors may occur.
 */
size_t grdu_uint64_to_string_size(uint64_t v) {
  if (v < 100000000ULL) {
    if (v < 10000ULL) {
      if (v < 100ULL) return v < 10 ? 1 : 2;
      return v < 1000ULL ? 3 : 4;
    }
    if (v < 1000000ULL) { return v < 100000ULL ? 5 : 6; }
    return v < 10000000ULL ? 7 : 8;
  }

  if (v < 1000000000000ULL) {
    if (v < 10000000000ULL) { return v < 1000000000ULL ? 9 : 10; }
    return v < 100000000000ULL ? 11 : 12;
  }

  if (v < 10000000000000000ULL) {
    if (v < 100000000000000ULL) { return v < 10000000000000ULL ? 13 : 14; }
    return v < 1000000000000000ULL ? 15 : 16;
  }

  return v < 100000000000000000ULL ? 17 : (v < 1000000000000000000ULL ? 18 : 19);
}

size_t grdu_int64_to_string_size(int64_t v) {
  if (v >= 0) {
    return grdu_uint64_to_string_size((uint64_t)v);
  } else {
    return grdu_uint64_to_string_size((uint64_t)(v * -1)) + 1;
  }
}

size_t grdu_uint64_to_string_known_string_size(char *buffer, uint64_t value, size_t stringSize) {
  if (value == 0) {
    if (stringSize < 1) {
      return 1; // return required size without null terminator
    }
    buffer[0] = '0';
    buffer[1] = '\0';
    return 1;
  }
  uint64_t temp = value;
  int len = stringSize;
  int cursor = len;
  buffer[cursor] = '\0';

  static const char DIGIT_TABLE[201] = "00010203040506070809"
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
  while (temp >= 100) {
    if (cursor < 2) {
      return grdu_uint64_to_string_size(value); // return required size without null terminator
    }
    uint64_t q = temp / 100;
    uint64_t r = temp - q * 100;
    buffer[--cursor] = DIGIT_TABLE[r * 2 + 1];
    buffer[--cursor] = DIGIT_TABLE[r * 2];
    temp = q;
  }

  // last 1 or 2 digits
  if (temp < 10) {
    if (cursor < 1) {
      return grdu_uint64_to_string_size(value); // return required size without null terminator
    }
    buffer[--cursor] = '0' + (char)temp;
  } else {
    if (cursor < 2) {
      return grdu_uint64_to_string_size(value); // return required size without null terminator
    }
    buffer[--cursor] = DIGIT_TABLE[temp * 2 + 1];
    buffer[--cursor] = DIGIT_TABLE[temp * 2];
  }
  return len; // return number of characters written, not counting null terminator
}

size_t grdu_int64_to_string_known_string_size(char *buffer, int64_t value, size_t stringSize) {
  if (value >= 0) {
    return grdu_uint64_to_string_known_string_size(buffer, (uint64_t)value, stringSize);
  } else {
    buffer[0] = '-';
    return grdu_uint64_to_string_known_string_size(&buffer[1], (uint64_t)(value * -1), stringSize) +
           1;
  }
}
// for easy use, one call

size_t grdu_uint64_to_string(char *buffer, size_t bufferSize, uint64_t value) {
  size_t requiredSize = grdu_uint64_to_string_size(value);
  if (bufferSize < requiredSize + 1) {
    // better safe then sorry
    if (bufferSize) { buffer[0] = '\0'; }
    return requiredSize; // return required size without null terminator
  }
  return grdu_uint64_to_string_known_string_size(buffer, value, requiredSize);
}

size_t grdu_int64_to_string(char *buffer, size_t bufferSize, int64_t value) {
  size_t requiredSize = grdu_int64_to_string_size(value);
  if (bufferSize < requiredSize + 1) {
    // better safe then sorry
    if (bufferSize) { buffer[0] = '\0'; }
    return requiredSize; // return required size without null terminator
  }
  return grdu_int64_to_string_known_string_size(buffer, value, requiredSize);
}

#ifdef USE_SODIUM

/*
 * C11 static assert fallback safety
 */
#if !defined(static_assert)
#define static_assert _Static_assert
#endif

static_assert(UUID_BINARY_SIZE == 16, "uuid binary size don't match 16 bytes");

void grdu_uuid_to_string(char *result_buffer, const uint8_t uuid[UUID_BINARY_SIZE]) {
  char hex[33];
  sodium_bin2hex(hex, sizeof(hex), uuid, 16);
  memcpy(result_buffer, hex, 8);
  result_buffer[8] = '-';
  memcpy(result_buffer + 9, hex + 8, 4);
  result_buffer[13] = '-';
  memcpy(result_buffer + 14, hex + 12, 4);
  result_buffer[18] = '-';
  memcpy(result_buffer + 19, hex + 16, 4);
  result_buffer[23] = '-';
  memcpy(result_buffer + 24, hex + 20, 12);
  result_buffer[36] = '\0';
}

/*
grd_result grdu_uuid_from_string(uint8_t *uuid, const char *uuid_string) {
  if (!uuid || !uuid_string) { return GRD_ERROR_NULL_POINTER; }
  if (strlen(uuid_string) != 36) { return GRD_ERROR_INVALID_PARAM; }

  char hex[33];
  memcpy(hex, uuid_string, 8);
  memcpy(hex + 8, uuid_string + 9, 4);
  memcpy(hex + 12, uuid_string + 14, 4);
  memcpy(hex + 16, uuid_string + 19, 4);
  memcpy(hex + 20, uuid_string + 24, 12);
  hex[32] = '\0';

  size_t bin_len = 0;
  if (sodium_hex2bin(uuid, 16, hex, 32, NULL, &bin_len, NULL) != 0) {
    return GRD_ERROR_ENCODE_FAILED;
  }
  if (bin_len != 16) { return GRD_ERROR_INVALID_PARAM; }
  return GRD_SUCCESS;
}
*/
// faster as version above
grd_result grdu_uuid_from_string(uint8_t *uuid, const char *uuid_string) {
  if (!uuid || !uuid_string) return GRD_ERROR_NULL_POINTER;
  if (strlen(uuid_string) != 36) return GRD_ERROR_INVALID_PARAM;

  static const uint8_t hex_lookup[256] = {
      ['0'] = 0,  ['1'] = 1,  ['2'] = 2,  ['3'] = 3,  ['4'] = 4,  ['5'] = 5,
      ['6'] = 6,  ['7'] = 7,  ['8'] = 8,  ['9'] = 9,  ['a'] = 10, ['b'] = 11,
      ['c'] = 12, ['d'] = 13, ['e'] = 14, ['f'] = 15, ['A'] = 10, ['B'] = 11,
      ['C'] = 12, ['D'] = 13, ['E'] = 14, ['F'] = 15,
  };

  size_t j = 0;
  for (size_t i = 0; i < 36; i++) {
    if (uuid_string[i] == '-') continue;
    uint8_t hi = hex_lookup[(unsigned char)uuid_string[i]];
    if (hi == 0 && uuid_string[i] != '0') { return GRD_ERROR_ENCODE_FAILED; }
    ++i;
    uint8_t lo = hex_lookup[(unsigned char)uuid_string[i]];
    if (lo == 0 && uuid_string[i] != '0') { return GRD_ERROR_ENCODE_FAILED; }
    if (hi == 0 && lo == 0 && uuid_string[i - 1] != '0') continue;
    uuid[j++] = (hi << 4) | lo;
  }

  return GRD_SUCCESS;
}

grd_result grdu_binary_to_hex(char *result_buffer, const grd_memory_block *data) {
  if (!result_buffer || !data || !data->size) { return GRD_ERROR_NULL_POINTER; }
  size_t hex_size = data->size * 2 + 1;

  sodium_bin2hex((char *)result_buffer, hex_size, data->data, data->size);
  return GRD_SUCCESS;
}

grd_result grdu_binary_from_hex(uint8_t *result_buffer, const char *hex) {
  if (!result_buffer || !hex) { return GRD_ERROR_NULL_POINTER; }
  size_t hex_size = strlen(hex);
  size_t bin_size = hex_size / 2;
  // invalid hex if size isn't power of 2
  if (bin_size * 2 != hex_size) { return GRD_ERROR_INVALID_PARAM; }
  size_t result_bin_size = 0;
  if (0 != sodium_hex2bin(result_buffer, bin_size, hex, hex_size, NULL, &result_bin_size, NULL)) {
    return GRD_ERROR_DECODE_FAILED;
  }
  if (result_bin_size != bin_size) { return GRD_ERROR_INVALID_STATE; }
  return GRD_SUCCESS;
}

const static int BASE64_VARIANT = sodium_base64_VARIANT_ORIGINAL;

size_t grdu_binary_to_base64_length(size_t binSize) {
  return sodium_base64_encoded_len(binSize, BASE64_VARIANT);
}

grd_result grdu_binary_to_base64(grd_memory_block *result_block, const grd_memory_block *data) {
  if (!result_block || !data) { return GRD_ERROR_NULL_POINTER; }
  if (nullptr ==
      sodium_bin2base64(
          (char *)result_block->data, result_block->size, data->data, data->size, BASE64_VARIANT
      )) {
    return GRD_ERROR_OUT_OF_MEMORY;
  }
  return GRD_SUCCESS;
}

grd_result grdu_binary_to_base64(
    grd_memory_block *result_block, const grd_memory_block *data, grd_memory *allocator
) {
  if (!result_block || !data || !allocator) { return GRD_ERROR_NULL_POINTER; }
  size_t strSize = sodium_base64_encoded_len(data->size, BASE64_VARIANT);
  grd_result result = grd_memory_block_alloc(result_block, allocator, strSize);
  if (result != GRD_SUCCESS) { return result; }

  return grdu_binary_to_base64(result_block, data);
}

size_t grdu_binary_from_base64(uint8_t *result_buffer, const char *base64_str) {
  if (!result_buffer || !base64_str) { return 0; }
  size_t result_bin_size = 0;
  if (sodium_base642bin(
          result_buffer.data, result_buffer.size, base64_str, strlen(base64_str), NULL,
          &result_bin_size, NULL, BASE64_VARIANT
      )) {
    return 0;
  }
  return result_bin_size;
}

#endif // USE_SODIUM
