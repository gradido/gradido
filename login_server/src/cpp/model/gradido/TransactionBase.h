/*!
*
* \author: einhornimmond
*
* \date: 25.10.19
*
* \brief: Interface for Transaction Objects
*/
#ifndef GRADIDO_LOGIN_SERVER_MODEL_TRANSACTION_BASE_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TRANSACTION_BASE_INCLUDE

#pragma warning(disable:4800)

#include "../../lib/NotificationList.h"
#include "proto/gradido/BasicTypes.pb.h"
#include "../../SingletonManager/MemoryManager.h"

#include "../../controller/User.h"

namespace model {
	namespace gradido {

		enum TransactionValidation {
			TRANSACTION_VALID_OK,
			TRANSACTION_VALID_MISSING_SIGN,
			TRANSACTION_VALID_FORBIDDEN_SIGN,
			TRANSACTION_VALID_MISSING_PARAM,
			TRANSACTION_VALID_CODE_ERROR,
			TRANSACTION_VALID_INVALID_TARGET_DATE,
			TRANSACTION_VALID_CREATION_OUT_OF_BORDER,
			TRANSACTION_VALID_INVALID_AMOUNT,
			TRANSACTION_VALID_INVALID_PUBKEY,
			TRANSACTION_VALID_INVALID_GROUP_ALIAS,
			TRANSACTION_VALID_INVALID_SIGN,
			TRANSACTION_VALID_INVALID_MEMO
		};
		const char* TransactionValidationToString(TransactionValidation result);

		class TransactionBase : public NotificationList, public UniLib::lib::MultithreadContainer
		{
		public:
			TransactionBase(const std::string& memo);
			virtual ~TransactionBase();
			//! \return 0 if ok, < 0 if error, > 0 if not implemented
			virtual int prepare() = 0;
			virtual TransactionValidation validate() = 0;

			static std::string amountToString(google::protobuf::int64 amount);
			inline const std::string& getMemo() const { return mMemo; }

			//! \return TRANSACTION_VALID_OK if all required signatures are found in signature pairs
			TransactionValidation checkRequiredSignatures(const proto::gradido::SignatureMap* sig_map);
			//! \param pubkey pointer must point to valid unsigned char[KeyPairEd25519::getPublicKeySize()] array
			bool isPublicKeyRequired(const unsigned char* pubkey);
			//! \param pubkey pointer must point to valid unsigned char[KeyPairEd25519::getPublicKeySize()] array
			bool isPublicKeyForbidden(const unsigned char* pubkey);

			inline Poco::UInt32 getMinSignatureCount() { return mMinSignatureCount; }
			void setMinSignatureCount(Poco::UInt32 minSignatureCount) { mMinSignatureCount = minSignatureCount; }

			// called after sending transaction over hedera and after they was accepted from gradido node (at least one)
			virtual void transactionAccepted(Poco::AutoPtr<controller::User> user) = 0;

		protected:
			std::string mMemo;
			Poco::UInt32 mMinSignatureCount;
			bool mIsPrepared;
			std::vector<MemoryBin*> mRequiredSignPublicKeys;
			std::vector<MemoryBin*> mForbiddenSignPublicKeys;
		};
	}
}



#endif //GRADIDO_LOGIN_SERVER_MODEL_TRANSACTION_BASE_INCLUDE
