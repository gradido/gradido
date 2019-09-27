
/*!
*
* \author: einhornimmond
*
* \date: 04.04.19
*
* \brief: Config Basic Structure
*/

#ifndef DR_LUA_WEB_MODULE_STRUCTURES_MYSQL_QUERY_RESULT__H
#define DR_LUA_WEB_MODULE_STRUCTURES_MYSQL_QUERY_RESULT__H

#include <list>
#include <string.h>
#include "../Error/ErrorList.h"
#include "mysql.h"

extern "C" {
#include "../import/lua/luaintf.h"
#include "../import/lua/lauxlib.h"
}


enum MysqlRowType {
	MYSQL_ROW_STRING,
	MYSQL_ROW_INT, // 32 Bit
	MYSQL_ROW_LONG, // 64 Bit
	MYSQL_ROW_DECIMAL, // double
	MYSQL_ROW_TIMESTAMP,
	MYSQL_ROW_DATETIME,
	MYSQL_ROW_NULL,
	MYSQL_ROW_TYPE_COUNT,
	MYSQL_ROW_TYPE_NONE
};

struct MysqlTableColumn
{
	MysqlTableColumn()
		: type(MYSQL_ROW_NULL), name("null") {}
	MysqlRowType type;
	std::string name;
};

class MysqlTableCell
{
public:
	MysqlTableCell(MysqlRowType type = MYSQL_ROW_NULL) : mType(type) {}

	inline bool isString() const { return mType == MYSQL_ROW_STRING; }
	inline bool isInt()  const { return mType == MYSQL_ROW_INT; }
	inline bool isLong() const { return mType == MYSQL_ROW_LONG;  }
	inline bool isDateTime() const { return mType == MYSQL_ROW_DATETIME; }
	inline bool isNull() const { return mType == MYSQL_ROW_NULL; }
	inline bool isDecimal() const { return mType == MYSQL_ROW_DECIMAL;  }
	inline MysqlRowType getType() const { return mType; }

	virtual operator const char*() const { return ""; }
	virtual operator long() const { return 0; }
	virtual operator long long() const { return 0; }
	
protected:
	MysqlRowType mType;
};

class MysqlTableCellString : public MysqlTableCell
{
public: 
	MysqlTableCellString(const char* content) : MysqlTableCell(MYSQL_ROW_STRING), mContent(content) {}
	MysqlTableCellString(const char* content, size_t count) : MysqlTableCell(MYSQL_ROW_STRING), mContent(content, count) {}


	virtual operator const char*() const { return mContent.data(); }
protected:
	std::string mContent;
};

class MysqlTableCellInt : public MysqlTableCell
{
public:
	MysqlTableCellInt(long value) : MysqlTableCell(MYSQL_ROW_INT), mContent(value) {}

	virtual operator long() const { return mContent; }
protected:
	long mContent;
};

class MysqlTableCellLong : public MysqlTableCell
{
public:
	MysqlTableCellLong(const long long& value) : MysqlTableCell(MYSQL_ROW_LONG), mContent(value) {}

	virtual operator long long() const { return mContent; }

protected: 
	long long mContent;
};

class MysqlTableCellTimestamp : public MysqlTableCell
{
public: 
	MysqlTableCellTimestamp(const time_t& timestamp) : MysqlTableCell(MYSQL_ROW_TIMESTAMP), mTimestamp(timestamp) {}

protected:
	time_t mTimestamp;
};

class MysqlTableCellDateTime : public MysqlTableCell
{
public:
	MysqlTableCellDateTime(const MYSQL_TIME& mysql_time) : MysqlTableCell(MYSQL_ROW_DATETIME), mMysqlTime(mysql_time) {}

protected:
	MYSQL_TIME mMysqlTime;
};

class MysqlTableCellDecimal : public MysqlTableCell
{
public:
	MysqlTableCellDecimal(const double& value) : MysqlTableCell(MYSQL_ROW_DECIMAL), mDecimal(value) {}

protected:
	double mDecimal;
};


class MysqlTable : public ErrorList
{
public: 
	MysqlTable(size_t fieldCount);
	~MysqlTable();

	bool setHeader(int index, const char* name, MysqlRowType type);
	inline MysqlRowType getHeaderType(int index) {
		if (index > 0 && index < mFieldCount) {
			return mHeader[index].type;
		}
		addError(new ParamError(__FUNCTION__, "invalid field index:", index));
		return MYSQL_ROW_TYPE_NONE;
	}
	inline bool addCellToCurrentRow(long value) { return addCellToCurrentRow(new MysqlTableCellInt(value)); }
	inline bool addCellToCurrentRow(const long long& value) { return addCellToCurrentRow(new MysqlTableCellLong(value)); }
	inline bool addCellToCurrentRow(const char* string) { return addCellToCurrentRow(new MysqlTableCellString(string)); }
	inline bool addCellToCurrentRow(const double& value) { return addCellToCurrentRow(new MysqlTableCellDecimal(value)); }
	inline bool addCellToCurrentRowTime(const time_t& time) { return addCellToCurrentRow(new MysqlTableCellTimestamp(time)); }
	inline bool addCellToCurrentRow() { return addCellToCurrentRow(new MysqlTableCell); }
	bool addCellToCurrentRow(MYSQL_BIND* bind);

	//bool copyColumnValues()

	//! \brief free memory after not longer using it
	bool addCellToCurrentRow(MysqlTableCell* cell);
	inline void addRow() { mRows.push_back(new std::list<MysqlTableCell*>); }
	inline size_t getRowCount() const { return mRows.size(); }
	inline size_t getFieldCount() const { return mFieldCount; }
	inline MysqlRowType getRowType(int fieldIndex) const {
		if (fieldIndex >= mFieldCount || fieldIndex < 0) return MYSQL_ROW_TYPE_NONE;
		return mHeader[fieldIndex].type;
	}
	/// move to ParseMysqlTable
	bool writeAsTableOntoLuaStack(lua_State* l);

	static size_t getFieldTypeSize(MysqlRowType type);

	static time_t parseFromMysqlDateTime(const char* mysql_date_time);

protected:
	size_t mFieldCount;
	MysqlTableColumn* mHeader;
	std::list<std::list<MysqlTableCell*>*> mRows;
};


#endif //DR_LUA_WEB_MODULE_STRUCTURES_MYSQL_QUERY_RESULT__H