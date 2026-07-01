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

// copied from ll/local.h
/* very very very slow multiplication */
# define LL_MUL64(rh, rl, a, b) do { \
    u64 __t1, __t2, __ah, __al, __bh, __bl; \
    __ah = (a) >> 32; \
    __al = (a) & 0xffffffffULL; \
    __bh = (b) >> 32; \
    __bl = (b) & 0xffffffffULL; \
    __t1 = __al * __bh; \
    __t2 = __ah * __bl; \
    (rl) = __al * __bl; \
    (rh) = __ah * __bh; \
    __t1 += ((rl) >> 32); \
    (rl) &= 0xffffffffULL; \
    __t1 += __t2; \
    if (__t1 < __t2) \
        (rh) += 0x100000000ULL; \
    (rl) |= (__t1 << 32); \
    (rh) += (__t1 >> 32); \
} while(0);

// copied from ll/ll_u256_mul.c
void ll_u256_mul(u64 rd[8], const u64 ad[4], const u64 bd[4])
{
    u64 hi, lo, t;
    u64 a0, a1, a2, a3;
    u64 b;
    u64 r0, r1, r2, r3;

    a0 = ad[0]; a1 = ad[1]; a2 = ad[2]; a3 = ad[3];

    /* ad * bd[0] */
    b = bd[0];
    LL_MUL64(hi, lo, a0, b);
    rd[0] = lo;

    LL_MUL64(t, r1, a1, b);
    r1 += hi;
    t += (r1 < hi);

    LL_MUL64(hi, r2, a2, b);
    r2 += t;
    hi += (r2 < t);

    LL_MUL64(r0, r3, a3, b);
    r3 += hi;
    r0 += (r3 < hi);

    /* + ad * bd[1] */
    b = bd[1];
    LL_MUL64(hi, lo, a0, b);
    r1 += lo;
    hi += (r1 < lo);
    rd[1] = r1;

    LL_MUL64(t, lo, a1, b);
    r2 += hi;
    t += (r2 < hi);
    r2 += lo;
    t += (r2 < lo);

    LL_MUL64(hi, lo, a2, b);
    r3 += t;
    hi += (r3 < t);
    r3 += lo;
    hi += (r3 < lo);

    LL_MUL64(r1, lo, a3, b);
    r0 += hi;
    r1 += (r0 < hi);
    r0 += lo;
    r1 += (r0 < lo);

    /* + ad * bd[2] */
    b = bd[2];
    LL_MUL64(hi, lo, a0, b);
    r2 += lo;
    hi += (r2 < lo);
    rd[2] = r2;

    LL_MUL64(t, lo, a1, b);
    r3 += hi;
    t += (r3 < hi);
    r3 += lo;
    t += (r3 < lo);

    LL_MUL64(hi, lo, a2, b);
    r0 += t;
    hi += (r0 < t);
    r0 += lo;
    hi += (r0 < lo);

    LL_MUL64(r2, lo, a3, b);
    r1 += hi;
    r2 += (r1 < hi);
    r1 += lo;
    r2 += (r1 < lo);

    /* + ad * bd[3] */
    b = bd[3];
    LL_MUL64(hi, lo, a0, b);
    r3 += lo;
    hi += (r3 < lo);
    rd[3] = r3;

    LL_MUL64(t, lo, a1, b);
    r0 += hi;
    t += (r0 < hi);
    r0 += lo;
    t += (r0 < lo);

    LL_MUL64(hi, lo, a2, b);
    r1 += t;
    hi += (r1 < t);
    r1 += lo;
    hi += (r1 < lo);

    LL_MUL64(r3, lo, a3, b);
    r2 += hi;
    r3 += (r2 < hi);
    r2 += lo;
    r3 += (r2 < lo);

    rd[4] = r0;
    rd[5] = r1;
    rd[6] = r2;
    rd[7] = r3;

    return;
}

/* rhi:rlo = a * b */
int fp256_mul(fp256 *rhi, fp256 *rlo, const fp256 *a, const fp256 *b)
{
    u64 rd[8];

    if (rhi == NULL || rlo == NULL || a == NULL || b == NULL)
        return FP256_ERR;

    ll_u256_mul(rd, a->d, b->d);

    fp256_set_limbs(rlo, rd, FP256_LIMBS);
    fp256_set_limbs(rhi, rd + 4, FP256_LIMBS);
    return FP256_OK;
}
