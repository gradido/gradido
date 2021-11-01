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

use Cake\I18n\FrozenTime;

class AppRequestsController extends AppController 
{  
    public function initialize()
    {
        parent::initialize();
        $this->loadComponent('JsonRequestClient');
        $this->loadComponent('GradidoNumber');
        //$this->loadComponent('JsonRpcRequestClient');
        //$this->Auth->allow(['add', 'edit']);
        $this->Auth->allow([
            'index', 'sendCoins', 'createCoins', 'getBalance', 
            'listTransactions','listGDTTransactions', 'getDecayStartBlock',
            'findUserPublicKey'
        ]);
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
                    if(isset($data->$oneField)) {
                        $param[$oneField] = $data->$oneField;
                        $one_exist = true;
                        break;
                    }
                }
                if(!$one_exist) {
                    return ['state' => 'error', 'msg' => 'missing field of set', 'details' => $field];
                }
            } else {
                if(!isset($data->$field)) {
                    return ['state' => 'error', 'msg' => 'missing field', 'details' => $field . ' not found'];
                } else {
                    $param[$field] = $data->$field;
                }
            }
        }
        return true;
    }

    private function rewriteKeys(&$data, $replaceKeys)
    {
        foreach(array_keys($replaceKeys) as $key) {
            $newKey = $replaceKeys[$key];
            if(isset($data->$key)) {
                $data->$newKey = $data->$key;
                unset($data->$key);
            }
        }
    }
    
    private function parseParameterForCreateTransaction(&$param, $data = null)
    {
        if($data == null) {
            $data = $this->request->input('json_decode');
        }
        $session_id = 0;
        if(isset($data->session_id)) {
            $session_id = $data->session_id;
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
        
        if(floatval($param['amount']) <= 0.0) {
            return ['state' => 'error', 'msg' => 'amount is invalid', 'details' => $param['amount']];
        }
        $param['amount'] = $this->GradidoNumber->parseInputNumberToCentNumber($param['amount']);
        
        if(isset($data->memo)) {
            $param['memo'] = $data->memo;
        }
        
        if(isset($data->auto_sign)) {
            $param['auto_sign'] = boolval($data->auto_sign);
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
        
        if(!isset($params['memo']) || strlen($params['memo']) < 5 || strlen($params['memo']) > 150) {
            return $this->returnJson(['state' => 'error', 'msg' => 'memo is not set or not in expected range [5;150]']);
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
    
    public function getBalance($session_id = 0)
    {
        $this->viewBuilder()->setLayout('ajax');
        $login_result = $this->requestLogin($session_id, false);
        if($login_result !== true) {
            $this->set('body', $login_result);
            return;
        }
        $session = $this->getRequest()->getSession();
        $user = $session->read('StateUser');
        $state_balances_table = TableRegistry::getTableLocator()->get('StateBalances');
        $state_balances_table->updateBalances($user['id']);
        
        $state_balance = $state_balances_table->find()->where(['state_user_id' => $user['id']])->first();

        
        $now = new FrozenTime();
        if(!$state_balance) {
            $body = [
                'state' => 'success',
                'balance' => 0,
                'decay' => 0
            ];
        } else {
        
            $body = [
                'state' => 'success',
                'balance' => $state_balance->amount,
                'decay' => $state_balance->partDecay($now),
            ];
        }
        
        $body['decay_date'] = $now;
        $this->set('body', $body);
    }
    
    public function listTransactions($page = 1, $count = 25, $orderDirection = 'ASC', $session_id = 0)
    {
        $this->viewBuilder()->setLayout('ajax');
        $startTime = microtime(true);
        
        $login_result = $this->requestLogin($session_id, false);
        
        if($login_result !== true) {
            return $this->returnJson($login_result);
        }
        $session = $this->getRequest()->getSession();
        $user = $session->read('StateUser');
                
        $stateBalancesTable = TableRegistry::getTableLocator()->get('StateBalances');
        $stateUserTransactionsTable = TableRegistry::getTableLocator()->get('StateUserTransactions');
        $transactionsTable  = TableRegistry::getTableLocator()->get('Transactions');
        
        $stateBalancesTable->updateBalances($user['id']);
        
        $gdtSum = 0;        
        
        $gdtEntries = $this->JsonRequestClient->sendRequestGDT(['email' => $user['email']], 'GdtEntries' . DS . 'sumPerEmailApi');
        
        if('success' == $gdtEntries['state'] && 'success' == $gdtEntries['data']['state']) {
          $gdtSum = intval($gdtEntries['data']['sum']);
        } else {
          $this->addAdminError('StateBalancesController', 'overview', $gdtEntries, $user['id'] ? $user['id'] : 0);
        }

        //echo "count: $count, page: $page<br>";
        $limit = $count;
        $offset = 0;
        $skip_first_transaction = false;
        if($page > 1) {
            $offset = (( $page - 1 ) * $count) - 1;
            $limit++;
        }
        
        if($offset && $orderDirection == 'ASC') {
            $offset--;
        }
        
        //echo "limit: $limit, offset: $offset, skip first transaction: $skip_first_transaction<br>";
        $stateUserTransactionsQuery = $stateUserTransactionsTable
                                        ->find()
                                        ->where(['state_user_id' => $user['id']])
                                        ->order(['balance_date' => $orderDirection])
                                        ->contain([])
                                        ->limit($limit)
                                        //->page($page)
                                        ->offset($offset)
                                        ;
        $state_user_transactions_count = $stateUserTransactionsQuery->count();
        if($state_user_transactions_count > $offset + $limit) {
            $skip_first_transaction = true;
        }
        
        $decay = true;
        if($page > 1) {
            $decay = false;
        }
        $transactions = [];
        $transactions_from_db = $stateUserTransactionsQuery->toArray();

        if(count($transactions_from_db)) {
            if($orderDirection == 'DESC') {
                $transactions_from_db = array_reverse($transactions_from_db);
            }
            
            $transactions = $transactionsTable->listTransactionsHumanReadable($transactions_from_db, $user, $decay, $skip_first_transaction);
            //echo "transactions count: " .  count($transactions) . "<br>";
            if($orderDirection == 'DESC') {
                $transactions = array_reverse($transactions);
            }
        } 
        
        $state_balance = $stateBalancesTable->find()->where(['state_user_id' => $user['id']])->first();
        
        $body = [
            'state' => 'success',
            'transactions' => $transactions,
            'transactionExecutingCount' => $session->read('Transactions.executing'),
            'count' => $state_user_transactions_count,
            'gdtSum' => $gdtSum,
            'timeUsed' => microtime(true) - $startTime
        ];
        $now = new FrozenTime();
        $body['decay_date'] = $now;
        
        if(!$state_balance) {
            $body['balance'] = 0.0;
            $body['decay'] = 0.0;
        } else {
            $body['balance'] = $state_balance->amount;
            $body['decay'] = $stateBalancesTable->calculateDecay($state_balance->amount, $state_balance->record_date, $now);
        }

        $this->set('body', $body);       
    }
    
    public function listGDTTransactions($page = 1, $count = 25, $orderDirection = 'ASC', $session_id = 0)
    {
        $timeBegin = microtime(true);
        $this->viewBuilder()->setLayout('ajax');
        
        $login_result = $this->requestLogin($session_id, false);
        
        if($login_result !== true) {
            return $this->returnJson($login_result);
        }
        $session = $this->getRequest()->getSession();
        $user = $session->read('StateUser');

        if(!$user) {
          return $this->returnJson(['state' => 'error', 'msg' => 'user not found', 'details' => 'exist a valid session cookie?']);
        }

        $gdtEntries = $this->JsonRequestClient->sendRequestGDT([
                    'email' => $user['email'],
                    'page' => $page, 
                    'count' => $count,
                    'orderDirection' => $orderDirection
                ], 'GdtEntries' . DS . 'listPerEmailApi');
        
        if('success' == $gdtEntries['state']) {
          $timeEnd = microtime(true);
          $gdtEntries['data']['timeUsed'] = $timeEnd - $timeBegin;
          return $this->returnJson($gdtEntries['data']);
          
        } else {
          if($user) {
            $this->addAdminError('StateBalancesController', 'ajaxGdtOverview', $gdtEntries, $user['id']);
          } else {
            $this->addAdminError('StateBalancesController', 'ajaxGdtOverview', $gdtEntries, 0);
          }
        }
        return $this->returnJson(['state' => 'error', 'msg' => 'error by requesting gdt server', 'details' => $gdtEntries]);
    }
    
    public function getDecayStartBlock()
    {
        $transactionsTable  = TableRegistry::getTableLocator()->get('Transactions');
        $decayStartBlock = $transactionsTable->find()->where(['transaction_type_id' => 9]);
        if(!$decayStartBlock->count()) {
            return $this->returnJson(['state' => 'error', 'msg' => 'not found']);
        }
        return $this->returnJson(['state' => 'success', 'decay_start' => $decayStartBlock->first()->received]);
    }

    public function findUserPublicKey($var) {
        $this->viewBuilder()->setLayout('ajax');
        $requestResult = $this->JsonRequestClient->sendRequest(['ask' => ['account_publickey' => $var]], 'search');
        return $this->returnJson($requestResult);      
    }
    
    private function acquireAccessToken($session_id)
    {
      
    }
    
}
  
