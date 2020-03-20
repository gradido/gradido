#include "JsonAdminEmailVerificationResend.h"

#include "Poco/URI.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/EmailManager.h"

#include "../controller/User.h"
#include "../controller/EmailVerificationCode.h"

Poco::JSON::Object* JsonAdminEmailVerificationResend::handle(Poco::Dynamic::Var params)
{
	std::string email;
	int session_id = 0;
	Poco::JSON::Object* result = new Poco::JSON::Object;
	bool parameterReaded = false;
	// if is json object
	if (params.type() == typeid(Poco::JSON::Object::Ptr)) {
		Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
		/// Throws a RangeException if the value does not fit
		/// into the result variable.
		/// Throws a NotImplementedException if conversion is
		/// not available for the given type.
		/// Throws InvalidAccessException if Var is empty.
		try {
			paramJsonObject->get("email").convert(email);
			paramJsonObject->get("session_id").convert(session_id);
			parameterReaded = true;
		}
		catch (Poco::Exception& ex) {
			printf("[JsonGetRunningUserTasks::handle] try to use params as jsonObject: %s\n", ex.displayText().data());
			result->set("state", "error");
			result->set("msg", "json exception");
			result->set("details", ex.displayText());
		}
	}
	else if (params.isStruct()) {
		auto _email = params["email"];
		auto _session_id = params["session_id"];
		parameterReaded = true;
		//std::string miau = params["miau"];
	}
	else if (params.isVector()) {
		const Poco::URI::QueryParameters queryParams = params.extract<Poco::URI::QueryParameters>();
		for (auto it = queryParams.begin(); it != queryParams.end(); it++) {
			if (it->first == "email") {
				email = it->second;
				break;
			}
			else if (it->first == "session_id") {
				try {
					session_id = stoi(it->second);
				}
				catch (const std::invalid_argument& ia) {
					result->set("state", "error");
					result->set("msg", "error parsing query params, invalid argument: ");
					result->set("details", ia.what());
					return result;
				}
				catch (const std::out_of_range& oor) {
					result->set("state", "error");
					result->set("msg", "error parsing query params, Out of Range error: ");
					result->set("details", oor.what());
					return result;
				}
				catch (const std::logic_error & ler) {
					result->set("state", "error");
					result->set("msg", "error parsing query params, Logical error: ");
					result->set("details", ler.what());
					return result;
				}
				catch (Poco::Exception& ex) {
					//printf("[JsonGetLogin::handle] exception: %s\n", ex.displayText().data());
					result->set("state", "error");
					result->set("msg", "error parsing query params, Poco Error");
					result->set("details", ex.displayText());
					return result;
				}
			}
		}
		parameterReaded = true;
	}
	else if (params.isArray()) {
		result->set("state", "error");
		result->set("msg", "array not implemented yet");
	}
	else if (params.isList()) {
		result->set("state", "error");
		result->set("msg", "list not implemented yet");
	}
	else if (params.isString()) {
		result->set("state", "error");
		result->set("msg", "string not implemented yet");
	}
	else if (params.isDeque()) {
		result->set("state", "error");
		result->set("msg", "deque not implemented yet");
	}
	else {
		result->set("state", "error");
		result->set("msg", "format not implemented");
		result->set("details", std::string(params.type().name()));
	}

	if (parameterReaded && email != "" && session_id != 0) {
		auto sm = SessionManager::getInstance();
		auto em = EmailManager::getInstance();
		auto session = sm->getSession(session_id);
		if (session) {
			auto user = session->getNewUser();
			if (!user.isNull()) {
				auto userModel = user->getModel();
				if (userModel->getRole() == model::table::ROLE_ADMIN) {
					auto receiverUser = controller::User::create();
					if (1 == receiverUser->load(email)) {
						if (!receiverUser->getModel()->isEmailChecked()) {
							auto emailVerification = controller::EmailVerificationCode::create(receiverUser->getModel()->getID(), model::table::EMAIL_OPT_IN_REGISTER);
							if (!emailVerification.isNull()) {
								em->addEmail(new model::Email(emailVerification, receiverUser, model::EMAIL_ADMIN_USER_VERIFICATION_CODE_RESEND));
								result->set("state", "success");
							}
							else {
								result->set("state", "error");
								result->set("msg", "no email verification code found");
							}
						}
						else {
							result->set("state", "error");
							result->set("msg", "account already active");
						}
					}
					else {
						result->set("state", "error");
						result->set("msg", "receiver user not found");
					}
				}
				else {
					result->set("state", "error");
					result->set("msg", "user isn't admin");
				}
			}
			else {
				result->set("state", "error");
				result->set("msg", "session hasn't valid user");
			}
		}
		else {
			result->set("state", "error");
			result->set("msg", "session not found");
		}
		
		//result->set("runningTasks", tasksJson);
	}
	else if (parameterReaded) {
		result->set("state", "error");
		result->set("msg", "empty email or session_id");
	}
	else {
		result->set("state", "error");
		result->set("msg", "error reading parameter");
	}

	return result;
}