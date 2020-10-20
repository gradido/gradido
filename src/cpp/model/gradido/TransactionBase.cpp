#include "TransactionBase.h"
#include "../../Crypto/KeyPairEd25519.h"
#include <iomanip>

namespace model {
	namespace gradido {

		TransactionBase::TransactionBase(const std::string& memo)
			: mMemo(memo), mMinSignatureCount(0), mIsPrepared(false)
		{

		}

		TransactionBase::~TransactionBase()
		{
			auto mm = MemoryManager::getInstance();
			for (auto it = mRequiredSignPublicKeys.begin(); it != mRequiredSignPublicKeys.end(); it++)
			{
				mm->releaseMemory(*it);
			}
			mRequiredSignPublicKeys.clear();
			for (auto it = mForbiddenSignPublicKeys.begin(); it != mForbiddenSignPublicKeys.end(); it++)
			{
				mm->releaseMemory(*it);
			}
			mForbiddenSignPublicKeys.clear();
		}


		std::string TransactionBase::amountToString(google::protobuf::int64 amount)
		{
			std::stringstream ss;
			double dAmount = amount / 10000.0;
			ss << std::fixed << std::setprecision(2) << dAmount;
			std::string amountString = ss.str();
			if (amountString.find('.') != amountString.npos) {
				int pointPlace = amountString.find('.');
				if (amountString.substr(pointPlace + 1) == "00") {
					amountString = amountString.substr(0, pointPlace);
				}
			}
			return amountString;
			//return ss.str();
		}

		TransactionValidation TransactionBase::checkRequiredSignatures(const proto::gradido::SignatureMap* sig_map)
		{
			if (!mMinSignatureCount) {
				addError(new Error("TransactionBase::checkRequiredSignatures", "mMinSignatureCount is zero"));
				return TRANSACTION_VALID_CODE_ERROR;
			}
			// not enough
			if (mMinSignatureCount > sig_map->sigpair_size()) {
				return TRANSACTION_VALID_MISSING_SIGN;
			}
			// enough
			if (!mRequiredSignPublicKeys.size() && !mForbiddenSignPublicKeys.size()) {
				return TRANSACTION_VALID_OK;
			}
			// check if specific signatures can be found
			static const char function_name[] = "TransactionBase::checkRequiredSignatures";
			// prepare
			std::vector<MemoryBin*> required_keys = mRequiredSignPublicKeys;
			
			bool forbidden_key_found = false;
			for (auto it = sig_map->sigpair().begin(); it != sig_map->sigpair().end(); it++) 
			{
				auto pubkey_size = it->pubkey().size();
				if (pubkey_size != KeyPairEd25519::getPublicKeySize()) 
				{
					addError(new ParamError(function_name, "signature pubkey size is not as expected: ", pubkey_size));
					return TRANSACTION_VALID_CODE_ERROR;
				}
				// check for forbidden key
				if (!forbidden_key_found && mForbiddenSignPublicKeys.size()) 
				{
					for (auto it2 = mForbiddenSignPublicKeys.begin(); it2 != mForbiddenSignPublicKeys.end(); it2++) {
						if ((*it2)->size() != KeyPairEd25519::getPublicKeySize()) 
						{
							addError(new ParamError(function_name, "forbidden sign public key size is not as expected: ", (*it2)->size()));
							return TRANSACTION_VALID_CODE_ERROR;
						}
						if (0 == memcmp((*it2)->data(), it->pubkey().data(), pubkey_size)) 
						{
							forbidden_key_found = true;
							break;
						}
					}
				}
				if (forbidden_key_found) break;

				// compare with required keys
				for (auto it3 = required_keys.begin(); it3 != required_keys.end(); it3++) 
				{
					if ((*it3)->size() != KeyPairEd25519::getPublicKeySize()) 
					{
						addError(new ParamError(function_name, "required sign public key size is not as expected: ", (*it3)->size()));
						return TRANSACTION_VALID_CODE_ERROR;
					}
					if (0 == memcmp((*it3)->data(), it->pubkey().data(), pubkey_size)) 
					{
						it3 = required_keys.erase(it3);
						break;
					}
				}
			}
			
			if (forbidden_key_found) return TRANSACTION_VALID_FORBIDDEN_SIGN;
			if (!required_keys.size()) return TRANSACTION_VALID_OK;

			// TODO: check that given pubkeys are registered for same group 

			return TRANSACTION_VALID_MISSING_SIGN;
			
		}

		bool TransactionBase::isPublicKeyRequired(const unsigned char* pubkey)
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			for (auto it = mRequiredSignPublicKeys.begin(); it != mRequiredSignPublicKeys.end(); it++) {
				if (memcmp((*it)->data(), pubkey, KeyPairEd25519::getPublicKeySize()) == 0) {
					return true;
				}
			}
			return false;
		}
		
		bool TransactionBase::isPublicKeyForbidden(const unsigned char* pubkey)
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			for (auto it = mForbiddenSignPublicKeys.begin(); it != mForbiddenSignPublicKeys.end(); it++) {
				if (memcmp((*it)->data(), pubkey, KeyPairEd25519::getPublicKeySize()) == 0) {
					return true;
				}
			}
			return false;
		}
	}
}

