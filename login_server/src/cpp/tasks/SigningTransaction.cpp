#include <inttypes.h>

#include "SigningTransaction.h"


#include <google/protobuf/text_format.h>

#include "../SingletonManager/ErrorManager.h"
#include "../SingletonManager/MemoryManager.h"
#include "../SingletonManager/SingletonTaskObserver.h"

#include "../lib/Profiler.h"

#include "sodium.h"

#include "../ServerConfig.h"
#include "Poco/JSON/Object.h"
#include "Poco/JSON/Parser.h"
#include "Poco/StreamCopier.h"
#include "Poco/Net/HTTPSClientSession.h"
#include "Poco/Net/HTTPRequest.h"
#include "Poco/Net/HTTPResponse.h"

// stuff for hedera transaction
#include "../controller/HederaAccount.h"
#include "../controller/HederaRequest.h"
#include "../model/hedera/TransactionBody.h"
#include "../model/hedera/Transaction.h"

SigningTransaction::SigningTransaction(
	Poco::AutoPtr<ProcessingTransaction> processingeTransaction,
	Poco::AutoPtr<controller::User> newUser,
	bool sendErrorsToAdmin/* = true*/)
	: mProcessingeTransaction(processingeTransaction), mNewUser(newUser), mSendErrorsToAdminEmail(sendErrorsToAdmin)
{
	auto ob = SingletonTaskObserver::getInstance();
	auto email = getUserEmail();

	if (email != "") { 
		ob->addTask(email, TASK_OBSERVER_SIGN_TRANSACTION); 
	}
}

SigningTransaction::~SigningTransaction()
{
	auto ob = SingletonTaskObserver::getInstance();
	auto email = getUserEmail();

	if (email != "") {
		ob->removeTask(email, TASK_OBSERVER_SIGN_TRANSACTION);
	}
}

std::string SigningTransaction::getUserEmail()
{
	model::table::User* user_model = nullptr;

	if (!mNewUser.isNull()) {
		user_model = mNewUser->getModel();
	}
	if (user_model) {
		return user_model->getEmail();
	}
	return "";
}

