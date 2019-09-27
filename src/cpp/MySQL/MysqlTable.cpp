#include "MysqlTable.h"
#include <time.h>
#include <mutex>

MysqlTable::MysqlTable(size_t fieldCount)
	: mFieldCount(fieldCount), mHeader(nullptr)
{
	mHeader = new MysqlTableColumn[fieldCount];
}

MysqlTable::~MysqlTable()
{
	if (mHeader) {
		delete[] mHeader;
		mHeader = nullptr;
	}
	for (auto it = mRows.begin(); it != mRows.end(); it++) {
		for (auto sub_it = (*it)->begin(); sub_it != (*it)->end(); sub_it++) {
			delete *sub_it;
		}
		delete *it;
	}
	mRows.clear();
}

bool MysqlTable::setHeader(int index, const char* name, MysqlRowType type)
{
	if (index < 0 || index >= mFieldCount) {
		return false;
	}
	if (!mHeader) {
		return false;
	}

	mHeader[index].name = name;
	mHeader[index].type = type;

	return true;
}

bool MysqlTable::addCellToCurrentRow(MysqlTableCell* cell)
{

	if (!cell) {
		addError(new Error(__FUNCTION__, "zero pointer"));
		return false;
	}

	if (mRows.size() == 0) {
		addError(new Error(__FUNCTION__, "row container is empty"));
		return false;
	}

	auto last_row = mRows.back();
	auto fieldIndex = last_row->size();
	if (fieldIndex >= mFieldCount) {
		addError(new Error(__FUNCTION__, "invalid Cell count"));
		delete cell;
		return false;
	}
	if (cell->getType() != MYSQL_ROW_NULL && cell->getType() != mHeader[fieldIndex].type) {
		addError(new Error(__FUNCTION__, "field type mismatch"));
		delete cell;
		return false;
	}

	last_row->push_back(cell);

	return true;
}

size_t MysqlTable::getFieldTypeSize(MysqlRowType type)
{
	switch (type) {
	case MYSQL_ROW_DECIMAL: return sizeof(double);
	case MYSQL_ROW_INT: return sizeof(long);
	case MYSQL_ROW_LONG: return sizeof(long long);
	case MYSQL_ROW_STRING: return sizeof(std::string);
	}
	return 0;
}

bool MysqlTable::addCellToCurrentRow(MYSQL_BIND* bind)
{
	if (!bind) {
		addError(new Error(__FUNCTION__, "bind is null"));
		return false;
	}
	/*
		SQL Type of Received Value 	buffer_type Value 	Output Variable C Type
		TINYINT 	MYSQL_TYPE_TINY 	signed char
		SMALLINT 	MYSQL_TYPE_SHORT 	short int
		MEDIUMINT 	MYSQL_TYPE_INT24 	int
		INT 	MYSQL_TYPE_LONG 	int
		BIGINT 	MYSQL_TYPE_LONGLONG 	long long int
		FLOAT 	MYSQL_TYPE_FLOAT 	float
		DOUBLE 	MYSQL_TYPE_DOUBLE 	double
		DECIMAL 	MYSQL_TYPE_NEWDECIMAL 	char[]
		YEAR 	MYSQL_TYPE_SHORT 	short int
		TIME 	MYSQL_TYPE_TIME 	MYSQL_TIME
		DATE 	MYSQL_TYPE_DATE 	MYSQL_TIME
		DATETIME 	MYSQL_TYPE_DATETIME 	MYSQL_TIME
		TIMESTAMP 	MYSQL_TYPE_TIMESTAMP 	MYSQL_TIME
		CHAR, BINARY 	MYSQL_TYPE_STRING 	char[]
		VARCHAR, VARBINARY 	MYSQL_TYPE_VAR_STRING 	char[]
		TINYBLOB, TINYTEXT 	MYSQL_TYPE_TINY_BLOB 	char[]
		BLOB, TEXT 	MYSQL_TYPE_BLOB 	char[]
		MEDIUMBLOB, MEDIUMTEXT 	MYSQL_TYPE_MEDIUM_BLOB 	char[]
		LONGBLOB, LONGTEXT 	MYSQL_TYPE_LONG_BLOB 	char[]
		BIT 	MYSQL_TYPE_BIT 	char[]
	*/
	signed char* b = nullptr;
	short* s = nullptr;
	int* i = nullptr;
	long long* ll = nullptr;
	float* f = nullptr;
	double* d = nullptr;
	char* c_str = nullptr;
	MYSQL_TIME* time = nullptr;

	switch (bind->buffer_type) {
	case MYSQL_TYPE_TINY: 
		b = (signed char*)bind->buffer;
		addCellToCurrentRow((long)b[0]);
		break;
	case MYSQL_TYPE_SHORT: 
		s = (short*)bind->buffer;
		addCellToCurrentRow((long)s[0]);
		break;
	case MYSQL_TYPE_INT24:
	case MYSQL_TYPE_LONG:
		i = (int*)bind->buffer;
		addCellToCurrentRow((long)i[0]);
		break;
	case MYSQL_TYPE_LONGLONG:
		ll = (long long*)bind->buffer;
		addCellToCurrentRow(ll[0]);
		break;
	case MYSQL_TYPE_FLOAT:
		f = (float*)bind->buffer;
		addCellToCurrentRow((double)f[0]);
		break;
	case MYSQL_TYPE_DOUBLE:
		d = (double*)bind->buffer;
		addCellToCurrentRow(d[0]);
		break;
	case MYSQL_TYPE_NEWDECIMAL:
	case MYSQL_TYPE_STRING:
	case MYSQL_TYPE_VAR_STRING:
	case MYSQL_TYPE_TINY_BLOB:
	case MYSQL_TYPE_BLOB:
	case MYSQL_TYPE_MEDIUM_BLOB:
	case MYSQL_TYPE_LONG_BLOB:
	case MYSQL_TYPE_BIT:
		c_str = (char*)bind->buffer;
		addCellToCurrentRow(new MysqlTableCellString(c_str, bind->buffer_length));
		break;
	case MYSQL_TYPE_TIME:
	case MYSQL_TYPE_DATE:
	case MYSQL_TYPE_DATETIME:
	case MYSQL_TYPE_TIMESTAMP:
		time = (MYSQL_TIME*)bind->buffer;
		addCellToCurrentRow(new MysqlTableCellDateTime(time[0]));
		break;
	default:
		addError(new ParamError(__FUNCTION__, "unhandled mysql buffer type", bind->buffer_type));
		return false;
	}
	
	return true;

}


