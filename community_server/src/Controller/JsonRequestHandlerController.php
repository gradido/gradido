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
              if(!isset($jsonData->transaction)) {
                return $this->returnJson(['state' => 'error', 'msg' => 'parameter error']);
              } else {
                return $this->putTransaction($jsonData->transaction);
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

    // Called from login server like a cron job every 10 minutes or after sending transaction to hedera
    private function updateReadNode()
    {
      $this->autoRender = false;
      $response = $this->response->withType('application/json');
      
      $transactionsTable = TableRegistry::getTableLocator()->get('Transactions');
      $last_transaction_query = $transactionsTable->find('all')->order(['id' => 'DESC']);
      $last_transaction_id = 0;
      if(!$last_transaction_query->isEmpty()) {
        $last_transaction_id = $last_transaction_query->first()->id;
      }
      $last_known_sequence_number = $last_transaction_id;
      
      if($last_transaction_query->count() < $last_transaction_id) {
        $last_transaction_id = $last_transaction_query->count();
      }
      //$last_transaction_id = 0;
      
      
      $group_alias = Configure::read('GroupAlias');
      $result = (array)$this->JsonRpcRequestClient->request('getTransactions', ['groupAlias' => $group_alias, 'lastKnownSequenceNumber' => $last_transaction_id]);
      if(isset($result['state']) && $result['state'] == 'error') {
        return $this->returnJson(['state' => 'error', 'msg' => 'jsonrpc error', 'details' => ['return' => $result, 'groupAlias' => $group_alias]]);
      }
      /* example
      $result = json_decode("[
   {
      \"record_type\":\"GRADIDO_TRANSACTION\",
      \"transaction\":{
         \"version_number\":1,
         \"signature\":{
            \"pubkey\":\"2ed28a1cf5e116d83615406bc577152221c2f774a5656f66a0e7540f7576d71b\",
            \"signature\":\"aed6725baacabf903e51f92503d49fa7e6b93c6402d56d9e3784be9a3366a77459213d858af46b579287aba8b1b63d206febce18bc80cec6fa63da6289e56403\"
         },
         \"signature_count\":1,
         \"hedera_transaction\":{
            \"consensusTimestamp\":{
               \"seconds\":1604392811,
               \"nanos\":172812
            },
            \"runningHash\":\"f9ccf04137be418c3117a28bb5add6dced9745bcab74b7a2f46c182c8c98eeabf0127c131d15ebea7d0ac376f5d2de45\",
            \"sequenceNumber\":94,
            \"runningHashVersion\":3
         },
         \"transaction_type\":\"ADD_USER\",
         \"add_user\":{
            \"user\":\"2ed28a1cf5e116d83615406bc577152221c2f774a5656f66a0e7540f7576d71b\"
         },
         \"result\":\"result\",
         \"parts\":1,
         \"memo\":\"\"
      }
   },
   {
      \"record_type\":\"GRADIDO_TRANSACTION\",
      \"transaction\":{
         \"version_number\":1,
         \"signature\":{
            \"pubkey\":\"8190bda585ee5f1d9fbf7d06e81e69ec18e13376104cff54b7457eb7d3ef710d\",
            \"signature\":\"3134adcd6cbccee17c2db398f91b6b6bdd098b6306fb2fa213eb9eb5a322af9078acca4d8b0383d4e906f3139eb3369e7c1ef0f3ac5fec724be0d085ba44af0b\"
         },
         \"signature_count\":2,
         \"hedera_transaction\":{
            \"consensusTimestamp\":{
               \"seconds\":1604392886,
               \"nanos\":1528
            },
            \"runningHash\":\"e1df5526331e3def11d6b652b8f248d20c250739b6eb98f1fe7b338901753d9d573a14601ba84f61318a48940b3c237a\",
            \"sequenceNumber\":95,
            \"runningHashVersion\":3
         },
         \"transaction_type\":\"ADD_USER\",
         \"add_user\":{
            \"user\":\"8190bda585ee5f1d9fbf7d06e81e69ec18e13376104cff54b7457eb7d3ef710d\"
         },
         \"result\":\"result\",
         \"parts\":2,
         \"memo\":\"\"
      }
   },
   {
      \"record_type\":\"SIGNATURES\",
      \"signature\":[
         {
            \"pubkey\":\"2ed28a1cf5e116d83615406bc577152221c2f774a5656f66a0e7540f7576d71b\",
            \"signature\":\"401717e768617c0f3311931c34a61e66ab362599a0e2a48ae7c4955645aec6573773985dafb84a11bfaf2bc12140c30b2f8c8ee094bc35d609bc56d15b4e9f04\"
         }
      ]
   },
   {
	  \"record_type\": \"GRADIDO_TRANSACTION\",
      \"transaction\":{
         \"version_number\":1,
         \"signature\":{
            \"pubkey\":\"2ed28a1cf5e116d83615406bc577152221c2f774a5656f66a0e7540f7576d71b\",
            \"signature\":\"99665dee9f2b475e426a2f449d0dae61924f6cf025903666ff72f2c7ef1af27523ebcd5fb684d17813fe7906b2f8cfe5ef4bdbb264ebf3ef80363491d9b86807\"
         },
         \"signature_count\":1,
         \"hedera_transaction\":{
            \"consensusTimestamp\":{
               \"seconds\":1604392904,
               \"nanos\":798541
            },
            \"runningHash\":\"f1fd03610a9788e9bac01e1efb8b99bafae450f9088cb940db954842e0799235c57d842be83d998e6c21786f77f967a7\",
            \"sequenceNumber\":96,
            \"runningHashVersion\":3
         },
         \"transaction_type\":\"GRADIDO_CREATION\",
         \"gradido_creation\":{
            \"user\":\"8190bda585ee5f1d9fbf7d06e81e69ec18e13376104cff54b7457eb7d3ef710d\",
            \"new_balance\":10000000,
            \"prev_transfer_rec_num\":0,
            \"amount\":10000000
         },
         \"result\":\"result\",
         \"parts\":1,
         \"memo\":\"\"
      }
   },
   {
	  \"record_type\": \"GRADIDO_TRANSACTION\",
      \"transaction\":{
         \"version_number\":1,
         \"signature\":{
            \"pubkey\":\"8190bda585ee5f1d9fbf7d06e81e69ec18e13376104cff54b7457eb7d3ef710d\",
            \"signature\":\"90125e0cfce61397d50ed9ba6c5df4cd4e0cf6fee8b10c70fee2898765982570d9a1208c222981429ae3c229e3fd36c2bf2333518cd0a4f0515937822e499d0b\"
         },
         \"signature_count\":1,
         \"hedera_transaction\":{
            \"consensusTimestamp\":{
               \"seconds\":1604392929,
               \"nanos\":52539
            },
            \"runningHash\":\"a4be8f54be4f806b61d31f6bd770d7742822f14f03ffe09c07f08bac3031a06d12de5e38fec5c307149c7faf6e9879b8\",
            \"sequenceNumber\":97,
            \"runningHashVersion\":3
         },
         \"transaction_type\":\"LOCAL_TRANSFER\",
         \"local_transfer\":{
            \"sender\":{
               \"user\":\"8190bda585ee5f1d9fbf7d06e81e69ec18e13376104cff54b7457eb7d3ef710d\",
               \"new_balance\":9825500,
               \"prev_transfer_rec_num\":0
            },
            \"receiver\":{
               \"user\":\"2ed28a1cf5e116d83615406bc577152221c2f774a5656f66a0e7540f7576d71b\",
               \"new_balance\":174500,
               \"prev_transfer_rec_num\":0
            },
            \"amount\":174500
         },
         \"result\":\"result\",
         \"parts\":1,
         \"memo\":\"\"
      }
   }
]", true);*/
      $part_count = -1;
      $temp_record = new Record;
      $errors = [];
      foreach($result['blocks'] as $_record) {
          if(is_string($_record)) continue;
          $parse_result = $temp_record->parseRecord($_record);
          
          if($parse_result == true) {
            $sequenceNumber = $temp_record->getSequenceNumber();
            if($part_count == -1) {
              $part_count = $temp_record->getPartCount();
            }
            $part_count--;
           
            if($part_count == 0) {
                if($sequenceNumber > $last_known_sequence_number) {
                    $finalize_result = $temp_record->finalize();
                    if($finalize_result !== true) {
                        $errors[] = ['msg' => 'error in finalize', 'record' => $_record, 'details' => $finalize_result, 'sequenceNumber' => $sequenceNumber];
                    }
                }
                
                $temp_record = new Record;
                $part_count = -1;
            }
          } else {
                $temp_record = new Record;
                $part_count = -1;
                $errors[] = ['msg' => 'error in parse record', 'record' => $_record, 'details' => $parse_result];
          }
      }
      if(count($errors)) {
        return $this->returnJson(['state' => 'error', 'msg' => 'error in parsing records', 'details' => $errors]);
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
  
    private function putTransaction($transactionBase64) {
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
      
      if ($transaction->save()) {
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
