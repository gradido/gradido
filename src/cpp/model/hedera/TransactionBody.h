#ifndef _GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_BODY_H
#define _GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_BODY_H

/*!
* @author: Dario Rekowski
*
* @date: 02.09.20
*
* @brief: class for composing transaction body for hedera transaction
*
*/


#include "../../controller/NodeServer.h"
#include "CryptoTransferTransaction.h"
#include "CryptoCreateTransaction.h"
#include "ConsensusCreateTopic.h"
#include "ConsensusSubmitMessage.h"

#include "../../proto/hedera/TransactionBody.pb.h"

namespace model {
	namespace hedera {

		enum TransactionBodyType
		{
			TRANSACTION_CRYPTO_TRANSFER,
			TRANSACTION_CRYPTO_CREATE,
			TRANSACTION_CONSENSUS_CREATE_TOPIC,
			TRANSACTION_CONSENSUS_SUBMIT_MESSAGE
		};

		class TransactionBody
		{
		public:
			TransactionBody(Poco::AutoPtr<controller::HederaId> operatorAccountId, const controller::NodeServerConnection& connection);
			~TransactionBody();

			void setMemo(const std::string& memo);
			void setFee(Poco::UInt64 fee);

			bool setCryptoTransfer(CryptoTransferTransaction& cryptoTransferTransaction);
			bool setCryptoCreate(CryptoCreateTransaction& cryptoCreateTransaction);
			bool setCreateTopic(ConsensusCreateTopic& consensusCreateTopicTransaction);
			bool setConsensusSubmitMessage(ConsensusSubmitMessage& consensusSubmitMessageTransaction);
			//bool 

			inline const proto::TransactionBody* getProtoTransactionBody() const { return &mTransactionBody; }
			inline std::string getConnectionString() const { return mConnection.getUriWithPort(); }
			inline controller::NodeServerConnection getConnection() const { return mConnection; }
			inline TransactionBodyType getType() const { return mType; }

		protected:
			void updateTimestamp();
			proto::TransactionBody mTransactionBody;
			controller::NodeServerConnection mConnection;
			bool mHasBody;
			TransactionBodyType mType;
		};
	}
}


#endif //_GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_BODY_H