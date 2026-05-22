/******************************************************************************
 *                                                                            *
 * Copyright 2020-2021 Jiang Mengshan                                         *
 *                                                                            *
 * Licensed under the Apache License, Version 2.0 (the "License");            *
 * you may not use this file except in compliance with the License.           *
 * You may obtain a copy of the License at                                    *
 *                                                                            *
 *    http://www.apache.org/licenses/LICENSE-2.0                              *
 *                                                                            *
 * Unless required by applicable law or agreed to in writing, software        *
 * distributed under the License is distributed on an "AS IS" BASIS,          *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   *
 * See the License for the specific language governing permissions and        *
 * limitations under the License.                                             *
 *                                                                            *
 *****************************************************************************/

/**
 * @file fp256.h
 */

#pragma once

#include <inttypes.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <errno.h>

/** 64 bit unsigned integer */
#define u64 unsigned long long
/** 64 bit signed integer */
#define s64 signed long long
/** 32 bit unsigned integer */
#define u32 unsigned int
/** 32 bit signed integer */
#define s32 signed int
/** 8 bit unsigned character */
#define u8  unsigned char

/* TODO : error code? */
#define FP256_OK      0
#define FP256_ERR    -1

# define FP256_EXPORT

#define ORDER_BIG_ENDIAN     0
#define ORDER_LITTLE_ENDIAN  1

/* useless emmm */
#define FP256_LIMBS    4
#define FP256_BYTES    8

struct fp256;

typedef struct fp256 fp256;

/**
 * structure for 256 bit integer type.
 */
struct fp256 {
    /** d stores 256 bit integer, it has four 64 bit limbs. */
    u64 d[4];
    /** number of limbs used */
    unsigned int nlimbs;
};

#ifdef  __cplusplus
extern "C" {
#endif

/**
 * count number of limbs of a.
 *
 * @param[in] a           - 256 bit integer.
 * @return number of limbs.
 */
FP256_EXPORT size_t fp256_num_limbs(const fp256 *a);

/**
 * set r = limbs.
 *
 * @param[out] r          - result.
 * @param[in] limbs       - 64 bit integer array.
 * @param[in] l           - array length.
 * @return #FP256_OK if succeeded, #FP256_ERR otherwise.
 */
FP256_EXPORT int fp256_set_limbs(fp256 *r, const u64 *limbs, size_t l);

/**
 * compute a * b, rhi stores upper 256 bit result, rlo stores lower 256 bit result.
 *
 * @param[out] rhi        - result.
 * @param[out] rlo        - result.
 * @param[in] a           - 256 bit integer.
 * @param[in] b           - 256 bit integer.
 * @return #FP256_OK if succeeded, #FP256_ERR otherwise.
 */
FP256_EXPORT int fp256_mul(fp256 *rhi, fp256 *rlo, const fp256 *a, const fp256 *b);

/**
 * compute rem = num % div, quo = floor(num / div). \n
 * It relpaces division with multiplication by reciprocal,
 * see https://gmplib.org/~tege/division-paper.pdf.
 *
 * @param[out] rem        - remainder.
 * @param[out] quo        - quotient.
 * @param[in] num         - numerator.
 * @param[in] div         - divisor.
 * @return #FP256_OK if succeeded, #FP256_ERR otherwise.
 */
// FP256_EXPORT int fp256_div(fp256 *rem, fp256 *quo, const fp256 *num, const fp256 *div);


#ifdef  __cplusplus
}
#endif
