#include "Response.h"

namespace model {
	namespace hedera {
		Response::Response()
		{
		}

		Response::~Response()
		{

		}

		Poco::UInt64 Response::getAccountBalance()
		{
			if (isCryptoGetAccountBalanceResponse()) {
				auto balance_response = mResponseProto.cryptogetaccountbalance();
				return balance_response.balance();
			}
			return 0;
		}

		std::unique_ptr<ConsensusTopicInfo> Response::getConsensusTopicInfo()
		{
			if (mResponseProto.has_consensusgettopicinfo()) {
				return std::make_unique<ConsensusTopicInfo>(mResponseProto.consensusgettopicinfo().topicinfo());
			}
			return nullptr;
		}

		TransactionReceipt* Response::getTransactionReceipt()
		{
			if (mResponseProto.has_transactiongetreceipt()) {
				return new TransactionReceipt(mResponseProto.transactiongetreceipt().receipt());
			}
			if (mResponseProto.has_transactiongetrecord()) {
				return new TransactionReceipt(mResponseProto.transactiongetrecord().transactionrecord().receipt());
			}
			return nullptr;
		}

		TransactionRecord* Response::getTransactionRecord()
		{
			if (mResponseProto.has_transactiongetrecord()) {
				return new TransactionRecord(mResponseProto.transactiongetrecord().transactionrecord());
			}
			return nullptr;
		}

		Poco::UInt64 Response::getQueryCost()
		{
			proto::ResponseHeader* response_header = nullptr;
			if (mResponseProto.has_consensusgettopicinfo()) {
				response_header = mResponseProto.mutable_consensusgettopicinfo()->mutable_header();
			}
			else if (mResponseProto.has_cryptogetaccountbalance()) {
				response_header = mResponseProto.mutable_cryptogetaccountbalance()->mutable_header();
			}
			if (response_header) {
				return response_header->cost();
			}
			return 0;
		}

		proto::ResponseCodeEnum Response::getResponseCode()
		{
			if (isCryptoGetAccountBalanceResponse()) {
				auto balance_response = mResponseProto.cryptogetaccountbalance();
				return balance_response.header().nodetransactionprecheckcode();
			}
			else if (mResponseProto.has_consensusgettopicinfo()) {
				auto response = mResponseProto.consensusgettopicinfo();
				return response.header().nodetransactionprecheckcode();
			}
			return proto::NOT_SUPPORTED;
		}
	}
}