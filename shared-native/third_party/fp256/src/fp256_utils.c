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

#include <fp256/fp256.h>
//#include <fp256/fp256_ll.h>
//#include "ll/ll_local.h"

// copied from ll/ll_local.h
/* number of limbs of a(u64 array) */
# define LL_NUM_LIMBS(a, max, nlimbs) do { \
    size_t __n = max; \
    nlimbs = 0; \
 \
    while (__n > 0) { \
        __n--; \
        if (a[__n] > 0ULL) { \
            nlimbs = 1; \
            break; \
        } \
    } \
    nlimbs += __n; \
} while(0);


size_t fp256_num_limbs(const fp256 *a)
{
    size_t l;
    LL_NUM_LIMBS(a->d, 4, l);
    return l;
}

int fp256_set_limbs(fp256 *r, const u64 *limbs, size_t l)
{
    size_t i;

    if (l > FP256_LIMBS)
        return FP256_ERR;

    for (i = 0; i < l; i++)
        r->d[i] = limbs[i];
    for (i = l; i < FP256_LIMBS; i++)
        r->d[i] = 0ULL;

    r->nlimbs = fp256_num_limbs(r);
    return FP256_OK;
}
