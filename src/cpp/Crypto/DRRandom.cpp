#include "DRRandom.h"
#include "Obfus_array.h"

/*    This program by D E Knuth is in the public domain and freely copyable.
 *    It is explained in Seminumerical Algorithms, 3rd edition, Section 3.6
 *    (or in the errata to the 2nd edition --- see
 *        http://www-cs-faculty.stanford.edu/~knuth/taocp.html
 *    in the changes to Volume 2 on pages 171 and following).              */

/*    N.B. The MODIFICATIONS introduced in the 9th printing (2002) are
      included here; there's no backwards compatibility with the original. */

/*    This version also adopts Brendan McKay's suggestion to
      accommodate naive users who forget to call ran_start(seed).          */

/*    If you find any bugs, please report them immediately to
 *                 taocp@cs.stanford.edu
 *    (and you will be rewarded if the bug is genuine). Thanks!            */

/************ see the book for explanations and caveats! *******************/
/************ in particular, you need two's complement arithmetic **********/
// Random-Array
#define KK 100                     /* the long lag */
#define LL  37                     /* the short lag */
#define MM (1L<<30)                 /* the modulus */
#define mod_diff(x,y) (((x)-(y))&(MM-1)) /* subtraction mod MM */
#define mod_sum(x,y) (((x)+(y))-(int)((x)+(y)))   /* (x+y) mod 1.0 */
#ifndef __STDC__
#define __STDC__
#endif

long ran_x[KK];                    /* the generator state */
double ran_u[KK];           /* the generator state */

#ifdef __STDC__
void ran_array(long aa[],int n)
#else
void ran_array(aa,n)    /* put n new random numbers in aa */
  long *aa;   /* destination */
  int n;      /* array length (must be at least KK) */
#endif
{
  register int i,j;
  DISASM_MISALIGN;
  for (j=0;j<KK;j++) aa[j]=ran_x[j];
  for (;j<n;j++) aa[j]=mod_diff(aa[j-KK],aa[j-LL]);
  for (i=0;i<LL;i++,j++) ran_x[i]=mod_diff(aa[j-KK],aa[j-LL]);
  for (;i<KK;i++,j++) ran_x[i]=mod_diff(aa[j-KK],ran_x[i-LL]);
}

/* the following routines are from exercise 3.6--15 */
/* after calling ran_start, get new randoms by, e.g., "x=ran_arr_next()" */

#define QUALITY 1009 /* recommended quality level for high-res use */
long ran_arr_buf[QUALITY];
long ran_arr_dummy=-1, ran_arr_started=-1;
long *ran_arr_ptr=&ran_arr_dummy; /* the next random number, or -1 */

#define TT  70   /* guaranteed separation between streams */
#define is_odd(x)  ((x)&1)          /* units bit of x */

#ifdef __STDC__
void ran_start(long seed)
#else
void ran_start(seed)    /* do this before using ran_array */
  long seed;            /* selector for different streams */
#endif
{
  register int t,j;
  long x[KK+KK-1];              /* the preparation buffer */
  register long ss=(seed+2)&(MM-2);
  for (j=0;j<KK;j++) {
    x[j]=ss;                      /* bootstrap the buffer */
    ss<<=1; if (ss>=MM) ss-=MM-2; /* cyclic shift 29 bits */
  }
  x[1]++;              /* make x[1] (and only x[1]) odd */
  for (ss=seed&(MM-1),t=TT-1; t; ) {       
    for (j=KK-1;j>0;j--) x[j+j]=x[j], x[j+j-1]=0; /* "square" */
    for (j=KK+KK-2;j>=KK;j--)
      x[j-(KK-LL)]=mod_diff(x[j-(KK-LL)],x[j]),
      x[j-KK]=mod_diff(x[j-KK],x[j]);
    if (is_odd(ss)) {              /* "multiply by z" */
      for (j=KK;j>0;j--)  x[j]=x[j-1];
      x[0]=x[KK];            /* shift the buffer cyclically */
      x[LL]=mod_diff(x[LL],x[KK]);
    }
    if (ss) ss>>=1; else t--;
  }
  DISASM_MISALIGN;
  for (j=0;j<LL;j++) ran_x[j+KK-LL]=x[j];
  for (;j<KK;j++) ran_x[j-LL]=x[j];
  for (j=0;j<10;j++) ran_array(x,KK+KK-1); /* warm things up */
  ran_arr_ptr=&ran_arr_started;
}

