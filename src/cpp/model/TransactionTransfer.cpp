#include "TransactionTransfer.h"

TransactionTransfer::TransactionTransfer(const model::messages::gradido::Transfer& protoTransfer)
	: mProtoTransfer(protoTransfer)
{

}


int TransactionTransfer::prepare()
{
	
	return 0;
}