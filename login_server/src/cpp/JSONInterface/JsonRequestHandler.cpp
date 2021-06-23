#include "JsonRequestHandler.h"

#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"

#include "Poco/URI.h"
#include "Poco/DeflatingStream.h"

#include "Poco/JSON/Parser.h"

#include "../ServerConfig.h"

#include "../lib/DataTypeConverter.h"
#include "../SingletonManager/SessionManager.h"

#include "../SingletonManager/SessionManager.h"

JsonRequestHandler::JsonRequestHandler()
	: mSession(nullptr)
{

}

JsonRequestHandler::JsonRequestHandler(Session* session)
	: mSession(session)
{

}

void JsonRequestHandler::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(false);
	response.setContentType("application/json");
	if (ServerConfig::g_AllowUnsecureFlags & ServerConfig::UNSECURE_CORS_ALL) {
		response.set("Access-Control-Allow-Origin", "*");
		response.set("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
	}
	//bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	//if (_compressResponse) response.set("Content-Encoding", "gzip");

	std::ostream& responseStream = response.send();
	//Poco::DeflatingOutputStream _gzipStream(_responseStream, Poco::DeflatingStreamBuf::STREAM_GZIP, 1);
	//std::ostream& responseStream = _compressResponse ? _gzipStream : _responseStream;

	mClientIp = request.clientAddress().host();
	
	if (request.secure()) {
		mServerHost = "https://" + request.getHost();
	}
	else {
		mServerHost = "http://" + request.getHost();
	}
	auto method = request.getMethod();
	std::istream& request_stream = request.stream();
	Poco::JSON::Object* json_result = nullptr;
	if (method == "POST" || method == "PUT") {
		// extract parameter from request
		Poco::Dynamic::Var parsedResult = parseJsonWithErrorPrintFile(request_stream);
	
		if (parsedResult.size() != 0) {
			try {
				json_result = handle(parsedResult);
			}
			catch (Poco::Exception& ex) {
				json_result = stateError("poco Exception in handle POST Request", ex.displayText());
			}
		}
		else {
			json_result = stateError("empty body");
		}
	}
	else if(method == "GET") {		
		Poco::URI uri(request.getURI());
		auto queryParameters = uri.getQueryParameters();
		try {
			json_result = handle(queryParameters);
		}
		catch (Poco::Exception& ex) {
			json_result = stateError("poco Exception in handle GET Request", ex.displayText());
		}
	}

	if (json_result) {
		if (!json_result->isNull("session_id")) {
			int session_id = 0;
			try {
				json_result->get("session_id").convert(session_id);
			}
			catch (Poco::Exception& e) {
				NotificationList erros;
				erros.addError(new Error("json request", "invalid session_id"));
				erros.sendErrorsAsEmail();
			}
			if (session_id) {
				auto session = SessionManager::getInstance()->getSession(session_id);
				response.addCookie(session->getLoginCookie());
			}
		}
		json_result->stringify(responseStream);
		delete json_result;
	}

	//if (_compressResponse) _gzipStream.close();
}


Poco::Dynamic::Var JsonRequestHandler::parseJsonWithErrorPrintFile(std::istream& request_stream, NotificationList* errorHandler /* = nullptr*/, const char* functionName /* = nullptr*/)
{
	// debugging answer

	std::stringstream responseStringStream;
	for (std::string line; std::getline(request_stream, line); ) {
		responseStringStream << line << std::endl;
	}

	// extract parameter from request
	Poco::JSON::Parser jsonParser;
	Poco::Dynamic::Var parsedJson;
	try {
		parsedJson = jsonParser.parse(responseStringStream.str());

		return parsedJson;
	}
	catch (Poco::Exception& ex) {
		if (errorHandler) {
			errorHandler->addError(new ParamError(functionName, "error parsing request answer", ex.displayText().data()));
			errorHandler->sendErrorsAsEmail(responseStringStream.str());
		} 
		std::string dateTimeString = Poco::DateTimeFormatter::format(Poco::DateTime(), "%d_%m_%yT%H_%M_%S");
		std::string filename = dateTimeString + "_response.html";
		FILE* f = fopen(filename.data(), "wt");
		if (f) {
			std::string responseString = responseStringStream.str();
			fwrite(responseString.data(), 1, responseString.size(), f);
			fclose(f);
		}
		return Poco::Dynamic::Var();
	}
	return Poco::Dynamic::Var();
}