int SigningTransaction::run() {
	auto mm = MemoryManager::getInstance();

	Error* transactionError = new Error("SigningTransaction", mProcessingeTransaction->mProtoMessageBase64.data());
	addError(transactionError, false);
	
	//= new Error("SigningTransaction start", mProcessingeTransaction->g)
	//if (mUser.isNull() || !mUser->hasCryptoKey()) {
	if(mNewUser.isNull() || !mNewUser->hasPassword()) {
		addError(new Error("SigningTransaction", "user hasn't crypto key or is null"));
		if(mSendErrorsToAdminEmail) sendErrorsAsEmail();
		return -1;
	}

	//auto privKey = mUser->getPrivKey();
	//if (!mUser->hasPrivKey()) {
	auto gradido_key_pair = mNewUser->getGradidoKeyPair();
	KeyPairEd25519* recovered_gradido_key_pair = nullptr;
	if(!gradido_key_pair || !gradido_key_pair->hasPrivateKey()) {
		
		if (!mNewUser->tryLoadPassphraseUserBackup(&recovered_gradido_key_pair)) {
			if(mNewUser->setGradidoKeyPair(recovered_gradido_key_pair))
			{
				mNewUser->getModel()->updatePrivkey();
			}
		}
		else {
			addError(new Error("SigningTransaction", "user cannot decrypt private key"));
			if (mSendErrorsToAdminEmail) sendErrorsAsEmail();
			return -2;
		}
	}
	// get body bytes
	proto::gradido::GradidoTransaction transaction;
	auto bodyBytes = transaction.mutable_body_bytes();
	auto transaction_body = mProcessingeTransaction->getTransactionBody();
	if (!transaction_body.isNull()) {
		*bodyBytes = transaction_body->getBodyBytes();
	}
	if (*bodyBytes == "") {
		getErrors(mProcessingeTransaction);
		if (mSendErrorsToAdminEmail) sendErrorsAsEmail();
		return -3;
	}
	// sign
	//auto sign = mUser->sign((const unsigned char*)bodyBytes->data(), bodyBytes->size());
	MemoryBin* sign = nullptr;
	if (gradido_key_pair) {
		sign = gradido_key_pair->sign(*bodyBytes);
	}
	else if (recovered_gradido_key_pair) {
		sign = recovered_gradido_key_pair->sign(*bodyBytes);
	}
	if (!sign) {
		ErrorManager::getInstance()->sendErrorsAsEmail();
		if (mSendErrorsToAdminEmail) sendErrorsAsEmail();
		mm->releaseMemory(sign);
		return -4;
	}
	
	// pubkey for signature
	/*auto pubkeyBin = mm->getFreeMemory(ed25519_pubkey_SIZE);
	size_t realBin = 0;
	if (sodium_hex2bin(*pubkeyBin, *pubkeyBin, pubkeyHex.data(), pubkeyHex.size(), nullptr, &realBin, nullptr)) {
		addError(new Error("SigningTransaction", "error in sodium_hex2bin"));
		sendErrorsAsEmail();
		mm->releaseMemory(pubkeyBin);
		mm->releaseMemory(sign);
		return -5;
	}
	*/
	// add to message
	auto sigMap = transaction.mutable_sig_map();
	auto sigPair = sigMap->add_sigpair();

	auto pubkeyBytes = sigPair->mutable_pubkey();
	auto pubkeyBin = mNewUser->getModel()->getPublicKey();
	*pubkeyBytes = std::string((const char*)pubkeyBin, crypto_sign_PUBLICKEYBYTES);
	

	auto sigBytes = sigPair->mutable_ed25519();
	*sigBytes = std::string((char*)*sign, sign->size());
	mm->releaseMemory(sign);
	
	/*std::string protoPrettyPrint;
	google::protobuf::TextFormat::PrintToString(transaction, &protoPrettyPrint);
	printf("transaction pretty: %s\n", protoPrettyPrint.data());
	proto::gradido::TransactionBody transactionBody;
	transactionBody.MergeFromString(transaction.bodybytes());
	google::protobuf::TextFormat::PrintToString(transactionBody, &protoPrettyPrint);
	printf("transaction body pretty: \n%s\n", protoPrettyPrint.data());
	*/
	// finalize
	//printf("sigpair size: %d\n", transaction.sigmap().sigpair_size());
	std::string finalTransactionBin = transaction.SerializeAsString();
	if (finalTransactionBin == "") {
		addError(new Error("SigningTransaction", "error serializing final transaction"));
		if (mSendErrorsToAdminEmail) sendErrorsAsEmail();
		return -6;
	}

	auto network_type = ServerConfig::HEDERA_TESTNET;
	auto topic_id = controller::HederaId::find(1, network_type);
	auto hedera_operator_account = controller::HederaAccount::pick(network_type, false);
	
	/*if (!topic_id.isNull() && !hedera_operator_account.isNull()) {
		auto crypto_key = hedera_operator_account->getCryptoKey();
		if (!crypto_key.isNull()) {
			model::hedera::ConsensusSubmitMessage consensus_submit_message(topic_id);
			consensus_submit_message.setMessage(finalTransactionBin);
			auto hedera_transaction_body = hedera_operator_account->createTransactionBody();
			hedera_transaction_body->setConsensusSubmitMessage(consensus_submit_message);
			model::hedera::Transaction hedera_transaction;
			hedera_transaction.sign(crypto_key->getKeyPair(), std::move(hedera_transaction_body));

			HederaRequest hedera_request;
			HederaTask    hedera_task;// placeholder
			if (HEDERA_REQUEST_RETURN_OK != hedera_request.request(&hedera_transaction, &hedera_task)) {
				addError(new Error("SigningTransaction", "error send transaction to hedera"));
				getErrors(&hedera_request);
				sendErrorsAsEmail();
			}
			else {
				auto hedera_precheck_code_string = hedera_task.getTransactionResponse()->getPrecheckCodeString();
				auto cost = hedera_task.getTransactionResponse()->getCost();
				printf("hedera response: %s, cost: %" PRIu64 "\n", hedera_precheck_code_string.data(), cost);
			}
			//model::hedera::TransactionBody hedera_transaction_body()
		}
		else {
			printf("[SigningTransaction] crypto key not found\n");
		}
	}
	else {
		printf("[SigningTransaction] hedera topic id or operator account not found\n");
	}*/

	// finale to base64
	auto finalBase64Size = sodium_base64_encoded_len(finalTransactionBin.size(), sodium_base64_VARIANT_URLSAFE_NO_PADDING);
	auto finalBase64Bin = mm->getFreeMemory(finalBase64Size);
	if (!sodium_bin2base64(*finalBase64Bin, finalBase64Size, (const unsigned char*)finalTransactionBin.data(), finalTransactionBin.size(), sodium_base64_VARIANT_URLSAFE_NO_PADDING)) {
		addError(new Error("SigningTransaction", "error convert final transaction to base64"));
		if (mSendErrorsToAdminEmail) sendErrorsAsEmail();
		mm->releaseMemory(finalBase64Bin);
		return -7;
	}
	addError(new Error("Signing transaction final", *finalBase64Bin), false);

	// create json request

	Poco::JSON::Object requestJson;
	requestJson.set("method", "putTransaction");
	requestJson.set("transaction", std::string((char*)*finalBase64Bin));
	//printf("\nbase64 transaction: \n%s\n\n", (char*)*finalBase64Bin);
	mm->releaseMemory(finalBase64Bin);

	
	//std::string request = requestJson.stringify();

	// send post request via https
	// 443 = HTTPS Default
	// or http via port 80 if it is a test server
	// TODO: adding port into ServerConfig
	bool choose_ssl = false;
	try {
		Profiler phpRequestTime;
		Poco::Net::HTTPClientSession* clientSession = nullptr;
		
		if (ServerConfig::g_phpServerPort) {
			clientSession = new Poco::Net::HTTPSClientSession(ServerConfig::g_php_serverHost, ServerConfig::g_phpServerPort);
			choose_ssl = true;
		}
		else if (ServerConfig::SERVER_TYPE_PRODUCTION == ServerConfig::g_ServerSetupType ||
			ServerConfig::SERVER_TYPE_STAGING == ServerConfig::g_ServerSetupType) {
			clientSession = new Poco::Net::HTTPSClientSession(ServerConfig::g_php_serverHost, 443);
			choose_ssl = true;
		}
		else {
			clientSession = new Poco::Net::HTTPClientSession(ServerConfig::g_php_serverHost, 80);
			choose_ssl = false;
		}
		Poco::Net::HTTPRequest request(Poco::Net::HTTPRequest::HTTP_POST, "/JsonRequestHandler");

		request.setChunkedTransferEncoding(true);
		std::ostream& requestStream = clientSession->sendRequest(request);
		requestJson.stringify(requestStream);

		Poco::Net::HTTPResponse response;
		std::istream& request_stream = clientSession->receiveResponse(response);
		
		// debugging answer
		
		std::stringstream responseStringStream;
		for (std::string line; std::getline(request_stream, line); ) {
			responseStringStream << line << std::endl;
		}
		Poco::Logger& speedLog= Poco::Logger::get("SpeedLog");
		speedLog.information("[putTransaction] php server time: %s", phpRequestTime.string());
		
		// extract parameter from request
		Poco::JSON::Parser jsonParser;
		Poco::Dynamic::Var parsedJson;
		try {
			parsedJson = jsonParser.parse(responseStringStream.str());
		}
		catch (Poco::Exception& ex) {
			//printf("[JsonRequestHandler::handleRequest] Exception: %s\n", ex.displayText().data());
			addError(new ParamError("SigningTransaction", "error parsing request answer", ex.displayText().data()));

			std::string log_Path = "/var/log/grd_login/";
			//#ifdef _WIN32
#if defined(_WIN32) || defined(_WIN64)
			log_Path = "./";
#endif
			log_Path += "response.html";
			FILE* f = fopen(log_Path.data(), "wt");
			if (f) {
				std::string responseString = responseStringStream.str();
				fwrite(responseString.data(), 1, responseString.size(), f);
				fclose(f);
			}
		//	*/
			if (mSendErrorsToAdminEmail) sendErrorsAsEmail(responseStringStream.str());
			return -9;
		}

		//sendErrorsAsEmail("<html><head><title>Hallo</title></head><body><font color='red'>Rote Test </font></body>");

		Poco::JSON::Object object = *parsedJson.extract<Poco::JSON::Object::Ptr>();
		
		std::string stateString = "";
		if (!object.isNull("state")) {
			auto state = object.get("state");
			stateString = state.convert<std::string>();
		}
		if (stateString != "success") {
			addError(new Error("SigningTransaction", "php server don't return success"));
			if (!object.isNull("msg")) {
				addError(new ParamError("SigningTransaction", "msg:", object.get("msg").convert<std::string>().data()));
			}
			if (!object.isNull("details")) {
				addError(new ParamError("SigningTransaction", "details:", object.get("details").convert<std::string>().data()));
			}
			if (!object.isNull("user_error")) {
				addError(new ParamError("SigningTransaction", "user_error", object.get("user_error").convert<std::string>().data()));
			}
			if (mSendErrorsToAdminEmail) sendErrorsAsEmail();
			return -10;
		}
		delete clientSession;
		//printf("state: %s\n", stateString.data());
		//int zahl = 1;
	}
	catch (Poco::Exception& e) {
		addError(new ParamError("SigningTransaction", "connect error to php server", e.displayText().data()));
		addError(new ParamError("SigningTransaction", "url", ServerConfig::g_php_serverHost.data()));
		addError(new ParamError("SigningTransaction", "choose_ssl", choose_ssl));
		if (mSendErrorsToAdminEmail) sendErrorsAsEmail();
		return -8;
	}
	

	return 0;
}