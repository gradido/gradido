#ifndef GRADIDO_LOGIN_SERVER_CRYPTO_OBFUS_ARRAY
#define GRADIDO_LOGIN_SERVER_CRYPTO_OBFUS_ARRAY



class ObfusArray
{
public: 
	ObfusArray(size_t size, const unsigned char * data);
	~ObfusArray();

	operator const unsigned char*() {
		return &m_Data[m_offsetSize];
	}
	size_t size() {
		return m_dataSize;
	}

private:
	size_t m_arraySize;
	size_t m_offsetSize;
	size_t m_dataSize;
	unsigned char* m_Data;
};

#endif //GRADIDO_LOGIN_SERVER_CRYPTO_OBFUS_ARRAY