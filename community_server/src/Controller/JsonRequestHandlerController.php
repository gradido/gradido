<?php

namespace App\Controller;

use App\Controller\AppController;
use Cake\ORM\TableRegistry;
use Cake\Http\Client;
use Cake\Core\Configure;
use Cake\Mailer\Email;

use Model\Transactions\TransactionTransfer;
use Model\Transactions\Transaction;
use Model\Transactions\Record;
use Model\Transactions\GradidoBlock;
/*!
 * @author: Dario Rekowski#
 * 
 * @date: 03.11.2019
 * 
 * @desc: Handle requests from other server put or request transaction
 */

class JsonRequestHandlerController extends AppController {
  
    public function initialize()
    {
        parent::initialize();
        $this->loadComponent('JsonRequestClient');
        $this->loadComponent('JsonRpcRequestClient');
        //$this->Auth->allow(['add', 'edit']);
        $this->Auth->allow('index');
    }
    
  
    public function index()
    {
        if($this->request->is('get')) {
          $method = $this->request->getQuery('method');
          switch($method) {
            case 'getRunningUserTasks': return $this->getRunningUserTasks();
          }
          return $this->returnJson(['state' => 'error', 'msg' => 'unknown method for get', 'details' => $method]);
        }
        else if($this->request->is('post')) {
          $jsonData = $this->request->input('json_decode');
          //var_dump($jsonData);
          if($jsonData == NULL || !isset($jsonData->method)) {
            return $this->returnJson(['state' => 'error', 'msg' => 'parameter error']);
          }
          $method = $jsonData->method;
        
          switch($method) {
            case 'putTransaction': 
              if(!isset($jsonData->transaction) || !isset($jsonData->type)) {
                return $this->returnJson(['state' => 'error', 'msg' => 'parameter error']);
              } else {
                return $this->putTransaction($jsonData->transaction, $jsonData->type);
              }
            case 'userDelete': return $this->userDelete($jsonData->user);
            case 'moveTransaction': return $this->moveTransaction($jsonData->pubkeys, $jsonData->memo, $jsonData->session_id);
            case 'checkUser': return $this->checkUser($jsonData->email, $jsonData->last_name);
            case 'getUsers' : return $this->getUsers($jsonData->page, $jsonData->limit);
            case 'getUserBalance': return $this->getUserBalance($jsonData->email, $jsonData->last_name);
            case 'errorInTransaction': return $this->errorInTransaction($jsonData);
            case 'updateReadNode': return $this->updateReadNode();
            case 'addUser' : return $this->addUser($jsonData->user);
          }
          return $this->returnJson(['state' => 'error', 'msg' => 'unknown method for post', 'details' => $method]);
        }
        return $this->returnJson(['state' => 'error', 'msg' => 'no post or get']);
    }

    private function addUser($newUser) 
    {
        $stateUsersTable = TableRegistry::getTableLocator()->get('StateUsers');
        $entity = $stateUsersTable->newEntity();
        $required_fields = ['first_name', 'last_name', 'email', 'public_key', 'disabled'];
        foreach($required_fields as $required_field) {
            if(!isset($newUser->$required_field)) {
                return $this->returnJson(['state' => 'error', 'msg' => 'missing required field in addUser', 'details' => $required_field]);
            }
            if('public_key' == $required_field) {
                $entity->$required_field = hex2bin($newUser->public_hex);
            } else {
                $entity->$required_field = $newUser->$required_field;
            }
        }
        if($stateUsersTable->save($entity)) {
            return $this->returnJson(['state' => 'success']);
        } else {
            return $this->returnJson(['state' => 'error', 'msg' => 'error saving state_user', 'details' => $entity->getErrors()]);
        }
    }