time_t MysqlTable::parseFromMysqlDateTime(const char* mysql_date_time)
{
	
	struct tm * parsedTime;
	// used because localtime return an internal pointer, not thread safe
	static std::mutex timeMutex;

	int year, month, day, hour, minute, second;
	// ex: 2009-10-29 
	if (sscanf(mysql_date_time, "%d-%d-%d %d:%d:%d", &year, &month, &day, &hour, &minute, &second) != EOF) {
		time_t rawTime;
		time(&rawTime);

		// static, used for every thread
		timeMutex.lock();
		parsedTime = localtime(&rawTime);

		// tm_year is years since 1900
		parsedTime->tm_year = year - 1900;
		// tm_months is months since january
		parsedTime->tm_mon = month - 1;
		parsedTime->tm_mday = day;
		parsedTime->tm_hour = hour;
		parsedTime->tm_min = minute;
		parsedTime->tm_sec = second;

		rawTime = mktime(parsedTime);
		timeMutex.unlock();

		return rawTime;
	}
	return 0;
}

bool MysqlTable::writeAsTableOntoLuaStack(lua_State* l)
{
	/*
	* http://lua-users.org/wiki/SimpleLuaApiExample
	* Ok, now here we go: We pass data to the lua script on the stack.
	* That is, we first have to prepare Lua's virtual stack the way we
	* want the script to receive it, then ask Lua to run it.
	*/
	lua_newtable(l);    /* We will pass a table */

	/*
	* To put values into the table, we first push the index, then the
	* value, and then call lua_rawset() with the index of the table in the
	* stack. Let's see why it's -3: In Lua, the value -1 always refers to
	* the top of the stack. When you create the table with lua_newtable(),
	* the table gets pushed into the top of the stack. When you push the
	* index and then the cell value, the stack looks like:
	*
	* <- [stack bottom] -- table, index, value [top]
	*
	* So the -1 will refer to the cell value, thus -3 is used to refer to
	* the table itself. Note that lua_rawset() pops the two last elements
	* of the stack, so that after it has been called, the table is at the
	* top of the stack.
	*/

	/*	
	 * for (i = 1; i <= 5; i++) {
	 *  lua_pushnumber(L, i);   // Push the table index 
	 *  lua_pushnumber(L, i * 2); // Push the cell value 
	 *  lua_rawset(L, -3);      // Stores the pair in the table 
     *}
	*/
	for (auto it = mRows.begin(); it != mRows.end(); it++) {

	}
	return false;

}