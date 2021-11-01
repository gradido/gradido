/*!
*
* \author: einhornimmond
*
* \date: 25.10.19
*
* \brief: Creation Transaction
*/
#ifndef GRADIDO_LOGIN_SERVER_MODEL_TRANSACTION_TRANSFER_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TRANSACTION_TRANSFER_INCLUDE

#pragma warning(disable:4800)

#include "TransactionBase.h"
//#include "Transaction.h"
#include "../proto/gradido/GradidoTransfer.pb.h"

#include "../../controller/User.h"

namespace model {
	namespace gradido {

		class Transaction;

		enum TransactionTransferType
		{
			TRANSFER_LOCAL,
			TRANSFER_CROSS_GROUP_INBOUND,
			TRANSFER_CROSS_GROUP_OUTBOUND
		};

		class TransactionTransfer : public TransactionBase
		{
		public:
			TransactionTransfer(const std::string& memo, const proto::gradido::GradidoTransfer& protoTransfer);
			~TransactionTransfer();

			int prepare();
			TransactionValidation validate();

			inline size_t getKontoTableSize() { Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex); return mKontoTable.size(); }
			const std::string& getKontoNameCell(int index);
			const std::string& getAmountCell(int index);

			std::string getTargetGroupAlias();
			bool isInbound() { return mProtoTransfer.has_inbound(); }
			bool isOutbound() { return mProtoTransfer.has_outbound(); }

			void transactionAccepted(Poco::AutoPtr<controller::User> user);

			inline void setOwnGroupAlias(const std::string& ownGroupAlias) { mOwnGroupAlias = ownGroupAlias; }
			inline void setTargetGroupAlias(const std::string& targetGroupAlias) { mTargetGroupAlias = targetGroupAlias; }

		protected:
			const static std::string mInvalidIndexMessage;

			int prepare(proto::gradido::TransferAmount* sender, std::string* receiver_pubkey);
			TransactionValidation validate(proto::gradido::TransferAmount* sender, std::string* receiver_pubkey);

			struct KontoTableEntry
			{
			public:
				KontoTableEntry(model::table::User* user, google::protobuf::int64 amount, bool negativeAmount = false);
				KontoTableEntry(const std::string& pubkeyHex, google::protobuf::int64 amount, bool negativeAmount = false);
				// first name, last name and email or pubkey hex if no user in db found
				std::string kontoNameCell;
				std::string amountCell;

			protected:
				void composeAmountCellString(google::protobuf::int64 amount, bool negativeAmount);
			};

			const proto::gradido::GradidoTransfer& mProtoTransfer;
			std::vector<KontoTableEntry> mKontoTable;
			std::string mOwnGroupAlias;
			std::string mTargetGroupAlias;
		};
	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TRANSACTION_TRANSFER_INCLUDE