    // Called from login server like a cron job every 10 minutes or after sending transaction to iota
    private function updateReadNode()
    {
      $this->autoRender = false;
      $response = $this->response->withType('application/json');
      
      $transactionsTable = TableRegistry::getTableLocator()->get('Transactions');
      $last_transaction_query = $transactionsTable
                                    ->find('all')
                                    ->where(['transaction_state_id' => 3]) // use only confirmed transactions as orientation
                                    ->order(['nr' => 'DESC'])
                                    ->limit(1)
                                    ;
      $last_transaction_nr = 0;
      if(!$last_transaction_query->isEmpty()) {
        $last_transaction_nr = $last_transaction_query->first()->nr;
      }     
      
      $group_alias = Configure::read('GroupAlias');
      $result = (array)$this->JsonRpcRequestClient->request('getTransactions', ['group' => $group_alias, 'fromTransactionId' => $last_transaction_nr+1]);
      if(isset($result['state']) && $result['state'] == 'error') {
        return $this->returnJson(['state' => 'error', 'msg' => 'jsonrpc error', 'details' => ['return' => $result, 'group' => $group_alias]]);
      }
      
      foreach($result['transactions'] as $i => $transactionBase64) {
          $gradidoBlock = new GradidoBlock($transactionBase64);
          if($gradidoBlock->hasErrors()) {
            return $this->returnJson(['state' => 'error', 'msg' => 'parse from base64 failed', 'details' => $gradidoBlock->getErrors()]);
          }
          if($gradidoBlock->getId() != $last_transaction_nr + $i + 1) {
            return $this->returnJson(['state' => 'error', 'msg' => 'transaction id not expected', 'details' => [
              'id' => $gradidoBlock->getId(),
              'expected' => $last_transaction_nr + $i + 1
            ]]);
          }
          $alreadyExist = $gradidoBlock->checkWithDb();
          if($alreadyExist) {
            // transaction exist in db
            $gradidoBlock->updateState(3);
            if($gradidoBlock->hasErrors()) {
              $this->log('error by comparing a existing transaction: '. json_encode($gradidoBlock->getErrors()), 'debug');
              $gradidoBlock->clearErrors();
              // transaction exist in db but it isn't complete, signature(s) and/or tx hash are missing
              $gradidoBlock->saveSignatureTxHash(true);
              if($gradidoBlock->hasErrors()) {
                return $this->returnJson(['state' => 'error', 'msg' => 'error by updating signature or tx hash', 'details' => $gradidoBlock->getErrors()]);
              }
            }
            continue;
          } else if($gradidoBlock->hasErrors()){
            $this->log('error by comparing a non-existing transaction: '. json_encode($gradidoBlock->getErrors()), 'debug');
            $gradidoBlock->clearErrors();

            // transaction with this nr found in db, but it is another transaction
            // so this transaction was added in between it is probably a cross group transaction
            // move it on step up 
            $gradidoBlock->updateNr($gradidoBlock->getId() + 1);
          }
          
          if(!$gradidoBlock->validate()) {
            return $this->returnJson(['state' => 'error', 'msg' => 'validate failed', 'details' =>  $gradidoBlock->getErrors()]);
          }
          if(!$gradidoBlock->save()) {
            return $this->returnJson(['state' => 'error', 'msg' => 'save failed', 'details' =>  $gradidoBlock->getErrors()]);
          }
      }
      return $this->returnJson(['state' => 'success']);
    }

    /*
     * payload.set("created", created);
     * payload.set("id", task_model->getID());
     * payload.set("type", task_model->getTaskTypeString());
     * payload.set("public_key", user_model->getPublicKeyHex());
     * payload.set("error", error);
     * payload.set("errorMessage", errorDetails);
     */
    //! \param $transactionCreated creation of transaction in timestamp in seconds
    //!        -1 if transaction couldn't decode
    //! \param $transactionBodyBase64Sha256 generic hash from transaction body serialized and converted to base64 
    //!        using sodium_crypto_generichash to calculate
    //         hash also in base64 format
    //! \param $error short error name in user language
    //! \param $errorDetails more detailed error message in user language
    private function errorInTransaction($jsonData) {
      $stateErrorTable = TableRegistry::getTableLocator()->get('StateErrors');
      $stateUsersTable = TableRegistry::getTableLocator()->get('StateUsers');
      $transactionTypesTable = TableRegistry::getTableLocator()->get('TransactionTypes');
      $stateError = $stateErrorTable->newEntity();
      //
      $pubkey = hex2bin($jsonData->public_key);
      $user_query = $stateUsersTable->find('all')->select(['id'])->where(['public_key' => $pubkey]);
      if($user_query->count() != 1) {
        return $this->returnJson(['state' => 'error', 'msg' => 'user not found', 'details' => 'user pubkey hex:' . $jsonData->public_key]);
      }
      $stateError->state_user_id = $user_query->first()->id;
      //$stateError->transaction_type_id
      // TODO:
      // - show state errors in navi_notify.ctp
      $transaction_type_query = $transactionTypesTable->find('all')->select(['id'])->where(['name' => $jsonData->type]);
      if($transaction_type_query->count() != 1) {
        return $this->returnJson(['state' => 'error', 'msg' => 'transaction type not found', 'details' => 'transaction type name: ' . $jsonData->type]);
      }
      $stateError->transaction_type_id = $transaction_type_query->first()->id;
      $stateError->created = $jsonData->created;
      $stateError->message_json = json_encode(['task_id' => $jsonData->id, 'error' => $jsonData->error, 'errorMessage' => $jsonData->errorMessage]);
      if(!$stateErrorTable->save($stateError)) {
        $this->returnJsonSaveError($stateError, [
            'state' => 'error', 
            'msg' => 'error saving state_error in db', 
            'details' => json_encode($stateError->getErrors())
        ]);
      }
      return $this->returnJson(['state' => 'success']);
    }
    
