#include "HederaTaskManager.h"

HederaTaskManager* HederaTaskManager::getInstance()
{
	static HederaTaskManager one;
	return &one;
}

HederaTaskManager::HederaTaskManager()
{

}

HederaTaskManager::~HederaTaskManager()
{
	
}