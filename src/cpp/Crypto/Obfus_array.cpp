#include "Obfus_array.h"
#include <sodium.h>
#include <memory.h>
#include <math.h>
#include <assert.h>

ObfusArray::ObfusArray(size_t size, const unsigned char * data)
	: m_arraySize(0), m_offsetSize(0), m_dataSize(size), m_Data(nullptr)
{
	m_arraySize = size + 2 + randombytes_random() % (int)roundf(size*0.25f);
	m_Data = (unsigned char*)malloc(m_arraySize);
	
	m_offsetSize = randombytes_random() % (int)roundf((m_arraySize - m_dataSize) * 0.8f);

	printf("[ObfusArray::ObfusArray] array_size: %d, start by: %l, size: %ul, offset: %ul\n",
		m_arraySize, m_Data, size, m_offsetSize);

	assert(m_arraySize - m_offsetSize >= size);

	uint32_t* d = (uint32_t*)m_Data;
	size_t dMax = (size_t)floorf(m_arraySize / 4.0f);

	printf("d start by: %l, dMax: %ul", d, dMax);
	for (size_t i = 0; i < dMax; i++) {
		d[i] = randombytes_random();
	}
	for (size_t i = m_arraySize - 4; i < m_arraySize; i++) {
		m_Data[i] = (unsigned char)randombytes_random();
	}
	//d[m_arraySize - 4] = randombytes_random();

	memcpy(&m_Data[m_offsetSize], data, size);
	printf("[ObfusArray] data: %lld\n", (int64_t)m_Data);
}

/*
ObfusArray::ObfusArray(size_t size, const unsigned char * data)
	: m_arraySize(64), m_offsetSize(0), m_dataSize(size)
{
	memset(m_Data, 0, m_arraySize);
	memcpy(m_Data, data, size);
	//printf("[ObfusArray] data: %lld\n", (int64_t)m_Data);
}
*/
ObfusArray::~ObfusArray()
{
	
	printf("[ObfusArray::~ObfusArray] data: %lld\n", (int64_t)m_Data);
	if (m_Data) {
		
		free(m_Data);
		m_Data = nullptr;
	}
	printf("[ObfusArray::~ObfusArray] finish\n");
	
}