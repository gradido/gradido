#ifndef GRADIDO_LOGIN_SERVER_MODEL_INTERFACE_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_INTERFACE_INCLUDE

#include "Poco/Data/Session.h"

#include "../lib/MultithreadContainer.h"
#include "../tasks/CPUTask.h"

#include "../MySQL/MysqlTable.h"



class ModelBase : public UniLib::lib::MultithreadContainer, public ErrorList
{
public:
	ModelBase(int id) :mID(id), mReferenceCount(1) {}
	ModelBase() : mID(0), mReferenceCount(1) {}

	virtual const char* getTableName() = 0;
	virtual Poco::Data::Statement insertIntoDB(Poco::Data::Session session) = 0;
	virtual Poco::Data::Statement updateIntoDB(Poco::Data::Session session) = 0;
	virtual Poco::Data::Statement loadFromDB(Poco::Data::Session session, std::string& fieldName) = 0;
	virtual bool executeLoadFromDB(Poco::Data::Statement select) { return select.execute() == 1; };

	inline void setID(int id) { lock(); mID = id; unlock(); }
	inline int getID() { lock(); int id = mID; unlock(); return id; }

	static Poco::DateTime parseElopageDate(std::string dateString);

	// for poco auto ptr
	void duplicate();
	void release();
protected:
	int mID;

	// for poco auto ptr
	int mReferenceCount;
	
};

class ModelInsertTask : public UniLib::controller::CPUTask
{
public:
	ModelInsertTask(Poco::AutoPtr<ModelBase> model);

	int run();
	const char* getResourceType() const { return "ModelInsertTask"; };

protected:
	Poco::AutoPtr<ModelBase> mModel;

};

#endif //GRADIDO_LOGIN_SERVER_MODEL_INTERFACE_INCLUDE