#define ran_arr_next() (*ran_arr_ptr>=0? *ran_arr_ptr++: ran_arr_cycle())
long ran_arr_cycle()
{
  if (ran_arr_ptr==&ran_arr_dummy)
    ran_start(314159L); /* the user forgot to initialize */
  ran_array(ran_arr_buf,QUALITY);
  ran_arr_buf[KK]=-1;
  ran_arr_ptr=ran_arr_buf+1;
  return ran_arr_buf[0];
}

// **************************************************************************************************************
// **************************************************************************************************************

// Random-Float Array

#ifdef __STDC__
void ranf_array(double aa[], int n)
#else
void ranf_array(aa,n)    /* put n new random fractions in aa */
  double *aa;   /* destination */
  int n;      /* array length (must be at least KK) */
#endif
{
  register int i,j;
  DISASM_MISALIGN;
  for (j=0;j<KK;j++) aa[j]=ran_u[j];
  for (;j<n;j++) aa[j]=mod_sum(aa[j-KK],aa[j-LL]);
  for (i=0;i<LL;i++,j++) ran_u[i]=mod_sum(aa[j-KK],aa[j-LL]);
  for (;i<KK;i++,j++) ran_u[i]=mod_sum(aa[j-KK],ran_u[i-LL]);
}
  
 /* the following routines are adapted from exercise 3.6--15 */
/* after calling ranf_start, get new randoms by, e.g., "x=ranf_arr_next()" */

//#define QUALITY 1009 /* recommended quality level for high-res use */
double ranf_arr_buf[QUALITY];
double ranf_arr_dummy=-1.0, ranf_arr_started=-1.0;
double *ranf_arr_ptr=&ranf_arr_dummy; /* the next random fraction, or -1 */

//#define TT  70   /* guaranteed separation between streams */
//#define is_odd(s) ((s)&1)

#ifdef __STDC__
void ranf_start(long seed)
#else
void ranf_start(seed)    /* do this before using ranf_array */
  long seed;            /* selector for different streams */
#endif
{
  register int t,s,j;
  double u[KK+KK-1];
  double ulp=(1.0/(1L<<30))/(1L<<22);               /* 2 to the -52 */
  double ss=2.0*ulp*((seed&0x3fffffff)+2);

  for (j=0;j<KK;j++) {
    u[j]=ss;                                /* bootstrap the buffer */
    ss+=ss; if (ss>=1.0) ss-=1.0-2*ulp;  /* cyclic shift of 51 bits */
  }
  u[1]+=ulp;                     /* make u[1] (and only u[1]) "odd" */
  for (s=seed&0x3fffffff,t=TT-1; t; ) {
    for (j=KK-1;j>0;j--)
      u[j+j]=u[j],u[j+j-1]=0.0;                         /* "square" */
    for (j=KK+KK-2;j>=KK;j--) {
      u[j-(KK-LL)]=mod_sum(u[j-(KK-LL)],u[j]);
      u[j-KK]=mod_sum(u[j-KK],u[j]);
    }
    if (is_odd(s)) {                             /* "multiply by z" */
      for (j=KK;j>0;j--) u[j]=u[j-1];
      u[0]=u[KK];                    /* shift the buffer cyclically */
      u[LL]=mod_sum(u[LL],u[KK]);
    }
    if (s) s>>=1; else t--;
  }
  for (j=0;j<LL;j++) ran_u[j+KK-LL]=u[j];
  for (;j<KK;j++) ran_u[j-LL]=u[j];
  for (j=0;j<10;j++) ranf_array(u,KK+KK-1);  /* warm things up */
  ranf_arr_ptr=&ranf_arr_started;
}

