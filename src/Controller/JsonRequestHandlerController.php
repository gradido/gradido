<?php

namespace App\Controller;

use App\Controller\AppController;
use Cake\ORM\TableRegistry;
use Cake\Routing\Router;
use Cake\Http\Client;
use Cake\Core\Configure;

use Model\Transactions\TransactionTransfer;
use Model\Transactions\Transaction;
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
          }
          return $this->returnJson(['state' => 'error', 'msg' => 'unknown method for post', 'details' => $method]);
        }
        return $this->returnJson(['state' => 'error', 'msg' => 'no post or get']);
    }
  
    private function putTransaction($transactionBase64) {
      $transaction = new Transaction($transactionBase64);
      if($transaction->hasErrors()) {
        return $this->returnJson(['state' => 'error', 'msg' => 'error parsing transaction', 'details' => $transaction->getErrors()]);
      }
      if(!$transaction->validate()) {
        return $this->returnJsonSaveError($transaction, ['state' => 'error', 'msg' => 'error validate transaction', 'details' => $transaction->getErrors()]);
      }
      
      if ($transaction->save()) {
        
        
        // success
        return $this->returnJson(['state' => 'success']);
      } else {
        return $this->returnJsonSaveError($transaction, [
            'state' => 'error', 
            'msg' => 'error saving transaction in db', 
            'details' => json_encode($transaction->getErrors())
        ]);
      }
      
      return $this->returnJson(['state' => 'success']);
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
      }
      return $this->returnJsonEncoded($json);
    }
    
    
    
}