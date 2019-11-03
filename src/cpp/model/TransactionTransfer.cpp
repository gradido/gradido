#include "TransactionTransfer.h"

TransactionTransfer::TransactionTransfer(const std::string& memo, const model::messages::gradido::Transfer& protoTransfer)
	: TransactionBase(memo), mProtoTransfer(protoTransfer)
{

}


int TransactionTransfer::prepare()
{
	
	return 0;
}
