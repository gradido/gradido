#include "TransactionTransfer.h"
#include "Transaction.h"

namespace model {
	namespace gradido {

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
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			const static char functionName[] = { "TransactionTransfer::prepare" };

			mKontoTable.reserve(2);			

			proto::gradido::TransferAmount* sender = nullptr;
			std::string* receiver_pubkey = nullptr;
			if (mProtoTransfer.has_local()) {
				auto local_transfer = mProtoTransfer.local();
				sender = local_transfer.mutable_sender();
				receiver_pubkey = local_transfer.mutable_receiver();
				return prepare(sender, receiver_pubkey);
			}
			else if (mProtoTransfer.has_inbound()) {
				auto inbound_transfer = mProtoTransfer.inbound();
				sender = inbound_transfer.mutable_sender();
				receiver_pubkey = inbound_transfer.mutable_receiver();
				return prepare(sender, receiver_pubkey);
			} 
			else if (mProtoTransfer.has_outbound()) {
				auto outbound_transfer = mProtoTransfer.outbound();
				sender = outbound_transfer.mutable_sender();
				receiver_pubkey = outbound_transfer.mutable_receiver();
				return prepare(sender, receiver_pubkey);
			}
			return -1;
		}

		int TransactionTransfer::prepare(proto::gradido::TransferAmount* sender, std::string* receiver_pubkey)
		{
			assert(sender && receiver_pubkey);

			char pubkeyHexTemp[65];
			auto sender_pubkey = sender->pubkey();
			auto amount = sender->amount();
			auto sender_user = controller::User::create();
			auto receiver_user = controller::User::create();

			if (!sender_user->load((const unsigned char*)sender_pubkey.data())) {
				sodium_bin2hex(pubkeyHexTemp, 65, (const unsigned char*)sender_pubkey.data(), sender_pubkey.size());
				mKontoTable.push_back(KontoTableEntry(pubkeyHexTemp, amount, true));
			}
			else {
				mKontoTable.push_back(KontoTableEntry(sender_user->getModel(), amount, true));
			}

			if (!receiver_user->load((const unsigned char*)receiver_pubkey->data())) {
				sodium_bin2hex(pubkeyHexTemp, 65, (const unsigned char*)receiver_pubkey->data(), receiver_pubkey->size());
				mKontoTable.push_back(KontoTableEntry(pubkeyHexTemp, amount, false));
			}
			else {
				mKontoTable.push_back(KontoTableEntry(receiver_user->getModel(), amount, false));
			}
			mMinSignatureCount = 1;
			auto mm = MemoryManager::getInstance();
			auto pubkey_copy = mm->getFreeMemory(KeyPairEd25519::getPublicKeySize());
			memcpy(*pubkey_copy, sender_pubkey.data(), KeyPairEd25519::getPublicKeySize());
			mRequiredSignPublicKeys.push_back(pubkey_copy);

			mIsPrepared = true;
			return 0;
		}

		TransactionValidation TransactionTransfer::validate()
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			static const char function_name[] = "TransactionTransfer::validate";
			/*if (!mProtoTransfer.has_local()) {
				addError(new Error(function_name, "only local currently implemented"));
				return TRANSACTION_VALID_CODE_ERROR;
			}*/
			proto::gradido::TransferAmount* sender = nullptr;
			std::string* receiver_pubkey = nullptr;
			if (mProtoTransfer.has_local()) {
				auto local_transfer = mProtoTransfer.local();
				sender = local_transfer.mutable_sender();
				receiver_pubkey = local_transfer.mutable_receiver();
				return validate(sender, receiver_pubkey);
			}
			else if (mProtoTransfer.has_inbound()) {
				auto inbound_transfer = mProtoTransfer.inbound();
				sender = inbound_transfer.mutable_sender();
				receiver_pubkey = inbound_transfer.mutable_receiver();
				return validate(sender, receiver_pubkey);
			}
			else if (mProtoTransfer.has_outbound()) {
				auto outbound_transfer = mProtoTransfer.outbound();
				sender = outbound_transfer.mutable_sender();
				receiver_pubkey = outbound_transfer.mutable_receiver();
				return validate(sender, receiver_pubkey);
			}
			
			return TRANSACTION_VALID_CODE_ERROR;
		}

		TransactionValidation TransactionTransfer::validate(proto::gradido::TransferAmount* sender, std::string* receiver_pubkey)
		{
			assert(sender && receiver_pubkey);

			static const char function_name[] = "TransactionTransfer::validate";
			auto amount = sender->amount();
			if (0 == amount) {
				addError(new Error(function_name, "amount is empty"));
				return TRANSACTION_VALID_INVALID_AMOUNT;
			}
			else if (amount < 0) {
				addError(new Error(function_name, "negative amount"));
				return TRANSACTION_VALID_INVALID_AMOUNT;
			}
			if (receiver_pubkey->size() != KeyPairEd25519::getPublicKeySize()) {
				addError(new Error(function_name, "invalid size of receiver pubkey"));
				return TRANSCATION_VALID_INVALID_PUBKEY;
			}
			if (sender->pubkey().size() != KeyPairEd25519::getPublicKeySize()) {
				addError(new Error(function_name, "invalid size of sender pubkey"));
				return TRANSCATION_VALID_INVALID_PUBKEY;
			}
			return TRANSACTION_VALID_OK;
		}

		std::string TransactionTransfer::getTargetGroupAlias()
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			if (mProtoTransfer.has_local()) {
				return "";
			}
			else if (mProtoTransfer.has_inbound()) {
				auto inbound_transfer = mProtoTransfer.inbound();
				return inbound_transfer.other_group();
			}
			else if (mProtoTransfer.has_outbound()) {
				auto outbound_transfer = mProtoTransfer.outbound();
				return outbound_transfer.other_group();
			}
			return "<unkown>";
		}

		Poco::AutoPtr<Transaction> TransactionTransfer::createOutbound(const std::string& memo)
		{
			const char* function_name = "TransactionTransfer::createOutbound";
			auto mm = MemoryManager::getInstance();
			if (!mProtoTransfer.has_inbound()) {
				return nullptr;
			}
			// Poco::AutoPtr<controller::User> sender, const MemoryBin* receiverPubkey, Poco::AutoPtr<controller::Group> receiverGroup, Poco::UInt32 amount, const std::string& memo
			//Transaction::createTransfer()
			auto inbound = mProtoTransfer.inbound();
			auto sender = controller::User::create();
			if (1 != sender->load((const unsigned char*)inbound.sender().pubkey().data())) {
				return nullptr;
			}
			auto receiver_pubkey = mm->getFreeMemory(inbound.receiver().size());
			memcpy(*receiver_pubkey, inbound.receiver().data(), inbound.receiver().size());
			auto groups = controller::Group::load(inbound.other_group());
			if (1 != groups.size()) {
				return nullptr;
			}
			auto transaction = Transaction::createTransfer(sender, receiver_pubkey, groups[0], inbound.sender().amount(), memo, false);
			mm->releaseMemory(receiver_pubkey);
			return transaction[0];
			
		}

		const std::string& TransactionTransfer::getKontoNameCell(int index)
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			
			if (index >= mKontoTable.size()) {
				return mInvalidIndexMessage;
			}

			return mKontoTable[index].kontoNameCell;
		}

		const std::string& TransactionTransfer::getAmountCell(int index)
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			if (index >= mKontoTable.size()) {
				return mInvalidIndexMessage;
			}

			return mKontoTable[index].amountCell;
		}

		void TransactionTransfer::transactionAccepted(Poco::AutoPtr<controller::User> user)
		{

		}

	

	}
}
