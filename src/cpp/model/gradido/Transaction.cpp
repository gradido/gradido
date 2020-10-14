#include "Transaction.h"
#include "../../SingletonManager/ErrorManager.h"

namespace model {
	namespace gradido {
		Transaction::Transaction(Poco::AutoPtr<TransactionBody> body)
			: mTransactionBody(body), mBodyBytesHash(0)
		{

		}
	
		Transaction::~Transaction()
		{

		}

		bool Transaction::addSign(Poco::AutoPtr<controller::User> user)
		{
			static const char function_name[] = "Transaction::addSign";
				
			if (user.isNull() || !user->getModel()) 
			{
				addError(new Error(function_name, "error user is invalid"));
				return false;
			}
			std::string bodyBytes;
			try {
				bodyBytes = mTransactionBody->getBodyBytes();
			}
			catch (Poco::Exception& ex) {
				addError(new Error(function_name, "error getting body bytes"));
				return false;
			}
			auto hash = DRMakeStringHash(bodyBytes.data(), bodyBytes.size());

			
			auto sigMap = mProtoTransaction.mutable_sig_map();
			if (sigMap->sigpair_size() > 0 && mBodyBytesHash && mBodyBytesHash != hash) 
			{
				addError(new Error(function_name, "body bytes hash has changed and signature(s) exist already!"));
				return false;
			}
			mBodyBytesHash = hash;

			auto pubkeyBin = user->getModel()->getPublicKey();

			// check if pubkey already exist
			for (auto it = sigMap->sigpair().begin(); it != sigMap->sigpair().end(); it++)
			{
				if (it->pubkey().size() != KeyPairEd25519::getPublicKeySize()) {
					addError(new Error(function_name, "error signature pubkey hasn't expected size!"));
					return false;
				}
				if (0 == memcmp(pubkeyBin, it->pubkey().data(), KeyPairEd25519::getPublicKeySize())) {
					addError(new ParamError(function_name, "error, pubkey has signed already from user: ", user->getModel()->getEmail()));
					return false;
				}
			}


			auto mm = MemoryManager::getInstance();
			auto gradido_key_pair = user->getGradidoKeyPair();
			KeyPairEd25519* recovered_gradido_key_pair = nullptr;

			if (!gradido_key_pair || !gradido_key_pair->hasPrivateKey()) 
			{
				if (!user->tryLoadPassphraseUserBackup(&recovered_gradido_key_pair))  
				{
					if (user->setGradidoKeyPair(recovered_gradido_key_pair)) 
					{
						user->getModel()->updatePrivkey();
					}
				} 
				else 
				{
					addError(new Error(function_name, "user cannot decrypt private key"));
					return false;
				}
			}
			

			MemoryBin* sign = nullptr;
			if (gradido_key_pair) 
			{
				sign = gradido_key_pair->sign(bodyBytes);
			}
			else if (recovered_gradido_key_pair) 
			{
				sign = recovered_gradido_key_pair->sign(bodyBytes);
			}
			if (!sign) 
			{
				ErrorManager::getInstance()->sendErrorsAsEmail();
				addError(new Error(function_name, "error by calculate signature"));
				mm->releaseMemory(sign);
				return false;
			}
			auto sigPair = sigMap->add_sigpair();
			auto pubkeyBytes = sigPair->mutable_pubkey();
			*pubkeyBytes = std::string((const char*)pubkeyBin, crypto_sign_PUBLICKEYBYTES);

			auto sigBytes = sigPair->mutable_ed25519();
			*sigBytes = std::string((char*)*sign, sign->size());
			mm->releaseMemory(sign);

			return true;
		}
		TransactionValidation Transaction::validate()
		{
			auto sig_map = mProtoTransaction.sig_map();
			auto transaction_base = mTransactionBody->getTransactionBase();
			auto result = transaction_base->checkRequiredSignatures(&sig_map);

			if (result == TRANSACTION_VALID_OK)
			{
				return transaction_base->validate();
			}
			return result;

		}
		
	}
}