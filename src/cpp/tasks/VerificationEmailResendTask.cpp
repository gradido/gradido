#include "VerificationEmailResendTask.h"

#include "../controller/User.h"
#include "../controller/EmailVerificationCode.h"

#include "../SingletonManager/EmailManager.h"

VerificationEmailResendTask::VerificationEmailResendTask(int userId)
	: mUserId(userId)

{


}

VerificationEmailResendTask::~VerificationEmailResendTask()
{

}


int VerificationEmailResendTask::run()
{
	auto user = controller::User::create();
	if (1 == user->load(mUserId)) {
		auto model = user->getModel();
		// if email is checked, we can exit 
		if (model->isEmailChecked()) {
			return 1;
		}
		auto email_verification = controller::EmailVerificationCode::load(mUserId, model::table::EMAIL_OPT_IN_REGISTER_DIRECT);
		if (nullptr == email_verification) {
			email_verification = controller::EmailVerificationCode::create(mUserId, model::table::EMAIL_OPT_IN_REGISTER_DIRECT);
			email_verification->getModel()->insertIntoDB(false);
		}
		else {
			email_verification->getModel()->addResendCountAndUpdate();
		}
		auto em = EmailManager::getInstance();
		em->addEmail(new model::Email(email_verification, user, model::EMAIL_USER_VERIFICATION_CODE_RESEND));
		
	}
	return 0;
}


VerificationEmailResendTimerTask::VerificationEmailResendTimerTask(int userId)
	: mUserId(userId)
{

}

VerificationEmailResendTimerTask::~VerificationEmailResendTimerTask()
{

}

void VerificationEmailResendTimerTask::run()
{
	UniLib::controller::TaskPtr verificationResendTask(new VerificationEmailResendTask(mUserId));
	verificationResendTask->scheduleTask(verificationResendTask);
}