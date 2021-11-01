#include "JsonRequestHandler.h"

#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"

#include "Poco/DeflatingStream.h"


#include "../ServerConfig.h"

#include "../lib/DataTypeConverter.h"
#include "../SingletonManager/SessionManager.h"

#include "../SingletonManager/SessionManager.h"

#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"

using namespace rapidjson;


JsonRequestHandler::JsonRequestHandler()
	: mSession(nullptr)
{

}

JsonRequestHandler::JsonRequestHandler(Session* session)
	: mSession(session)
{

}

JsonRequestHandler::JsonRequestHandler(Poco::Net::IPAddress clientIp)
	: mSession(nullptr), mClientIp(clientIp)
{

}
JsonRequestHandler::JsonRequestHandler(Session* session, Poco::Net::IPAddress clientIp)
	: mSession(session), mClientIp(clientIp)
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
	Document rapid_json_result;
	Document rapidjson_params;
	if (method == "POST" || method == "PUT") {
		// extract parameter from request
		parseJsonWithErrorPrintFile(request_stream, rapidjson_params);
	    
		if (rapidjson_params.IsObject()) {
			rapid_json_result = handle(rapidjson_params);
		}
		else {
			rapid_json_result = stateError("empty body");
		}
	}
	else if(method == "GET") {		
		Poco::URI uri(request.getURI());
		parseQueryParametersToRapidjson(uri, rapidjson_params);
		
		rapid_json_result = handle(rapidjson_params);
	}

	if (!rapid_json_result.IsNull()) {
		// 3. Stringify the DOM
		StringBuffer buffer;
		Writer<StringBuffer> writer(buffer);
		rapid_json_result.Accept(writer);

		responseStream << buffer.GetString() << std::endl;
	}
	if (rapid_json_result.IsObject())
	{
		int session_id = 0;
		getIntParameter(rapid_json_result, "session_id", session_id);
		
		if (session_id) {
			auto session = SessionManager::getInstance()->getSession(session_id);
			response.addCookie(session->getLoginCookie());
		}
		
	}

	//if (_compressResponse) _gzipStream.close();
}

bool JsonRequestHandler::parseQueryParametersToRapidjson(const Poco::URI& uri, Document& rapidParams)
{
	auto queryParameters = uri.getQueryParameters();
	rapidParams.SetObject();
	for (auto it = queryParameters.begin(); it != queryParameters.end(); it++) {
		int tempi = 0;
		Value name_field(it->first.data(), rapidParams.GetAllocator());
		if (DataTypeConverter::NUMBER_PARSE_OKAY == DataTypeConverter::strToInt(it->second, tempi)) {
			//rapidParams[it->first.data()] = rapidjson::Value(tempi, rapidParams.GetAllocator());
			rapidParams.AddMember(name_field.Move(), tempi, rapidParams.GetAllocator());
		}
		else {
			rapidParams.AddMember(name_field.Move(), Value(it->second.data(), rapidParams.GetAllocator()), rapidParams.GetAllocator());
		}
	}
	
	return true;
}