    private function sendEMailTransactionFailed($transaction, $reason_type)
    {
        $disable_email = Configure::read('disableEmail', false);  
        if($disable_email) {
            return;
        }
        $transaction_body = $transaction->getTransactionBody();
        $senderUser = $transaction->getFirstSigningUser();
        if($transaction_body != null) {
            $transaction_type_name = $transaction_body->getTransactionTypeName();
        
            if($transaction_type_name === 'transfer') {
                $senderUser = $transaction_body->getSpecificTransaction()->getSenderUser();
            } 
        }
      // send notification email
        $noReplyEmail = Configure::read('noReplyEmail');
        if($senderUser) {
          try {
            $email = new Email();
            $emailViewBuilder = $email->viewBuilder();
            $emailViewBuilder->setTemplate('notificationTransactionFailed')
                             ->setVars(['user' => $senderUser, 'transaction' => $transaction, 'reason' => $reason_type]);
            $receiverNames = $senderUser->getNames();
            if($receiverNames == '' || $senderUser->email == '') {
              $this->addError('TransactionCreation::sendNotificationEmail', 'to email is empty for user: ' . $senderUser->id);
              return false;
            }
            $email->setFrom([$noReplyEmail => 'Gradido (nicht antworten)'])
                  ->setTo([$senderUser->email => $senderUser->getNames()])
                  ->setSubject(__('Gradido Transaktion fehlgeschlagen!'))
                  ->send();
          } catch(Exception $e) {
                $this->addAdminError('JsonRequestController', 'sendEMailTransactionFailed', [$e->getMessage(), $reason_type], $senderUser->id);

          }        
       }
    }
  
    // TODO: save transaction by iota blockchain in another way 
    private function putTransaction($transactionBase64, $blockchainType) {
      $transaction = new Transaction($transactionBase64);
      
      if($transaction->hasErrors()) {
        $this->sendEMailTransactionFailed($transaction, 'parse');
        return $this->returnJson(['state' => 'error', 'msg' => 'error parsing transaction', 'details' => $transaction->getErrors()]);
      }
      
      if(!$transaction->validate()) {
          //$transaction_details
        $this->sendEMailTransactionFailed($transaction, 'validate');
        return $this->returnJsonSaveError($transaction, [
            'state' => 'error',
            'msg' => 'error validate transaction',
            'details' => $transaction->getErrors()
        ]);
      }
      
      if ($transaction->save($blockchainType)) {
          $result = ['state' => 'success'];
          if($transaction->hasWarnings()) {
              $result['warnings'] = $transaction->getWarnings();
          }
        // success
        return $this->returnJson($result);
      } else {
          
        $this->sendEMailTransactionFailed($transaction, 'save');
        return $this->returnJsonSaveError($transaction, [
            'state' => 'error', 
            'msg' => 'error saving transaction in db', 
            'details' => json_encode($transaction->getErrors())
        ]);
      }
    }
    
    private function moveTransaction($pubkeys, $memo, $session_id) {
      //$pubkeys->sender
      //$pubkeys->receiver
      $stateUserTable = TableRegistry::getTableLocator()->get('StateUsers');
      $user = $stateUserTable->find('all')->where(['public_key' => hex2bin($pubkeys->sender)])->contain(['StateBalances']);
      if(!$user->count()) {
        return $this->returnJson(['state' => 'not found', 'msg' => 'user not found or empty balance']);
      }
      $amountCent = $user->first()->state_balances[0]->amount;
      //var_dump($user->first());
      $builderResult = TransactionTransfer::build(
                    $amountCent, 
                    $memo,
                    $pubkeys->receiver,
                    $pubkeys->sender
            );
      if($builderResult['state'] === 'success') {

        $http = new Client();
        try {
          $loginServer = Configure::read('LoginServer');
          $url = $loginServer['host'] . ':' . $loginServer['port'];
       
          $response = $http->post($url . '/checkTransaction', json_encode([
              'session_id' => $session_id,
              'transaction_base64' => base64_encode($builderResult['transactionBody']->serializeToString()),
              'balance' => $amountCent
          ]), ['type' => 'json']);
          $json = $response->getJson();
          if($json['state'] != 'success') {
            if($json['msg'] == 'session not found') {
              return $this->returnJson(['state' => 'error', 'msg' => 'session not found']);
            } else {
              //$this->Flash->error(__('login server return error: ' . json_encode($json)));
              return $this->returnJson(['state' => 'error', 'msg' => 'login server return error', 'details' => $json]);
            }
          } else {
            return $this->returnJson(['state' => 'success']);
          }

        } catch(\Exception $e) {
            $msg = $e->getMessage();
            //$this->Flash->error(__('error http request: ') . $msg);
            return $this->returnJson(['state' => 'error', 'msg' => 'error http request', 'details' => $msg]);
        }

      } else {
        return $this->returnJson(['state' => 'error', 'msg' => 'error building transaction']);
      }
    }
    
