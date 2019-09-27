
/*!
*
* \author: einhornimmond
*
* \date: 11.05.19
*
* \brief: mysql Table as array prepared for prepared statement (cache optimized)
*/

#ifndef DR_LUA_WEB_MODULE_STRUCTURES_MYSQL_MYSQL_TABLE_ARRAY__H
#define DR_LUA_WEB_MODULE_STRUCTURES_MYSQL_MYSQL_TABLE_ARRAY__H

#include <string.h>
#include "../Error/ErrorList.h"
#include "MysqlTable.h"

extern "C" {
#include "../import/lua/luaintf.h"
#include "../import/lua/lauxlib.h"
}


class MysqlTableArray : public ErrorList
{
public:
	MysqlTableArray(size_t fieldCount, size_t rowCount);
	~MysqlTableArray();

	bool setHeader(int index, const char* name, MysqlRowType type);
	MysqlRowType getRowType(int index);

	inline size_t getRowCount() const { return mRowCount; }
	inline size_t getFieldCount() const { return mFieldCount; }
	inline MysqlRowType getRowType(int fieldIndex) const {
		if (fieldIndex >= mFieldCount || fieldIndex < 0) return MYSQL_ROW_TYPE_NONE;
		return mHeader[fieldIndex].type;
	}

	inline bool setFieldValue(int fieldIndex, int rowIndex, const long& value) {
		if (checkIndexValid(fieldIndex, rowIndex, MYSQL_ROW_INT)) {
			auto dataArray = (long*)mDataBuffer[fieldIndex];
			dataArray[rowIndex] = value;
			return true;
		}
		return false;
	}
	inline bool setFieldValue(int fieldIndex, int rowIndex, const long long& value) {
		if (checkIndexValid(fieldIndex, rowIndex, MYSQL_ROW_LONG)) {
			auto dataArray = (long long*)mDataBuffer[fieldIndex];
			dataArray[rowIndex] = value;
			return true;
		}
		return false;
	}
	inline bool setFieldValue(int fieldIndex, int rowIndex, const char* value) {
		if (checkIndexValid(fieldIndex, rowIndex, MYSQL_ROW_STRING)) {
			auto dataArray = (std::string*)mDataBuffer[fieldIndex];
			dataArray[rowIndex] = value;
			return true;
		}
		return false;
	}
	inline bool setFieldValue(int fieldIndex, int rowIndex, const double& value) {
		if (checkIndexValid(fieldIndex, rowIndex, MYSQL_ROW_DECIMAL)) {
			auto dataArray = (double*)mDataBuffer[fieldIndex];
			dataArray[rowIndex] = value;
			return true;
		}
		return false;
	}

	inline long* getIntRow(int fieldIndex) {
		if (fieldIndex < 0 || fieldIndex >= mFieldCount || mHeader[fieldIndex].type != MYSQL_ROW_INT) {
			addError(new ParamError(__FUNCTION__, "invalid field index", fieldIndex));
			return nullptr;
		}
		return (long*)mDataBuffer[fieldIndex];
	}
	inline long long* getLongRow(int fieldIndex) {
		if (fieldIndex < 0 || fieldIndex >= mFieldCount || mHeader[fieldIndex].type != MYSQL_ROW_LONG) {
			addError(new ParamError(__FUNCTION__, "invalid field index", fieldIndex));
			return nullptr;
		}
		return (long long*)mDataBuffer[fieldIndex];
	}
	inline std::string* getStringRow(int fieldIndex) {
		if (fieldIndex < 0 || fieldIndex >= mFieldCount || mHeader[fieldIndex].type != MYSQL_ROW_STRING) {
			addError(new ParamError(__FUNCTION__, "invalid field index", fieldIndex));
			return nullptr;
		}
		return (std::string*)mDataBuffer[fieldIndex];
	}

	inline double* getDecimalRow(int fieldIndex) {
		if (fieldIndex < 0 || fieldIndex >= mFieldCount || mHeader[fieldIndex].type != MYSQL_ROW_DECIMAL) {
			addError(new ParamError(__FUNCTION__, "invalid field index", fieldIndex));
			return nullptr;
		}
		return (double*)mDataBuffer[fieldIndex];
	}


protected:
	bool checkIndexValid(int fieldIndex, int rowIndex, MysqlRowType type);

	size_t mFieldCount;
	size_t mRowCount;
	MysqlTableColumn* mHeader;
	void** mDataBuffer;
};


#endif //DR_LUA_WEB_MODULE_STRUCTURES_MYSQL_MYSQL_TABLE_ARRAY__H