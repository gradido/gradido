#include "TransactionTransfer.h"

const std::string TransactionTransfer::mInvalidIndexMessage("invalid index");

TransactionTransfer::KontoTableEntry::KontoTableEntry(model::table::User* user, google::protobuf::int64 amount, bool negativeAmount/* = false*/)
{
	//<span class="content-cell">Normaler&nbsp;User&nbsp;&lt;info@software-labor.de&gt;</span>
	if (!user) return;

	composeAmountCellString(amount, negativeAmount);

	/*kontoNameCell = "<td>";
	kontoNameCell += user->getFirstName();
	kontoNameCell += "&nbsp;";
	kontoNameCell += user->getLastName();
	kontoNameCell += "&nbsp;&lt;";
	kontoNameCell += user->getEmail();
	kontoNameCell += "&gt;</td>";*/
	kontoNameCell = "<span class=\"content-cell\">";
	kontoNameCell += user->getNameWithEmailHtml();
	kontoNameCell += "</span>";
}

TransactionTransfer::KontoTableEntry::KontoTableEntry(const std::string& pubkeyHex, google::protobuf::int64 amount, bool negativeAmount/* = false*/)
{
	composeAmountCellString(amount, negativeAmount);
	//kontoNameCell = "<td class=\"small\">0x" + pubkeyHex + "</td>";
	kontoNameCell = "<span class = \"content-cell\">" + pubkeyHex + "</span>";
}

void TransactionTransfer::KontoTableEntry::composeAmountCellString(google::protobuf::int64 amount, bool negativeAmount)
{
	//<span class="content-cell alert-color">-10 GDD</span>
	//<span class="content-cell success-color">10 GDD</span>
	amountCell = "<span class=\"content-cell ";
	if (negativeAmount) {
		amountCell += "alert-color\">-";
	}
	else {
		amountCell += "success-color\">";
	}
	amountCell += amountToString(amount);
	//amountCell += " GDD</td>";
	amountCell += " GDD</span>";
}

// ********************************************************************************************************************************

//TransactionTransfer::TransactionTransfer(const std::string& memo, const model::messages::gradido::Transfer& protoTransfer)
TransactionTransfer::TransactionTransfer(const std::string& memo, const proto::gradido::GradidoTransfer& protoTransfer)
	: TransactionBase(memo), mProtoTransfer(protoTransfer)
{

}

TransactionTransfer::~TransactionTransfer()
{
	mKontoTable.clear();
}

int TransactionTransfer::prepare()
{
	lock();
	const static char functionName[] = { "TransactionTransfer::prepare" };

	mKontoTable.reserve(2);

	//auto receiverAmount = mProtoTransfer.receiveramount();
	//auto senderAmount

	char pubkeyHexTemp[65];

	/*
	if (mProtoTransfer.has_local())
	{
		auto local_transfer = mProtoTransfer.local();
		auto sender = local_transfer.sender();
		auto sender_pubkey = sender.pubkey();
		auto receiver_pubkey = local_transfer.receiver();
		auto amount = sender.amount();
		auto sender_user = controller::User::create();
		auto receiver_user = controller::User::create();

		if (!sender_user->load((const unsigned char*)sender_pubkey.data())) {
			sodium_bin2hex(pubkeyHexTemp, 65, (const unsigned char*)sender_pubkey.data(), sender_pubkey.size());
			mKontoTable.push_back(KontoTableEntry(pubkeyHexTemp, -amount, true));
		}
		else {
			mKontoTable.push_back(KontoTableEntry(sender_user->getModel(), -amount, true));
		}

		if (!receiver_user->load((const unsigned char*)receiver_pubkey.data())) {
			sodium_bin2hex(pubkeyHexTemp, 65, (const unsigned char*)receiver_pubkey.data(), receiver_pubkey.size());
			mKontoTable.push_back(KontoTableEntry(pubkeyHexTemp, amount, true));
		}
		else {
			mKontoTable.push_back(KontoTableEntry(sender_user->getModel(), amount, true));
		}
	}
	*/
	for (int i = 0; i < mProtoTransfer.senderamounts_size(); i++) {
		auto senderAmount = mProtoTransfer.senderamounts(i);
		auto pubkey = senderAmount.ed25519_sender_pubkey();
		senderSum += senderAmount.amount();
		if (pubkey.size() != 32) {
			addError(new ParamError(functionName, "invalid public key for sender ", i));
			unlock();
			return -3;
		}
		//User user((const unsigned char*)pubkey.data());
		auto user = controller::User::create();
		if (!user->load((const unsigned char*)pubkey.data())) {
			sodium_bin2hex(pubkeyHexTemp, 65, (const unsigned char*)pubkey.data(), pubkey.size());
			mKontoTable.push_back(KontoTableEntry(pubkeyHexTemp, senderAmount.amount(), true));
		}
		else {
			mKontoTable.push_back(KontoTableEntry(sender_user->getModel(), -amount, true));
		}

		if (!receiver_user->load((const unsigned char*)receiver_pubkey.data())) {
			sodium_bin2hex(pubkeyHexTemp, 65, (const unsigned char*)receiver_pubkey.data(), receiver_pubkey.size());
			mKontoTable.push_back(KontoTableEntry(pubkeyHexTemp, amount, true));
		}
		else {
			mKontoTable.push_back(KontoTableEntry(sender_user->getModel(), amount, true));
		}
	}
	if (senderSum != receiverSum) {
		addError(new Error(functionName, "sender amounts sum != receiver amounts sum"));
		unlock();
		return -5;
	}
	if (senderSum < 0) {
		addError(new Error(functionName, "negative amount not supported"));
		unlock();
		return -6;
	}


	/*
	mReceiverUser = new User(receiverPublic.data());
	getErrors(mReceiverUser);
	if (mReceiverUser->getUserState() == USER_EMPTY) {
		sodium_bin2hex(mReceiverPublicHex, 65, (const unsigned char*)receiverPublic.data(), receiverPublic.size());
		delete mReceiverUser;
		mReceiverUser = nullptr;
	}
	else {
		memcpy(mReceiverPublicHex, mReceiverUser->getPublicKeyHex().data(), 64);
	}
	//*/

	unlock();
	return 0;
}

const std::string& TransactionTransfer::getKontoNameCell(int index)
{
	
	lock();
	if (index >= mKontoTable.size()) {
		unlock();
		return mInvalidIndexMessage;
	}
	unlock();

	return mKontoTable[index].kontoNameCell;
}

const std::string& TransactionTransfer::getAmountCell(int index)
{
	lock();
	if (index >= mKontoTable.size()) {
		unlock();
		return mInvalidIndexMessage;
	}
	unlock();

	return mKontoTable[index].amountCell;
}
