#!/bin/bash

cpspc.exe config.cpsp && cp ConfigPage.* ../cpp/HTTPInterface/
cpspc.exe login.cpsp && cp LoginPage.* ../cpp/HTTPInterface/
cpspc.exe resetPassword.cpsp && cp ResetPassword.* ../cpp/HTTPInterface/
cpspc.exe register.cpsp && cp RegisterPage.* ../cpp/HTTPInterface/
cpspc.exe registerAdmin.cpsp && cp RegisterAdminPage.* ../cpp/HTTPInterface/
cpspc.exe dashboard.cpsp && cp DashboardPage.* ../cpp/HTTPInterface/
cpspc.exe checkEmail.cpsp && cp CheckEmailPage.* ../cpp/HTTPInterface/
cpspc.exe saveKeys.cpsp && cp SaveKeysPage.* ../cpp/HTTPInterface/
cpspc.exe passphrase.cpsp && cp PassphrasePage.* ../cpp/HTTPInterface/
cpspc.exe UpdateUserPassword.cpsp && cp UpdateUserPasswordPage.* ../cpp/HTTPInterface/
cpspc.exe Error500.cpsp && cp Error500Page.* ../cpp/HTTPInterface/
cpspc.exe checkTransaction.cpsp && cp CheckTransactionPage.* ../cpp/HTTPInterface/
cpspc.exe decodeTransaction.cpsp && cp DecodeTransactionPage.* ../cpp/HTTPInterface/
cpspc.exe debugPassphrase.cpsp && cp DebugPassphrasePage.* ../cpp/HTTPInterface/
cpspc.exe adminCheckUserBackup.cpsp && cp AdminCheckUserBackup.* ../cpp/HTTPInterface/
cpspc.exe translatePassphrase.cpsp && cp TranslatePassphrase.* ../cpp/HTTPInterface/
cpspc.exe repairDefectPassphrase.cpsp && cp RepairDefectPassphrase.* ../cpp/HTTPInterface/
cpspc.exe PassphrasedTransaction.cpsp && cp PassphrasedTransaction.* ../cpp/HTTPInterface/
cpspc.exe debugMnemonic.cpsp && cp DebugMnemonicPage.* ../cpp/HTTPInterface/
cpspc.exe adminUserPasswordReset.cpsp && cp AdminUserPasswordReset.* ../cpp/HTTPInterface/
cpspc.exe register.cpsp && cp RegisterPage.* ../cpp/HTTPInterface/
cpspc.exe registerDirect.cpsp && cp RegisterDirectPage.* ../cpp/HTTPInterface/
cpspc.exe adminGroups.cpsp && cp AdminGroupsPage.* ../cpp/HTTPInterface/
cpspc.exe adminTopic.cpsp && cp AdminTopicPage.* ../cpp/HTTPInterface/
cpspc.exe adminHederaAccount.cpsp && cp AdminHederaAccountPage.* ../cpp/HTTPInterface/
cpspc.exe adminNodeServer.cpsp && cp AdminNodeServerPage.* ../cpp/HTTPInterface/

cd ../..
./compile_pot.sh
cd src/cpsp