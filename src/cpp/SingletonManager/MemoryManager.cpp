#include "MemoryManager.h"
#include "ErrorManager.h"

#define _DEFAULT_PAGE_SIZE 10

MemoryBin::MemoryBin(Poco::UInt32 size)
	: mSize(size), mData(nullptr)
{
	mData = (unsigned char*)malloc(size);
}

MemoryBin::~MemoryBin()
{
	if (mData) {
		free(mData);
		mData = nullptr;
	}
}


// *************************************************************

MemoryPageStack::MemoryPageStack(Poco::UInt16 size)
	: mSize(size)
{
	mMemoryBinStack.push(new MemoryBin(size));
}

MemoryPageStack::~MemoryPageStack()
{
	lock();
	while (mMemoryBinStack.size() > 0) {
		MemoryBin* memoryBin = mMemoryBinStack.top();
		mMemoryBinStack.pop();
		delete memoryBin;
		
	}
	mSize = 0;
	unlock();
}

MemoryBin* MemoryPageStack::getFreeMemory()
{
	lock();
	if (!mSize) {
		unlock();
		return nullptr;
	}
	if (mMemoryBinStack.size() == 0) {
		unlock();
		return new MemoryBin(mSize);
	}
	MemoryBin* memoryBin = mMemoryBinStack.top();
	mMemoryBinStack.pop();
	unlock();
	return memoryBin;
}
void MemoryPageStack::releaseMemory(MemoryBin* memory)
{
	if (!memory) return;
	lock();
	if (memory->size() != mSize) {
		unlock();
		throw new Poco::Exception("MemoryPageStack::releaseMemory wron memory page stack");
	}
	mMemoryBinStack.push(memory);
	unlock();
}

// ***********************************************************************************

MemoryManager* MemoryManager::getInstance()
{
	static MemoryManager only;
	return &only;
}


MemoryManager::MemoryManager()
{
	mMemoryPageStacks[0] = new MemoryPageStack(32); // pubkey
	mMemoryPageStacks[1] = new MemoryPageStack(64); // privkey
	mMemoryPageStacks[2] = new MemoryPageStack(65); // pubkey hex
	mMemoryPageStacks[3] = new MemoryPageStack(96); // privkey encrypted
	mMemoryPageStacks[4] = new MemoryPageStack(161); // privkey hex 
	
}

MemoryManager::~MemoryManager()
{
	for (int i = 0; i < 5; i++) {
		delete mMemoryPageStacks[i];
	}
}

Poco::Int8 MemoryManager::getMemoryStackIndex(Poco::UInt16 size)
{
	switch (size) {
	case 32: return 0;
	case 64: return 1;
	case 65: return 2;
	case 96: return 3;
	case 161: return 4;
	default: return -1;
	}
	return -1;
}




MemoryBin* MemoryManager::getFreeMemory(Poco::UInt32 size)
{
	if (size != (Poco::UInt32)((Poco::UInt16)size)) {
		throw Poco::Exception("MemoryManager::getFreeMemory size is to large, only 16 Bit allowed");
	}
	auto index = getMemoryStackIndex(size);
	if (index < 0) {
		return new MemoryBin(size);
	}
	else {
		return mMemoryPageStacks[index]->getFreeMemory();
	}
	return nullptr;
}

void MemoryManager::releaseMemory(MemoryBin* memory)
{
	if (!memory) return;
	auto index = getMemoryStackIndex(memory->size());
	if (index < 0) {
		delete memory;
	}
	else {
		mMemoryPageStacks[index]->releaseMemory(memory);
	}
}
