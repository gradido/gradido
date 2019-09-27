#include "MysqlTableArray.h"

MysqlTableArray::MysqlTableArray(size_t fieldCount, size_t rowCount)
	: mFieldCount(fieldCount), mRowCount(rowCount), mHeader(nullptr), mDataBuffer(nullptr)
{
	if (fieldCount < 150) {
		mHeader = new MysqlTableColumn[fieldCount];
		mDataBuffer = (void**)malloc(sizeof(void*) * fieldCount);
		memset(mDataBuffer, 0, sizeof(void*) * fieldCount);
	}
	else {
		addError(new Error(__FUNCTION__, "field count greater than 150"));
	}
}

MysqlTableArray::~MysqlTableArray()
{
	for (int i = 0; i < mFieldCount; i++) {
		if (mHeader[i].type == MYSQL_ROW_STRING) {
			std::string* strArray = (std::string*)mDataBuffer[i];
			delete[] strArray;
		}
		else {
			free(mDataBuffer[i]);
		}
	}
	free(mDataBuffer);
	mDataBuffer = nullptr;
	delete[] mHeader;
	mHeader = nullptr;
}

bool MysqlTableArray::setHeader(int index, const char* name, MysqlRowType type)
{
	if (index < 0 || index >= mFieldCount) {
		return false;
	}
	if (!mHeader) {
		return false;
	}

	mHeader[index].name = name;
	mHeader[index].type = type;

	auto fieldSize = MysqlTable::getFieldTypeSize(type);
	if (MYSQL_ROW_STRING == type) {
		if (mDataBuffer[index]) delete[] mDataBuffer[index];
		mDataBuffer[index] = new std::string[mRowCount];
	}
	else if (fieldSize) {
		if (mDataBuffer[index]) free(mDataBuffer[index]);
		mDataBuffer[index] = malloc(fieldSize * mRowCount);
		memset(mDataBuffer[index], 0, fieldSize * mRowCount);
	}
	else {
		addError(new ParamError(__FUNCTION__, "wrong type for MysqlTableArray: ", type));
		return false;
	}

	return true;
}

MysqlRowType MysqlTableArray::getRowType(int index)
{
	if (index < 0 || index >= mFieldCount) {
		addError(new ParamError(__FUNCTION__, "invalid index:", index));
		return MYSQL_ROW_TYPE_NONE;
	}
	if (!mHeader) {
		addError(new Error(__FUNCTION__, "error, header not allocated"));
		return MYSQL_ROW_TYPE_NONE;
	}
	return mHeader[index].type;
}

bool MysqlTableArray::checkIndexValid(int fieldIndex, int rowIndex, MysqlRowType type)
{
	if (fieldIndex < 0 || fieldIndex >= mFieldCount) {
		addError(new ParamError(__FUNCTION__, "error fieldIndex invalid:", fieldIndex));
		return false;
	}
	if (rowIndex < 0 || rowIndex >= mRowCount) {
		addError(new ParamError(__FUNCTION__, "error rowIndex invalid:", rowIndex));
		return false;
	}
	if (!mHeader || mHeader[fieldIndex].type != type) {
		addError(new ParamError(__FUNCTION__, "error wrong type:", type));
		return false;
	}
	if (!mDataBuffer[fieldIndex]) {
		addError(new Error(__FUNCTION__, "no memory allocated"));
		return false;
	}

	return true;

}