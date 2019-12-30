#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_CONTROLLER_BASE_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_CONTROLLER_BASE_INCLUDE

#include "../lib/MultithreadContainer.h"
#include "Poco/AutoPtr.h"
#include "../model/table/ModelBase.h"

namespace controller {
	class TableControllerBase : protected UniLib::lib::MultithreadContainer
	{
	public:
		TableControllerBase();
		virtual ~TableControllerBase();

		

		// for poco auto ptr
		void duplicate();
		void release();
	protected:

		template<class T>
		Poco::AutoPtr<T> _getModel();

		// for poco auto ptr
		int mReferenceCount;

		// 
		Poco::AutoPtr <model::table::ModelBase> mDBModel;
	};

	// ******  template function declarations ***************

	template<class T>
	Poco::AutoPtr<T> TableControllerBase::_getModel() {
		// TODO: Maybe update name for error search
		lock("TableControllerBase::getModel");
		T* result = static_cast<T*>(mDBModel.get());
		unlock();
		return Poco::AutoPtr<T>(result, true);
	}

}

#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_CONTROLLER_BASE_INCLUDE