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
        $this->loadComponent('JsonRpcRequestClient');
        //$this->Auth->allow(['add', 'edit']);
        $this->Auth->allow(['index', 'sendCoins']);
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
    
    private function checkRequiredFields($data, $fields) {
        foreach($fields as $field) {
            if(!isset($data[$field])) {
                return ['state' => 'error', 'msg' => 'missing field', 'details' => $field . ' not found'];
            }
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
        $login_request_result = $this->requestLogin(0, false);
        if($login_request_result !== true) {
            return $this->returnJson($login_request_result);
        }
        $session = $this->getRequest()->getSession();
        $required_fields = $this->checkRequiredFields($data, ['amount', 'email']);
        if($required_fields !== true) {
            return $this->returnJson($required_fields);
        }
        $amount = $data['amount'];
        if(intval($amount) <= 0) {
            return $this->returnJson(['state' => 'error', 'msg' => 'amount is invalid', 'details' => $amount]);
        }
        $email = $data['email'];
        if($email == '') {
            return $this->returnJson(['state' => 'error', 'msg' => 'email is empty']);
        }
        $memo =  '';
        if(isset($data['memo'])) {
            $memo = $data['memo'];
        }
        $auto_sign = false;
        if(isset($data['auto_sign'])) {
            $auto_sign = boolval($data['auto_sign']);
        }
        $group = '';
        if(isset($data['group'])) {
            $group = $data['group'];
        } else {
            $group = Configure::read('GroupAlias');
        }
        
        $requestAnswear = $this->JsonRequestClient->sendRequest(json_encode([
                'session_id' => $session->read('session_id'),
                'transaction_type' => 'transfer',
                'memo' => $memo,
                'amount' => $amount,
                'target_group' => $group,
                'target_email'  => $email,
                'auto_sign' => $auto_sign,
                'blockchain_type' => $this->blockchainType
        ]), '/createTransaction');

        if('success' == $requestAnswear['state'] && 'success' == $requestAnswear['data']['state']) {
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
  