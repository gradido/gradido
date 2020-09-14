#ifndef __GRADIDO_LOGIN_SINGLETON_MANAGER_HEDERA_TASK_MANAGER_H
#define __GRADIDO_LOGIN_SINGLETON_MANAGER_HEDERA_TASK_MANAGER_H

/*!
 * @author: Dario Rekowski
 * 
 * @date: 11.09.2020
 *
 * @brief: Manage Hedera Task, waiting on Consensus for Hedera Transactions 
 *
*/

class HederaTaskManager
{
public:
	~HederaTaskManager();

	static HederaTaskManager* getInstance();
protected:
	HederaTaskManager();
};

#endif //__GRADIDO_LOGIN_SINGLETON_MANAGER_HEDERA_TASK_MANAGER_H