Poco::JSON::Object* JsonRequestHandler::stateError(const char* msg, std::string details)
{
	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "error");
	result->set("msg", msg);
	if (details != "") {
		result->set("details", details);
	}
	return result;
}
Poco::JSON::Object* JsonRequestHandler::stateError(const char* msg, const Poco::JSON::Array& details)
{
	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "error");
	result->set("msg", msg);
	result->set("details", details);

	return result;
}

Poco::JSON::Object* JsonRequestHandler::stateError(const char* msg, NotificationList* errorReciver)
{
	assert(errorReciver);
	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "error");
	result->set("msg", msg);
	result->set("details", errorReciver->getErrorsArray());

	return result;
}

Poco::JSON::Object* JsonRequestHandler::stateSuccess()
{
	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "success");
	return result;
}

Poco::JSON::Object* JsonRequestHandler::customStateError(const char* state, const char* msg, std::string details/* = ""*/)
{
	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", state);
	result->set("msg", msg);
	if (details != "") {
		result->set("details", details);
	}
	return result;
}

Poco::JSON::Object* JsonRequestHandler::stateWarning(const char* msg, std::string details/* = ""*/)
{
	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "warning");
	result->set("msg", msg);
	if (details != "") {
		result->set("details", details);
	}
	return result;
}


Poco::JSON::Object* JsonRequestHandler::checkAndLoadSession(Poco::Dynamic::Var params, bool checkIp/* = false*/)
{
	int session_id = 0;
	auto sm = SessionManager::getInstance();

	if (params.isStruct()) {
		session_id = params["session_id"];
		//std::string miau = params["miau"];
	}
	else if (params.isVector()) {
		try {
			const Poco::URI::QueryParameters queryParams = params.extract<Poco::URI::QueryParameters>();
			for (auto it = queryParams.begin(); it != queryParams.end(); it++) {
				if (it->first == "session_id") {
					auto numberParseResult = DataTypeConverter::strToInt(it->second, session_id);
					if (DataTypeConverter::NUMBER_PARSE_OKAY != numberParseResult) {
						return stateError("error parsing session_id", DataTypeConverter::numberParseStateToString(numberParseResult));
					}
					break;
				}
			}
			//auto var = params[0];
		}
		catch (Poco::Exception& ex) {
			return stateError("error parsing query params, Poco Error", ex.displayText());
		}
	}
	else if (params.type() == typeid(Poco::JSON::Object::Ptr)) {
		try {
			Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
			auto session_id_obj = paramJsonObject->get("session_id");
			if (session_id_obj.isEmpty()) {
				return stateError("missing session_id");
			}
			session_id_obj.convert(session_id);
		}
		catch (Poco::Exception& ex) {
			return stateError("Poco Exception by reading session_id", ex.what());
		}
	}

	if (!session_id) {
		return stateError("empty session id");
	}

	auto session = sm->getSession(session_id);
	if (!session) {
		return customStateError("not found", "session not found");
	}
	if (checkIp) {
		if (mClientIp.isLoopback()) {
			return stateError("client ip is loop back ip");
		}
		if (!session->isIPValid(mClientIp)) {
			return stateError("client ip differ from login client ip");
		}
	}
	auto userNew = session->getNewUser();
	//auto user = session->getUser();
	if (userNew.isNull()) {
		return customStateError("not found", "Session didn't contain user");
	}
	auto userModel = userNew->getModel();
	if (userModel.isNull()) {
		return customStateError("not found", "User is empty");
	}
	mSession = session;
	return nullptr;
	
}
