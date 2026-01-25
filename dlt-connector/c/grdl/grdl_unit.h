#ifndef __GRADIDO_BLOCKCHAIN_C_LOGIC_UNIT_H
#define __GRADIDO_BLOCKCHAIN_C_LOGIC_UNIT_H

#include "../grdd/grdd_timestamp.h"

#include <stdbool.h> 
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct grdl_unit 
{
  int64_t gradidoCent;
} grdl_unit;

grdl_unit grdl_unit_from_decimal(double gdd);
grdl_unit grdl_unit_from_string(const char* gdd_string);

//! \return 0 for ok, 1 for invalid precision, 2 for printf encoding error
//          and -x if string buffer wasn't big enough where x is the number of missing bytes
int grdl_unit_to_string(const grdl_unit* u, char* buffer, size_t bufferSize, uint8_t precision);

inline grdl_unit grdl_unit_negated(const grdl_unit* u) 
{
  grdl_unit gradidoUnit = {u->gradidoCent};  
  gradidoUnit.gradidoCent *= -1;
  return gradidoUnit;
}

inline void grdl_unit_negate(grdl_unit* u)
{
    if (u) u->gradidoCent = -u->gradidoCent;
}

static inline grdl_unit grdl_unit_zero()
{
  return (grdl_unit){0};
}
//! return false if startTime > endTime
bool grdl_unit_calculate_duration_seconds(
  const grdd_timestamp* startTime, 
  const grdd_timestamp* endTime,
  int64_t* outSeconds
);

grdl_unit grdl_unit_calculate_decay(const grdl_unit* u, int64_t seconds);

inline grdl_unit grdl_unit_calculate_decay_timestamp(
  const grdl_unit* u, 
  const grdd_timestamp* startTime, 
  const grdd_timestamp* endTime
) {
  int64_t seconds = 0;
  if(!grdl_unit_calculate_duration_seconds(startTime, endTime, &seconds)) {
    return (grdl_unit){0};
  }
  return grdl_unit_calculate_decay(u, seconds);
}

inline grdl_unit grld_unit_calculate_compound_interest(const grdl_unit* u, int64_t seconds) {
  return grdl_unit_calculate_decay(u, -seconds);
}

inline grdl_unit grld_unit_calculate_compound_interest_timestamp(
  const grdl_unit* u, 
  const grdd_timestamp* startTime, 
  const grdd_timestamp* endTime
) {
  int64_t seconds = 0;
  if(!grdl_unit_calculate_duration_seconds(startTime, endTime, &seconds)) {
    return (grdl_unit){0};
  }
  return grdl_unit_calculate_decay(u, -seconds);
}

#ifdef __cplusplus
}
#endif


#endif // __GRADIDO_BLOCKCHAIN_C_LOGIC_UNIT_H