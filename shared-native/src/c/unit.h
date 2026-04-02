#ifndef GRADIDO_BLOCKCHAIN_C_DATA_UNIT_H
#define GRADIDO_BLOCKCHAIN_C_DATA_UNIT_H

#include <stdbool.h> 
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef int64_t grdd_unit;
typedef int64_t grdd_timestamp_seconds;
typedef int64_t grdd_duration_seconds;

double roundToPrecision(double gdd, uint8_t precision);
grdd_unit grdd_unit_from_decimal(double gdd);
double grdd_unit_to_decimal(grdd_unit u);

//! \param resultGdd if not nulltpr and if gdd_string is valid decimal string, will be set to gdd cent (integer) value
//! \return false if gdd_string is null ptr or not valid decimal, return true if gdd_string is valid decimal
bool grdd_unit_from_string(const char* gdd_string, grdd_unit* resultGdd);

static inline grdd_unit grdd_unit_negated(const grdd_unit u) 
{
  return u * -1;
}

static inline void grdd_unit_negate(grdd_unit* u)
{
    if (u) *u = -*u;
}

grdd_timestamp_seconds get_decay_start_time();

//! return false if startTime > endTime
//! make sure that returned duration starts after decay start time, returns 0 if time range is entirely before decay start time
bool grdd_unit_calculate_duration_seconds(grdd_timestamp_seconds startTime, grdd_timestamp_seconds endTime, grdd_duration_seconds* outSeconds);

int grdd_unit_to_string(grdd_unit u, char* buffer, size_t bufferSize, uint8_t precision);

grdd_unit grdd_unit_calculate_decay(grdd_unit u, grdd_duration_seconds duration);


#ifdef __cplusplus
}
#endif


#endif // GRADIDO_BLOCKCHAIN_C_DATA_UNIT_H