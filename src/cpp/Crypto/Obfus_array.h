#ifndef GRADIDO_LOGIN_SERVER_CRYPTO_OBFUS_ARRAY
#define GRADIDO_LOGIN_SERVER_CRYPTO_OBFUS_ARRAY

#include <stdio.h>

class ObfusArray
{
public: 
	ObfusArray(size_t size, const unsigned char * data);
	~ObfusArray();

	inline operator const unsigned char*() const {return &m_Data[m_offsetSize];}

	inline size_t size() const { return m_dataSize;}

private:
	size_t m_arraySize;
	size_t m_offsetSize;
	size_t m_dataSize;
	unsigned char* m_Data;
};

#endif //GRADIDO_LOGIN_SERVER_CRYPTO_OBFUS_ARRAY