#define ranf_arr_next() (*ranf_arr_ptr>=0? *ranf_arr_ptr++: ranf_arr_cycle())
double ranf_arr_cycle()
{
  if (ranf_arr_ptr==&ranf_arr_dummy)
    ranf_start(314159L); /* the user forgot to initialize */
  ranf_array(ranf_arr_buf,QUALITY);
  ranf_arr_buf[KK]=-1;
  ranf_arr_ptr=ranf_arr_buf+1;
  return ranf_arr_buf[0];
}

// **************************************************************************************************************
// **************************************************************************************************************
#ifndef u32
typedef Poco::UInt32 u32;
typedef Poco::UInt32 uint;
#endif
// XORshift Quelle: http://de.wikipedia.org/wiki/Xorshift
u32 xorshift_x = 123456789;
u32 xorshift_y = 362436069;
u32 xorshift_z = 521288629;
u32 xorshift_w = 88675123;
u32 xorshift() 
{
    /* 32 Bit periodenlänge
    xorshiftSeed ^= xorshiftSeed << 13;
    xorshiftSeed ^= xorshiftSeed >> 17;
    xorshiftSeed ^= xorshiftSeed << 5;
    return xorshiftSeed;
     * */
    
    u32 t = xorshift_x ^ (xorshift_x << 11);
    xorshift_x = xorshift_y; xorshift_y = xorshift_z; xorshift_z = xorshift_w;
    xorshift_w ^= (xorshift_w >> 19) ^ t ^ (t >> 8);
 
    return xorshift_w;
}
void xorshift_seed(u32 seed)
{
    xorshift_x = seed;
    xorshift();
}

// **************************************************************************************************************
// **************************************************************************************************************

// static vars
long random_buffer[KK];
uint rand_buffer_cursor = KK;
double randomf_buffer[KK];
uint randf_buffer_cursor = KK;

//***************************************************************************************************************
void DRRandom::seed(long seed)
{
    //DRLog.writeToLog("[DRRandom::seed] seed reinit: %d\n", seed);
    ran_start(seed);
    xorshift_seed(seed); 
	DISASM_FALSERET;
    rand_buffer_cursor = KK;
    seedf(seed);
}

void DRRandom::seedf(long seed)
{
    ranf_start(seed);
    randf_buffer_cursor = KK;
}

long DRRandom::core2_rand()
{
   // return xorshift();
    if(rand_buffer_cursor >= KK)
    {
        rand_buffer_cursor = 0;
        ran_array(random_buffer, KK);
    }
	NULLPAD_10;
    return random_buffer[rand_buffer_cursor++];
}

double DRRandom::core2_randf()
{
    if(randf_buffer_cursor >= KK)
    {
        randf_buffer_cursor = 0;
        ranf_array(randomf_buffer, KK);
    }
    return randomf_buffer[randf_buffer_cursor++];
}

Poco::Int64 DRRandom::r64()
{
	Poco::Int64 r1 = core2_rand();
	Poco::Int64 r2 = core2_rand();///*0x00000000ffffffff &*/ (core2_rand() << 8);
    //u64 r12 = r1 | (r2 << 8);
    //printf("r1: %lld, %llx, r2: %lld, %llx, r1|2: %lld, %llx\n", r1, r1, r2, r2, r12, r12);
	DISASM_FALSERET;
    return r1 | (r2 << 8);
}
double DRRandom::rDouble(double max, double min)
{
    double value = core2_randf();
    //printf("rDouble: %f\n", value);
    return min + (max - min) * value;     
}

int DRRandom::rInt(int max, int min)
{
    return min + (core2_rand() % (max-min+1));
}