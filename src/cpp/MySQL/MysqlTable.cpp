#include "MysqlTable.h"
#include "Poco/Mutex.h"
#include <time.h>

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
//using namespace Poco::Data::Keywords
// new Binding<T>(t, name, AbstractBinding::PD_IN);
int MysqlTable::connectToStatement(Poco::Data::Statement* stmt, int rowIndex/* = 0*/)
{
	std::string strCopy;
	for (auto itRow = mRows.begin(); itRow != mRows.end(); itRow++) {
		if (0 == rowIndex) {
			for (auto itCell = (*itRow)->begin(); itCell != (*itRow)->end(); itCell++) {
				switch ((*itCell)->getType()) {
				case MYSQL_ROW_STRING:
					strCopy = (const char*)(*itCell);
					stmt->bind(strCopy);
					break;
				case MYSQL_ROW_INT: stmt->bind((long)(*itCell)); break;
				case MYSQL_ROW_LONG: stmt->bind((long long)(*itCell)); break;
				case MYSQL_ROW_BINARY: 
					// Poco::Data::BLOB data(std::vector<unsigned char>({ '0', '0', '0', '0', '0', '0', '0', '0', '0', '0' }));
					Poco::Data::BLOB data((unsigned char*)(*itCell), (*itCell)->size());
					stmt->bind(data);
					break;
				}
			}
			break;
		}
		rowIndex--;
	}
	return 0;
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

time_t MysqlTable::parseFromMysqlDateTime(const char* mysql_date_time)
{
	
	struct tm * parsedTime;
	// used because localtime return an internal pointer, not thread safe
	static Poco::Mutex timeMutex;

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