void JsonRequestHandler::parseJsonWithErrorPrintFile(std::istream& request_stream, Document& rapidParams, NotificationList* errorHandler /* = nullptr*/, const char* functionName /* = nullptr*/)
{
	// debugging answer

	std::stringstream responseStringStream;
	for (std::string line; std::getline(request_stream, line); ) {
		responseStringStream << line << std::endl;
	}

	rapidParams.Parse(responseStringStream.str().data());
	if (rapidParams.HasParseError()) {
		auto error_code = rapidParams.GetParseError();
		if (errorHandler) {
			errorHandler->addError(new ParamError(functionName, "error parsing request answer", error_code));
			errorHandler->addError(new ParamError(functionName, "position of last parsing error", rapidParams.GetErrorOffset()));
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
	}

}

Document JsonRequestHandler::stateError(const char* msg, std::string details)
{
	Document obj(kObjectType);
	auto alloc = obj.GetAllocator();
	obj.AddMember("state", "error", alloc);
	obj.AddMember("msg", Value(msg, alloc), alloc);
	
	if (details.size()) {
		obj.AddMember("details", Value(details.data(), alloc), alloc);
	}

	return obj;
}


rapidjson::Document JsonRequestHandler::stateError(const char* msg, NotificationList* errorReciver)
{
	Document obj(kObjectType);
	obj.AddMember("state", "error", obj.GetAllocator());
	obj.AddMember("msg", Value(msg, obj.GetAllocator()).Move(), obj.GetAllocator());
	Value details(kArrayType);
	auto error_vec = errorReciver->getErrorsArray();
	for (auto it = error_vec.begin(); it != error_vec.end(); it++) {
		details.PushBack(Value(it->data(), obj.GetAllocator()).Move(), obj.GetAllocator());
	}
	obj.AddMember("details", details.Move(), obj.GetAllocator());

	return obj;
}

Document JsonRequestHandler::stateSuccess()
{
	Document obj(kObjectType);
	obj.AddMember("state", "success", obj.GetAllocator());

	return obj;
}


Document JsonRequestHandler::customStateError(const char* state, const char* msg, std::string details /* = "" */ )
{
	Document obj(kObjectType);
	obj.AddMember("state", Value(state, obj.GetAllocator()).Move(), obj.GetAllocator());
	obj.AddMember("msg", Value(msg, obj.GetAllocator()).Move(), obj.GetAllocator());
	
	if (details.size()) {
		obj.AddMember("details", Value(details.data(), obj.GetAllocator()).Move(), obj.GetAllocator());
	}
	return obj;
}


Document JsonRequestHandler::stateWarning(const char* msg, std::string details/* = ""*/)
{
	Document obj(kObjectType);
	obj.AddMember("state", "warning", obj.GetAllocator());
	obj.AddMember("msg", Value(msg, obj.GetAllocator()).Move(), obj.GetAllocator());

	if (details.size()) {
		obj.AddMember("details", Value(details.data(), obj.GetAllocator()).Move(), obj.GetAllocator());
	}

	return obj;
}


bool JsonRequestHandler::getTargetGroup(const Document& params)
{
	std::string group_alias;
	int group_id = 0;
	Value::ConstMemberIterator itr = params.FindMember("group");
	if (itr != params.MemberEnd()) {
		if (itr->value.IsString()) {
			group_alias = itr->value.GetString();
		}
		else if (itr->value.IsInt()) {
			group_id = itr->value.GetInt();
		}
	}
	if (!group_alias.size() && !group_id) {
		getStringParameter(params, "group_alias", group_alias);
		if (!group_alias.size()) {
			getIntParameter(params, "group_id", group_id);
		}
	}
	std::vector<Poco::AutoPtr<controller::Group>> groups;
	if (group_alias.size()) {
		groups = controller::Group::load(group_alias);
		if (groups.size() == 1) {
			mTargetGroup = groups[0];
			return true;
		}
	}
	else if (group_id) {
		mTargetGroup = controller::Group::load(group_id);
		return true;
	}
	return false;
}

Document JsonRequestHandler::getIntParameter(const Document& params, const char* fieldName, int& iparameter)
{
	Value::ConstMemberIterator itr = params.FindMember(fieldName);
	std::string message = fieldName;
	if (itr == params.MemberEnd()) {
		message += " not found";
		return stateError(message.data());
	}
	if (!itr->value.IsInt()) {
		message = "invalid " + message;
		return stateError(message.data());
	}
	iparameter = itr->value.GetInt();
	return Document();
}

Document JsonRequestHandler::getBoolParameter(const rapidjson::Document& params, const char* fieldName, bool& bParameter)
{
	Value::ConstMemberIterator itr = params.FindMember(fieldName);
	std::string message = fieldName;
	if (itr == params.MemberEnd()) {
		message += " not found";
		return stateError(message.data());
	}
	if (!itr->value.IsBool()) {
		message = "invalid " + message;
		return stateError(message.data());
	}
	bParameter = itr->value.GetBool();
	return Document();
}

Document JsonRequestHandler::getUIntParameter(const Document& params, const char* fieldName, unsigned int& iParameter)
{
	Value::ConstMemberIterator itr = params.FindMember(fieldName);
	std::string message = fieldName;
	if (itr == params.MemberEnd()) {
		message += " not found";
		return stateError(message.data());
	}
	if (!itr->value.IsUint()) {
		message = "invalid " + message;
		return stateError(message.data());
	}
	iParameter = itr->value.GetUint();
	return Document();
}

Document JsonRequestHandler::getUInt64Parameter(const Document& params, const char* fieldName, Poco::UInt64& iParameter)
{
	Value::ConstMemberIterator itr = params.FindMember(fieldName);
	std::string message = fieldName;
	if (itr == params.MemberEnd()) {
		message += " not found";
		return stateError(message.data());
	}
	if (!itr->value.IsUint64()) {
		message = "invalid " + message;
		return stateError(message.data());
	}
	iParameter = itr->value.GetUint64();
	return Document();
}
Document JsonRequestHandler::getStringParameter(const Document& params, const char* fieldName, std::string& strParameter)
{
	Value::ConstMemberIterator itr = params.FindMember(fieldName);
	std::string message = fieldName;
	if (itr == params.MemberEnd()) {
		message += " not found";
		return stateError(message.data());
	}
	if (!itr->value.IsString()) {
		message = "invalid " + message;
		return stateError(message.data());
	}
	strParameter = std::string(itr->value.GetString(), itr->value.GetStringLength());
	return Document();
}

Document JsonRequestHandler::getStringIntParameter(const Document& params, const char* fieldName, std::string& strParameter, int& iParameter)
{
	Value::ConstMemberIterator itr = params.FindMember(fieldName);
	std::string message = fieldName;
	if (itr == params.MemberEnd()) {
		message += " not found";
		return stateError(message.data());
	}
	if (itr->value.IsString()) {
		strParameter = std::string(itr->value.GetString(), itr->value.GetStringLength());
	}
	else if (itr->value.IsInt()) {
		iParameter = itr->value.GetInt();
	}
	else {
		message += " isn't neither int or string"; 
		return stateError(message.data());
	}
	
	return Document();
}

Document JsonRequestHandler::checkArrayParameter(const Document& params, const char* fieldName)
{
	
	Value::ConstMemberIterator itr = params.FindMember(fieldName);
	std::string message = fieldName;
	if (itr == params.MemberEnd()) {
		message += " not found";
		return stateError(message.data());
	}
	
	if (!itr->value.IsArray()) {
		message += " is not a array";
		return stateError(message.data());
	}

	return Document();
}

Document JsonRequestHandler::checkObjectParameter(const Document& params, const char* fieldName)
{
	Value::ConstMemberIterator itr = params.FindMember(fieldName);
	std::string message = fieldName;
	if (itr == params.MemberEnd()) {
		message += " not found";
		return stateError(message.data());
	}

	if (!itr->value.IsObject()) {
		message += " is not a object";
		return stateError(message.data());
	}

	return Document();
}

Document JsonRequestHandler::checkAndLoadSession(const Document& params)
{
	if (!mSession) {
		int session_id = 0;

		Value::ConstMemberIterator itr = params.FindMember("session_id");
		
		if (itr == params.MemberEnd()) {
			return stateError("session_id not found");
		}
		else if (itr->value.IsInt64()) {
			session_id = static_cast<int>(itr->value.GetInt64());
		}
		else if (itr->value.IsInt()) {
			session_id = static_cast<int>(itr->value.GetInt());
		}		
		else if (itr->value.IsUint64()) {
			session_id = static_cast<int>(itr->value.GetUint64());
		}
		else if (itr->value.IsUint()) {
			session_id = static_cast<int>(itr->value.GetUint());
		}
		else if (itr->value.IsString()) {
			DataTypeConverter::strToInt(itr->value.GetString(), session_id);
		}
		else {
			return stateError("session_id is unhandled type");
		}
		
		if (!session_id) {
			return stateError("empty session id");
		}

		auto sm = SessionManager::getInstance();
		mSession = sm->getSession(session_id);
	}
	if (!mSession) {
		return customStateError("not found", "session not found");
	}
	// doesn't work perfect, must be debugged first
	bool checkIp = false;
	if (checkIp) {
		if (mClientIp.isLoopback()) {
			return stateError("client ip is loop back ip");
		}
		if (!mSession->isIPValid(mClientIp)) {
			return stateError("client ip differ from login client ip");
		}
	}
	auto userNew = mSession->getNewUser();
	//auto user = session->getUser();
	if (userNew.isNull()) {
		return customStateError("not found", "Session didn't contain user");
	}
	auto userModel = userNew->getModel();
	if (userModel.isNull()) {
		return customStateError("not found", "User is empty");
	}

	return Document();
}