#include "SigningTransaction.h"

#include <google/protobuf/text_format.h>

#include "../SingletonManager/ErrorManager.h"
#include "../SingletonManager/MemoryManager.h"
#include "../SingletonManager/SingletonTaskObserver.h"

#include "../lib/Profiler.h"

#include "../proto/gradido/Transaction.pb.h"

#include "sodium.h"

#include "../ServerConfig.h"
#include "Poco/JSON/Object.h"
#include "Poco/JSON/Parser.h"
#include "Poco/StreamCopier.h"
#include "Poco/Net/HTTPSClientSession.h"
#include "Poco/Net/HTTPRequest.h"
#include "Poco/Net/HTTPResponse.h"

SigningTransaction::SigningTransaction(Poco::AutoPtr<ProcessingTransaction> processingeTransaction, Poco::AutoPtr<controller::User> newUser)
	: mProcessingeTransaction(processingeTransaction), mNewUser(newUser)
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
		sendErrorsAsEmail();
		return -1;
	}

	//auto privKey = mUser->getPrivKey();
	//if (!mUser->hasPrivKey()) {
	auto gradido_key_pair = mNewUser->getGradidoKeyPair();

	if(!gradido_key_pair || !gradido_key_pair->hasPrivateKey()) {
		KeyPairEd25519** key_pair_ptr = nullptr;
		if (!mNewUser->tryLoadPassphraseUserBackup(key_pair_ptr)) {
			if(mNewUser->setGradidoKeyPair(*key_pair_ptr))
			{
				mNewUser->getModel()->updatePrivkey();
			}
		}
		else {
			addError(new Error("SigningTransaction", "user cannot decrypt private key"));
			sendErrorsAsEmail();
			return -2;
		}
	}
	// get body bytes
	model::messages::gradido::Transaction transaction;
	auto bodyBytes = transaction.mutable_bodybytes();
	*bodyBytes = mProcessingeTransaction->getBodyBytes();
	if (*bodyBytes == "") {
		getErrors(mProcessingeTransaction);
		sendErrorsAsEmail();
		return -3;
	}
	// sign
	//auto sign = mUser->sign((const unsigned char*)bodyBytes->data(), bodyBytes->size());
	auto sign = gradido_key_pair->sign(*bodyBytes);
	if (!sign) {
		ErrorManager::getInstance()->sendErrorsAsEmail();
		sendErrorsAsEmail();
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
	auto sigMap = transaction.mutable_sigmap();
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
	model::messages::gradido::TransactionBody transactionBody;
	transactionBody.MergeFromString(transaction.bodybytes());
	google::protobuf::TextFormat::PrintToString(transactionBody, &protoPrettyPrint);
	printf("transaction body pretty: \n%s\n", protoPrettyPrint.data());
	*/
	// finalize
	//printf("sigpair size: %d\n", transaction.sigmap().sigpair_size());
	std::string finalTransactionBin = transaction.SerializeAsString();
	if (finalTransactionBin == "") {
		addError(new Error("SigningTransaction", "error serializing final transaction"));
		sendErrorsAsEmail();
		return -6;
	}

	// finale to base64
	auto finalBase64Size = sodium_base64_encoded_len(finalTransactionBin.size(), sodium_base64_VARIANT_URLSAFE_NO_PADDING);
	auto finalBase64Bin = mm->getFreeMemory(finalBase64Size);
	if (!sodium_bin2base64(*finalBase64Bin, finalBase64Size, (const unsigned char*)finalTransactionBin.data(), finalTransactionBin.size(), sodium_base64_VARIANT_URLSAFE_NO_PADDING)) {
		addError(new Error("SigningTransaction", "error convert final transaction to base64"));
		sendErrorsAsEmail();
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
	try {
		Profiler phpRequestTime;
		Poco::Net::HTTPClientSession* clientSession = nullptr;
		if (ServerConfig::g_phpServerPort) {
			clientSession = new Poco::Net::HTTPSClientSession(ServerConfig::g_php_serverHost, ServerConfig::g_phpServerPort);
		}
		else if (ServerConfig::SERVER_TYPE_PRODUCTION == ServerConfig::g_ServerSetupType ||
			ServerConfig::SERVER_TYPE_STAGING == ServerConfig::g_ServerSetupType) {
			clientSession = new Poco::Net::HTTPSClientSession(ServerConfig::g_php_serverHost, 443);
		}
		else {
			clientSession = new Poco::Net::HTTPClientSession(ServerConfig::g_php_serverHost, 80);
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

			FILE* f = fopen("response.html", "wt");
			std::string responseString = responseStringStream.str();
			fwrite(responseString.data(), 1, responseString.size(), f);
			fclose(f);
		//	*/
			sendErrorsAsEmail(responseStringStream.str());
			return -9;
		}

		//sendErrorsAsEmail("<html><head><title>Hallo</title></head><body><font color='red'>Rote Test </font></body>");

		Poco::JSON::Object object = *parsedJson.extract<Poco::JSON::Object::Ptr>();
		auto state = object.get("state");
		std::string stateString = state.convert<std::string>();
		if (stateString == "error") {
			addError(new Error("SigningTransaction", "php server return error"));
			if (!object.isNull("msg")) {
				addError(new ParamError("SigningTransaction", "msg:", object.get("msg").convert<std::string>().data()));
			}
			if (!object.isNull("details")) {
				addError(new ParamError("SigningTransaction", "details:", object.get("details").convert<std::string>().data()));
			}
			sendErrorsAsEmail();
			return -10;
		}
		delete clientSession;
		//printf("state: %s\n", stateString.data());
		//int zahl = 1;
	}
	catch (Poco::Exception& e) {
		addError(new ParamError("SigningTransaction", "connect error to php server", e.displayText().data()));
		printf("url: %s\n", ServerConfig::g_php_serverHost.data());
		sendErrorsAsEmail();
		return -8;
	}
	

	return 0;
}