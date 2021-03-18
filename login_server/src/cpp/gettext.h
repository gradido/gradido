#ifndef __GETTEXT_HEADER_
#define __GETTEXT_HEADER_


#ifdef WIN32
#ifdef __cplusplus
extern "C" {
#endif

static inline const char *gettext (const char *__msgid)
{
  return __msgid;
}

#ifdef __cplusplus
}
#endif

#else 
	#include <libintl.h>
#endif


#endif 