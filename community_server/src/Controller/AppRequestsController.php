<?php
/*!
 * @author: Dario Rekowski
 * @date : 2020-12-01
 * @brief: Controller for all ajax-json requests caming from mobile app
 * 
 * Everything is allowed to call them, so caution!
 */

namespace App\Controller;

use App\Controller\AppController;
use Cake\ORM\TableRegistry;
use Cake\Http\Client;
use Cake\Core\Configure;


class AppRequestsController extends AppController 
{  
    public function initialize()
    {
        parent::initialize();
        $this->loadComponent('JsonRequestClient');
        //$this->loadComponent('JsonRpcRequestClient');
        //$this->Auth->allow(['add', 'edit']);
        $this->Auth->allow(['index', 'sendCoins', 'createCoins']);
    }
    
  
    public function index()
    {
        if($this->request->is('get')) {
          $method = $this->request->getQuery('method');
          switch($method) {
            
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
            
          }
          return $this->returnJson(['state' => 'error', 'msg' => 'unknown method for post', 'details' => $method]);
        }
        return $this->returnJson(['state' => 'error', 'msg' => 'no post or get']);
    }
    
    private function checkAndCopyRequiredFields($fields, &$param, $data = null) {
        if($data == null) {
            $data = $this->request->input('json_decode');
        }
        foreach($fields as $field) {
            if(is_array($field)) {
                $one_exist = false;
                foreach($field as $oneField) {
                    if(isset($data[$oneField])) {
                        $param[$oneField] = $data[$oneField];
                        $one_exist = true;
                        break;
                    }
                }
                if(!$one_exist) {
                    return ['state' => 'error', 'msg' => 'missing field of set', 'details' => $field];
                }
            } else {
                if(!isset($data[$field])) {
                    return ['state' => 'error', 'msg' => 'missing field', 'details' => $field . ' not found'];
                } else {
                    $param[$field] = $data[$field];
                }
            }
        }
        return true;
    }

    private function rewriteKeys(&$data, $replaceKeys)
    {
        foreach(array_keys($replaceKeys) as $key) {
            $newKey = $replaceKeys[$key];
            if(isset($data[$key])) {
                $data[$newKey] = $data[$key];
                unset($data[$key]);
            }
        }
    }
    
    private function parseParameterForCreateTransaction(&$param, $data = null)
    {
        if($data == null) {
            $data = $this->request->input('json_decode');
        }
        $session_id = 0;
        if(isset($data['session_id'])) {
            $session_id = $data['session_id'];
        }
        $login_request_result = $this->requestLogin($session_id, false);
        if($login_request_result !== true) {
            return $login_request_result;
        }
        $session = $this->getRequest()->getSession();
        $param['session_id'] = $session->read('session_id');
        $param['blockchain_type'] = $this->blockchainType;
        
        $this->rewriteKeys($data, ['email' => 'target_email', 'username' => 'target_username', 'pubkey' => 'target_pubkey']);
        $required_fields = $this->checkAndCopyRequiredFields(['amount', ['target_email', 'target_username', 'target_pubkey']], $param, $data);
        if($required_fields !== true) {
            return $required_fields;
        }
        
        if(intval($param['amount']) <= 0) {
            return ['state' => 'error', 'msg' => 'amount is invalid', 'details' => $param['amount']];
        }
        
        if(isset($data['memo'])) {
            $param['memo'] = $data['memo'];
        }
        
        if(isset($data['auto_sign'])) {
            $param['auto_sign'] = boolval($data['auto_sign']);
        }
        
        return true;
    }
    
