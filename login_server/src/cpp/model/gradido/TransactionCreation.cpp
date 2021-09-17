#include "TransactionCreation.h"
#include "Poco/DateTimeFormatter.h"
#include <sodium.h>

namespace model {
	namespace gradido {

		TransactionCreation::TransactionCreation(const std::string& memo, const proto::gradido::GradidoCreation& protoCreation)
			: TransactionBase(memo), mProtoCreation(protoCreation)
		{
			memset(mReceiverPublicHex, 0, 65);
		}

		TransactionCreation::~TransactionCreation()
		{

		}

		int TransactionCreation::prepare()
		{
			const static char functionName[] = { "TransactionCreation::prepare" };
			if (!mProtoCreation.has_receiver()) {
				addError(new Error(functionName, "hasn't receiver amount"));
				return -1;
			}
			auto receiver_amount = mProtoCreation.receiver();

			auto receiverPublic = receiver_amount.pubkey();
			if (receiverPublic.size() != KeyPairEd25519::getPublicKeySize()) {
				addError(new ParamError(functionName, "receiver public invalid: ", receiverPublic.size()));
				return -2;
			}
			mReceiverUser = controller::User::create();
			//mReceiverUser = new User((const unsigned char*)receiverPublic.data());
			mReceiverUser->load((const unsigned char*)receiverPublic.data());
			getErrors(mReceiverUser->getModel());
			if (mReceiverUser->getUserState() == USER_EMPTY) {
				sodium_bin2hex(mReceiverPublicHex, 65, (const unsigned char*)receiverPublic.data(), receiverPublic.size());
				mReceiverUser.assign(nullptr);
			}
			else {
				memcpy(mReceiverPublicHex, mReceiverUser->getModel()->getPublicKeyHex().data(), 64);
				// uncomment because not correctly working
				/*if (!mReceiverUser->validateIdentHash(mProtoCreation.ident_hash())) {
				addError(new Error(functionName, "ident hash isn't the same"));
				addError(new ParamError(functionName, "hash calculated from email: ", mReceiverUser->getEmail()));
				addError(new ParamError(functionName, "hash: ", std::to_string(mProtoCreation.ident_hash())));
				return -3;
				}*/
			}
			//
			mMinSignatureCount = 1;
			auto mm = MemoryManager::getInstance();
			auto pubkey_copy = mm->getFreeMemory(KeyPairEd25519::getPublicKeySize());
			memcpy(*pubkey_copy, receiverPublic.data(), KeyPairEd25519::getPublicKeySize());
			mForbiddenSignPublicKeys.push_back(pubkey_copy);

			mIsPrepared = true;
			return 0;
		}

		std::string TransactionCreation::getTargetDateString()
		{
			// proto format is seconds, poco timestamp format is microseconds
			Poco::Timestamp pocoStamp(mProtoCreation.target_date().seconds() * 1000 * 1000);
			//Poco::DateTime(pocoStamp);
			return Poco::DateTimeFormatter::format(pocoStamp, "%d. %b %y");
		}

		TransactionValidation TransactionCreation::validate()
		{
			static const char function_name[] = "TransactionCreation::validate";
			auto target_date = Poco::DateTime(DataTypeConverter::convertFromProtoTimestampSeconds(mProtoCreation.target_date()));
			auto now = Poco::DateTime();
			if (target_date.year() == now.year()) 
			{
				if (target_date.month() + 3 < now.month()) {
					addError(new Error(function_name, "year is the same, target date month is more than 3 month in past"));
					return TRANSACTION_VALID_INVALID_TARGET_DATE;
				}
				if (target_date.month() > now.month()) {
					addError(new Error(function_name, "year is the same, target date month is in future"));
					return TRANSACTION_VALID_INVALID_TARGET_DATE;
				}
			}
			else if(target_date.year() > now.year()) 
			{
				addError(new Error(function_name, "target date year is in future"));
				return TRANSACTION_VALID_INVALID_TARGET_DATE;
			}
			else if(target_date.year() +1 < now.year())
			{
				addError(new Error(function_name, "target date year is in past"));
				return TRANSACTION_VALID_INVALID_TARGET_DATE;
			}
			else 
			{
				// target_date.year +1 == now.year
				if (target_date.month() + 3 < now.month() + 12) {
					addError(new Error(function_name, "target date is more than 3 month in past"));
					return TRANSACTION_VALID_INVALID_TARGET_DATE;
				}
			}
			if (mProtoCreation.receiver().amount() > 1000 * 10000) {
				addError(new Error(function_name, "creation amount to high, max 1000 per month"));
				return TRANSACTION_VALID_CREATION_OUT_OF_BORDER;
			}

			if (mProtoCreation.receiver().pubkey().size() != KeyPairEd25519::getPublicKeySize()) {
				addError(new Error(function_name, "receiver pubkey has invalid size"));
				return TRANSACTION_VALID_INVALID_PUBKEY;
			}

			// TODO: check creation amount from last 3 month from node server

			
			return TRANSACTION_VALID_OK;
		}

		void TransactionCreation::transactionAccepted(Poco::AutoPtr<controller::User> user)
		{

		}

	}
}

