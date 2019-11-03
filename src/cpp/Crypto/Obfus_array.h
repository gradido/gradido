#ifndef GRADIDO_LOGIN_SERVER_CRYPTO_OBFUS_ARRAY
#define GRADIDO_LOGIN_SERVER_CRYPTO_OBFUS_ARRAY

#include <stdio.h>
#include "Poco/Types.h"

#ifdef _ENABLE_ASSEMBLER_OBFUS //_MSC_VER 
// Quelle: https://mycomputersciencebooks.files.wordpress.com/2017/08/secure-programming-in-c-and-c.pdf
// Kapitel 12.16
#define NULLPAD_START __asm  {
	pushl %eax
	movl  %esp, %eax
}
#define NULLPAD       __asm  {
	addb  %al, (%eax)
}
#define NULLPAD_END   __asm  {
	popl  %eax
}
#define NULLPAD_10    NULLPAD_START; NULLPAD;  NULLPAD;  NULLPAD;  NULLPAD;  NULLPAD; NULLPAD_END


#define DISASM_MISALIGN __asm __volatile ( \
       "  pushl %eax       \n"        \
       "  cmpl  %eax, %eax \n"        \
       "  jz    0f         \n"        \
       "  .byte 0x0F       \n"        \
       "0:                 \n"        \
       "  popl  %eax       \n")

#define DISASM_FALSERET __asm __volatile (               \
       "  pushl %ecx        /* save registers    */\n" \
       "  pushl %ebx                               \n" \
       "  pushl %edx                               \n" \
       "  movl  %esp, %ebx  /* save ebp, esp     */\n" \
       "  movl  %ebp, %esp                         \n" \
       "  popl  %ebp        /* save old %ebp     */\n" \
       "  popl  %ecx        /* save return addr  */\n" \
       "  lea   0f, %edx    /* edx = addr of 0:  */\n" \
       "  pushl %edx        /* return addr = edx */\n" \
       "  ret                                      \n" \
		"  .byte 0x0F        /* off-by-one byte   */\n" \
		"0:                                         \n" \
		"  pushl %ecx        /* restore ret addr  */\n" \
		"  pushl %ebp        /* restore old &ebp  */\n" \
		"  movl  %esp, %ebp  /* restore ebp, esp  */\n" \
		"  movl  %ebx, %esp                         \n" \
		"  popl  %ebx                               \n" \
		"  popl  %ecx                               \n")
#else 
#define NULLPAD_10
#define DISASM_MISALIGN
#define DISASM_FALSERET
#endif

class ObfusArray
{
public: 
	ObfusArray(size_t size, const unsigned char * data);
	ObfusArray(size_t size);
	~ObfusArray();

	inline operator const unsigned char*() const {return &m_Data[m_offsetSize];}
	inline operator unsigned char*() { return &m_Data[m_offsetSize]; }

	inline size_t size() const { return m_dataSize;}

	void put(size_t i, Poco::UInt64 value);

private:
	size_t m_arraySize;
	size_t m_offsetSize;
	size_t m_dataSize;
	unsigned char* m_Data;
	//unsigned char m_Data[64];
};

#endif //GRADIDO_LOGIN_SERVER_CRYPTO_OBFUS_ARRAY