    private function userDelete($userPubkeyHex) {
      $stateUserTable = TableRegistry::getTableLocator()->get('StateUsers');
      $user = $stateUserTable->find('all')->where(['public_key' => hex2bin($userPubkeyHex)]);
      if(!$user || $user->count == 0) {
        return $this->returnJson(['state' => 'error', 'msg' => 'user not found']);
      }
      
    }
    
    private function checkUser($email, $last_name) {
      $userTable = TableRegistry::getTableLocator()->get('Users');
      $user = $userTable->find('all')
              ->where(['email' => $email])
              ->contain([])
              ->select(['first_name', 'last_name', 'email']);
      if(!$user->count()) {
        return $this->returnJson(['state' => 'not found', 'msg' => 'user not found']);
      }
      if($user->count() == 1 && $user->first()->last_name == $last_name) {
        return $this->returnJson(['state' => 'success']);
      }
      return $this->returnJson(['state' => 'not identical', 'user' => $user->toArray()]);
    }
    
    private function getUserBalance($email, $last_name) {
     
      $stateUserTable = TableRegistry::getTableLocator()->get('StateUsers');
      $stateUsers = $stateUserTable->find('all')->where(['OR' => ['email' => $email, 'last_name' => $last_name]])->contain(['StateBalances']);
      $gdds  = [];
      foreach($stateUsers as $stateUser) {
        foreach($stateUser->state_balances as $stateBalance) {
          if(!isset($gdds[$stateUser->email])) {
            $gdds[$stateUser->email] = [];
          }
          if(!isset($gdds[$stateUser->email][$stateUser->last_name])) {
            $gdds[$stateUser->email][$stateUser->last_name] = 0;
          }
          $gdds[$stateUser->email][$stateUser->last_name] += $stateBalance->amount;
        }
      }
      return $this->returnJson(['state' => 'success', 'gdds' => $gdds]);
    }
    
    private function getUsers($page, $count) {
      
      $userTable = TableRegistry::getTableLocator()->get('Users');
      $this->paginate = [
        'limit' => $count,
        'page' => $page
      ];
      $usersQuery = $userTable->find('all')
                              ->select(['first_name', 'last_name', 'email'])
                              ->order(['id']);
      try {
        return $this->returnJson(['state' => 'success', 'users' => $this->paginate($usersQuery)]);
      } catch (Exception $ex) {
        return $this->returnJson(['state' => 'exception', 'msg' => 'error paginate users', 'details' => $ex->getMessage()]);
      }
       
      
      //return $this->returnJson(['state' => 'success', 'users' => $users->toArray()]);
       
    }
    
    private function getRunningUserTasks() {
      $session = $this->getRequest()->getSession();
      $state_user_email = $session->read('StateUser.email');
      $requestResult = $this->JsonRequestClient->getRunningUserTasks($state_user_email);;
      return $this->returnJson($requestResult);
    }    
    
    private function returnJsonSaveError($transaction, $errorArray) {
      $json = json_encode($errorArray);
      $stateUserTable = TableRegistry::getTableLocator()->get('StateUsers');
      $pub = $transaction->getFirstPublic();
      $stateUserQuery = $stateUserTable
                            ->find('all')
                            ->where(['public_key' => $pub])
                            ->contain(false);
      if($stateUserQuery->count() == 1) {
        $stateErrorsTable = TableRegistry::getTableLocator()->get('StateErrors');
        $stateErrorEntity = $stateErrorsTable->newEntity();
        $stateErrorEntity->state_user_id = $stateUserQuery->first()->id;
        $stateErrorEntity->transaction_type_id = $transaction->getTransactionBody()->getTransactionTypeId();
        $stateErrorEntity->message_json = $json;
        $stateErrorsTable->save($stateErrorEntity);
      } else {
	$errorArray['user_error'] = "user with $pub not found";
	$json = json_encode($errorArray);
      }

      return $this->returnJsonEncoded($json);
    }
    
    
    
}