    public function sendCoins()
    {
        /*
         * {
	"session_id" : -127182,
	"amount": 2000000,
	"email": "max.musterman@gmail.de",
	"memo":"Thank you :)",
        "group": "gdd1",
	"auto_sign": true
         */
        if(!$this->request->is('post')) {
            return $this->returnJson(['state' => 'error', 'msg' => 'no post']);
        }
        $data = $this->request->input('json_decode');
        $params = [];
        $result = $this->parseParameterForCreateTransaction($params, $data);
        if($result !== true) {
            return $this->returnJson($result);
        }
        $required_fields = $this->checkAndCopyRequiredFields(['target_date'], $params, $data);
        if($required_fields !== true) {
            return $this->returnJson($required_fields);
        }
        $params['transaction_type'] = 'transfer';
        
        $requestAnswear = $this->JsonRequestClient->sendRequest(json_encode($params), '/createTransaction');
        

        if('success' == $requestAnswear['state'] && 'success' == $requestAnswear['data']['state']) {
            $session = $this->getRequest()->getSession();
            $pendingTransactionCount = $session->read('Transactions.pending');
            if($pendingTransactionCount == null) {
              $pendingTransactionCount = 1;
            } else {
              $pendingTransactionCount++;
            }
            $session->write('Transactions.pending', $pendingTransactionCount);
            //echo "pending: " . $pendingTransactionCount;
            return $this->returnJson(['state' => 'success']);
        } else {

          /*
           * if request contain unknown parameter format, shouldn't happen't at all
           * {"state": "error", "msg": "parameter format unknown"}
           * if json parsing failed
           * {"state": "error", "msg": "json exception", "details":"exception text"}
           * if session_id is zero or not set
           * {"state": "error", "msg": "session_id invalid"}
           * if session id wasn't found on login server, if server was restartet or user logged out (also per timeout, default: 15 minutes)
           * {"state": "error", "msg": "session not found"}
           * if session hasn't active user, shouldn't happen't at all, login-server should be checked if happen
           * {"state": "code error", "msg":"user is zero"}
           * if transaction type not known
           * {"state": "error", "msg":"transaction_type unknown"}
           * if receiver wasn't known to Login-Server
           * {"state": "not found", "msg":"receiver not found"}
           * if receiver account disabled, and therefor cannto receive any coins
           * {"state": "disabled", "msg":"receiver is disabled"}
           * if transaction was okay and will be further proccessed
           * {"state":"success"}
           */
           $answear_data = $requestAnswear['data'];
           return $this->returnJson($answear_data);

        }
        
    }
    
    public function createCoins()
    {
        /*
         * "session_id" : -127182,
	 * "email": "max.musterman@gmail.de",
	 * "amount": 10000000,
	 * "target_date":"2021-02-19T13:25:36+00:00", 
	 * "memo":"AGE",
	 * "auto_sign": true
         */
        if(!$this->request->is('post')) {
            return $this->returnJson(['state' => 'error', 'msg' => 'no post']);
        }
        $data = $this->request->input('json_decode');
        $params = [];
        $result = $this->parseParameterForCreateTransaction($params, $data);
        if($result !== true) {
            return $this->returnJson($result);
        }
        $required_fields = $this->checkAndCopyRequiredFields(['target_date'], $params, $data);
        if($required_fields !== true) {
            return $this->returnJson($required_fields);
        }
        $params['transaction_type'] = 'creation';
        
        $requestAnswear = $this->JsonRequestClient->sendRequest(json_encode($params), '/createTransaction');

        if('success' == $requestAnswear['state'] && 'success' == $requestAnswear['data']['state']) {
            $session = $this->getRequest()->getSession();
            $pendingTransactionCount = $session->read('Transactions.pending');
            if($pendingTransactionCount == null) {
              $pendingTransactionCount = 1;
            } else {
              $pendingTransactionCount++;
            }
            $session->write('Transactions.pending', $pendingTransactionCount);
            //echo "pending: " . $pendingTransactionCount;
            return $this->returnJson(['state' => 'success']);
        } else {

          /*
           * if request contain unknown parameter format, shouldn't happen't at all
           * {"state": "error", "msg": "parameter format unknown"}
           * if json parsing failed
           * {"state": "error", "msg": "json exception", "details":"exception text"}
           * if session_id is zero or not set
           * {"state": "error", "msg": "session_id invalid"}
           * if session id wasn't found on login server, if server was restartet or user logged out (also per timeout, default: 15 minutes)
           * {"state": "error", "msg": "session not found"}
           * if session hasn't active user, shouldn't happen't at all, login-server should be checked if happen
           * {"state": "code error", "msg":"user is zero"}
           * if transaction type not known
           * {"state": "error", "msg":"transaction_type unknown"}
           * if receiver wasn't known to Login-Server
           * {"state": "not found", "msg":"receiver not found"}
           * if receiver account disabled, and therefor cannto receive any coins
           * {"state": "disabled", "msg":"receiver is disabled"}
           * if transaction was okay and will be further proccessed
           * {"state":"success"}
           */
           $answear_data = $requestAnswear['data'];
           return $this->returnJson($answear_data);

        }
        
    }
    
    private function acquireAccessToken($session_id)
    {
      
    }
    
}
  