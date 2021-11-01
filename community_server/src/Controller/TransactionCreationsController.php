<?php
namespace App\Controller;

use App\Controller\AppController;
use Cake\ORM\TableRegistry;
use Cake\Routing\Router;
//use Cake\I18n\Number;
use Cake\Http\Client;
use Cake\Core\Configure;
use Cake\I18n\FrozenDate;
use Cake\Datasource\ConnectionManager;

use Model\Navigation\NaviHierarchy;
use Model\Navigation\NaviHierarchyEntry;

use App\Form\CreationForm;
// protobuf transactions
//use Model\Messages\Gradido\TransactionCreation;
use Model\Transactions\TransactionCreation;

/**
 * TransactionCreations Controller
 *
 * @property \App\Model\Table\TransactionCreationsTable $TransactionCreations
 *
 * @method \App\Model\Entity\TransactionCreation[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class TransactionCreationsController extends AppController
{

    public function initialize()
    {
        parent::initialize();
        $this->loadComponent('GradidoNumber');
        $this->loadComponent('JsonRequestClient');
        //$this->Auth->allow(['add', 'edit']);
        //$this->Auth->allow('create');
        $this->Auth->allow('ajaxCreate');
        $this->set(
            'naviHierarchy',
            (new NaviHierarchy())->
            add(new NaviHierarchyEntry(__('Startseite'), 'Dashboard', 'index', false))->add(new NaviHierarchyEntry(__('Gradido schöpfen'), 'TransactionCreations', 'create-multi', true))
        );
    }
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['Transactions', 'StateUsers']
        ];
        $transactionCreations = $this->paginate($this->TransactionCreations);
        $identHashes = [];
        /*foreach ($transactionCreations as $creation) {
            $identHash = TransactionCreation::DRMakeStringHash($creation->state_user->email);
            $identHashes[$creation->state_user->id] = $identHash;
        }*/

        //$this->set(compact('transactionCreations', 'identHashes'));
    }

    /**
     * View method
     *
     * @param string|null $id Transaction Creation id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $transactionCreation = $this->TransactionCreations->get($id, [
            'contain' => ['Transactions', 'StateUsers']
        ]);

        $this->set('transactionCreation', $transactionCreation);
    }

    public function create()
    {
        $startTime = microtime(true);
        $this->viewBuilder()->setLayout('frontend');
        $session = $this->getRequest()->getSession();
        $user = $session->read('StateUser');
        if (!$user) {
            $result = $this->requestLogin();
            if ($result !== true) {
                return $result;
            }
            $user = $session->read('StateUser');
        }
        $creationForm = new CreationForm();
        $transactionCreation = $this->TransactionCreations->newEntity();
        $transactionCreation->state_user_id  = $user['id'];

        // adding possible addresses + input field for copy
        $stateUserTable = TableRegistry::getTableLocator()->get('StateUsers');
        $stateUsers = $stateUserTable->find('all')->contain(false);
        $receiverProposal = [];
        foreach ($stateUsers as $stateUser) {
            $name = $stateUser->email;
            $keyHex = bin2hex(stream_get_contents($stateUser->public_key));
            if ($name === null) {
                $name = $stateUser->first_name . ' ' . $stateUser->last_name;
            }
            array_push($receiverProposal, ['name' => $name, 'key' => $keyHex, 'email' => $stateUser->email]);
          //$stateUser->public_key
        }
        $timeUsed = microtime(true) - $startTime;
        $this->set(compact('transactionCreation', 'timeUsed', 'receiverProposal', 'creationForm'));

        if ($this->request->is('post')) {
            $requestData = $this->request->getData();
            $mode = 'next';
            if (isset($requestData['add'])) {
                $mode = 'add';
            }
            if ($creationForm->validate($requestData)) {
                $pubKeyHex = '';
                $identHash = '';
                $amountCent = $this->GradidoNumber->parseInputNumberToCentNumber($requestData['amount']);
                $receiverIndex = intval($requestData['receiver'])-1;

                if (count($receiverProposal) > $receiverIndex) {
                    $pubKeyHex = $receiverProposal[$receiverIndex]['key'];
                    //$identHash = TransactionCreation::DRMakeStringHash($receiverProposal[$receiverIndex]['email']);
                }
                $builderResult = TransactionCreation::build(
                    $amountCent,
                    $requestData['memo'],
                    $pubKeyHex
                );
                if ($builderResult['state'] == 'success') {
                    $user_balance = 0;
                    if (isset($user['balance'])) {
                        $user_balance = $user['balance'];
                    }
                    // $session_id, $base64Message, $user_balance = 0
                    $requestResult = $this->JsonRequestClient->sendTransaction(
                        $session->read('session_id'),
                        base64_encode($builderResult['transactionBody']->serializeToString()),
                        $user_balance
                    );
                    if ($requestResult['state'] != 'success') {
                          $this->addAdminError('TransactionCreations', 'create', $requestResult, $user['id']);
                        if ($requestResult['type'] == 'request error') {
                            $this->Flash->error(__('Error by requesting LoginServer, please try again'));
                        } else {
                            $this->Flash->error(__('Error, please wait for the admin to fix it'));
                        }
                    } else {
                        $json = $requestResult['data'];
                        if ($json['state'] != 'success') {
                            if ($json['msg'] == 'session not found') {
                                      $session->destroy();
                                      return $this->redirect($this->loginServerUrl . 'account', 303);
                            } else {
                                    $this->addAdminError('TransactionCreations', 'create', $json, $user['id']);
                                    $this->Flash->error(__('Login Server Error, please wait for the admin to fix it'));
                            }
                        } else {
                            $pendingTransactionCount = $session->read('Transactions.pending');
                            if ($pendingTransactionCount == null) {
                                $pendingTransactionCount = 1;
                            } else {
                                $pendingTransactionCount++;
                            }
                            $session->write('Transactions.pending', $pendingTransactionCount);
                            if ($mode === 'next') {
                                return $this->redirect($this->loginServerUrl . 'account/checkTransactions', 303);
                            } else {
                                $this->Flash->success(__('Transaction submitted for review.'));
                            }
                        }
                    }
                } else {
                    $this->Flash->error(__('Building transaction failed'));
                }
  //           */
            } else {
                $this->Flash->error(__('Something was invalid, please try again!'));
            }
        }
    }

    public function createMulti($page = 0)
    {
        $startTime = microtime(true);
        $this->viewBuilder()->setLayout('frontend');
        $session = $this->getRequest()->getSession();
        $result = $this->requestLogin();
        $limit = 200;
        if ($result !== true) {
            return $result;
        }
        $user = $session->read('StateUser');

        $stateUserTable = TableRegistry::getTableLocator()->get('StateUsers');

        $connection = ConnectionManager::get('default');
        $transactionActiveMonth = $connection->execute(
            'SELECT id, received FROM transactions '
                . 'where received >= date_sub(date_add(curdate(), interval 1 - day(curdate()) day), interval 2 month) '
                . 'AND '
                . 'received < date_add(date_add(curdate(), interval 1 - day(curdate()) day), interval 2 month) '
                . 'AND '
                . 'transaction_type_id = 1'
        )->fetchAll('assoc');
        $transactionActiveMonthSortedById = [];
        foreach ($transactionActiveMonth as $t) {
            $transactionActiveMonthSortedById[$t['id']] = $t['received'];
        }
        $firstDayLastMonth = new FrozenDate();
        $firstDayLastMonth = $firstDayLastMonth->day(1)->subMonth(1);
        $transactionsLastMonthTargeDate = $this->TransactionCreations
                ->find('all')
                //->select(['state_user_id', 'target_date', 'amount'])
                ->where(['EXTRACT(YEAR_MONTH FROM target_date) LIKE' => $firstDayLastMonth->format('Ym')])
                ->group(['state_user_id'])
                ->contain([]);
        $transactionsLastMonthTargeDate->select([
            'state_user_id',
            'sum_amount' => $transactionsLastMonthTargeDate->func()->sum('amount')
        ]);

        $transactionsLastMonthTargetDateSortedByStateUserId = [];
        foreach ($transactionsLastMonthTargeDate as $transactionCreation) {
            $transactionsLastMonthTargetDateSortedByStateUserId[$transactionCreation->state_user_id] = $transactionCreation->sum_amount;
        }

        $requestData = $this->request->getData();
        if ($this->request->is('post') &&
          isset($requestData['searchButton']) &&
          isset($requestData['searchText']) &&
          !empty($requestData['searchText'])
        ) {
            $mode = 'search';
            $page = 0;
            $this->log("search for text: ".$requestData['searchText'], 'debug');
            $stateUsers = $stateUserTable
                ->find('all')
                ->select(['id', 'first_name', 'last_name', 'email'])
                ->order(['first_name', 'last_name'])
                ->where(
                    ['AND' => [
                        'disabled' => 0,
                            'OR' => [
                                      'LOWER(first_name) LIKE' => '%'.strtolower($requestData['searchText']).'%',
                                      'LOWER(last_name) LIKE' => '%'.strtolower($requestData['searchText']).'%',
                                      'LOWER(email) LIKE' => '%'.strtolower($requestData['searchText']).'%'
                                    ]
                                ]
                            ]
                )
                ->contain(['TransactionCreations' => [
                    'fields' => [
                        'TransactionCreations.amount',
                        'TransactionCreations.transaction_id',
                        'TransactionCreations.state_user_id'
                    ]
                ]]);
            $this->log("search query: ".$stateUsers, 'debug');
        } else {
            $stateUsers = $stateUserTable
                ->find('all')
                ->select(['id', 'first_name', 'last_name', 'email'])
                //->order(['id'])
				->where(['disabled' => 0])
                ->order(['first_name', 'last_name'])
                ->contain(['TransactionCreations' => [
                    'fields' => [
                        'TransactionCreations.amount',
                        'TransactionCreations.transaction_id',
                        'TransactionCreations.state_user_id'
                    ]
                ]]);
        }

        //var_dump($stateUsers->toArray());
        $possibleReceivers = [];
        $countUsers = 0;
        foreach ($stateUsers as $i => $stateUser) {
            $countUsers++;
            if ($i < $page * $limit || $i >= ($page + 1) * $limit) {
                continue;
            }
            $sumAmount = 0;
            $sumAmount2 = 0;
            if (isset($transactionsLastMonthTargetDateSortedByStateUserId[$stateUser->id])) {
                $sumAmount2 = $transactionsLastMonthTargetDateSortedByStateUserId[$stateUser->id];
            }
            foreach ($stateUser->transaction_creations as $transactionCreation) {
              //var_dump($transactionCreation);
                if (isset($transactionActiveMonthSortedById[$transactionCreation->transaction_id])) {
                    $sumAmount += $transactionCreation->amount;
                }
            }

          //if($sumAmount < 20000000) {
            array_push($possibleReceivers, [
                'name' => $stateUser->first_name . '&nbsp;' . $stateUser->last_name,
                'id' => $stateUser->id,
                'email' => $stateUser->email,
                'amount' => $sumAmount,
                'amount2' => $sumAmount2
                ]);
          /*} else {
            $this->Flash->error(__('Creation above 2.000 GDD for 2 last two month'));
          }*/
        }
        // usort($possibleReceivers, function ($a, $b) {
        //     return (strtolower($a['name']) <=> strtolower($b['name']));
        // });
        // -> replaced by SQL "order by" above
        $creationForm = new CreationForm();

        $timeUsed = microtime(true) - $startTime;
        $this->set(compact('timeUsed', 'stateUsers', 'creationForm', 'possibleReceivers'));

        $this->set('firstDayLastMonth', $firstDayLastMonth);
        $this->set('activeUser', $user);
        $this->set('creationForm', $creationForm);
        $this->set('transactionExecutingCount', $session->read('Transactions.executing'));
        $this->set('timeUsed', microtime(true) - $startTime);
        $this->set('countUsers', $countUsers);
        $this->set('limit', $limit);
        $this->set('page', $page);

        if ($this->request->is('post') && (!isset($mode) || !($mode === 'search'))) {
            $this->log("real POST", 'debug');
            $mode = 'next';
            if (isset($requestData['add'])) {
                $mode = 'add';
            }
            //echo "mode: $mode<br>";
            $memo = $requestData['memo'];
            $amountCent = $this->GradidoNumber->parseInputNumberToCentNumber($requestData['amount']);
          //$targetDate = $requestData['target_date'];
            if (!isset($requestData['user']) || count($requestData['user']) == 0) {
                $this->Flash->error(__('No user selected'));
            } else {
                $users = $requestData['user'];
                $pendingTransactionCount = $session->read('Transactions.pending');
                if ($pendingTransactionCount == null) {
                  $pendingTransactionCount = 0;
                }
                if (isset($requestData['user_pending'])) {
                    $pendings = $requestData['user_pending'];
                } else {
                    $pendings = [];
                }
                $receiverUsers = $stateUserTable->find('all')
                                                ->where(['id IN' => array_keys($users)])
                                                ->select(['public_key', 'email', 'id'])
                                                ->contain(false);
                
                foreach ($receiverUsers as $receiverUser) {
                    $localAmountCent = $amountCent;
                    //$localTargetDate = $targetDate;
                    $id = $receiverUser->id;
                    if ($requestData['user_amount'][$id] != '') {
                        $localAmountCent = $this->GradidoNumber->parseInputNumberToCentNumber($requestData['user_amount'][$id]);
                    }
                    if (isset($requestData['user_target_date']) && isset($requestData['user_target_date'][$id])) {
                        $localTargetDate = $requestData['user_target_date'][$id];
                    }
                    if (isset($pendings[$id])) {
                        $pendings[$id] += $localAmountCent;
                    } else {
                        $pendings[$id] = $localAmountCent;
                    }
                    $pubKeyHex = bin2hex(stream_get_contents($receiverUser->public_key));
                    $requestAnswear = $this->JsonRequestClient->sendRequest(json_encode([
                        'session_id' => $session->read('session_id'),
                        'email' => $receiverUser->email,
                        'ask' => ['user.identHash']
                    ]), '/getUserInfos');
                    
                    $identHash = 0;
                    if('success' == $requestAnswear['state'] && 'success' == $requestAnswear['data']['state']) {
                        $identHash = $requestAnswear['data']['userData']['identHash'];
                    } else {
                        $this->Flash->error(__('Error by requesting LoginServer, please try again'));
                    }
                    
                    //$identHash = TransactionCreation::DRMakeStringHash($receiverUser->email);
                    $localTargetDateFrozen = FrozenDate::now();
                    $localTargetDateFrozen = $localTargetDateFrozen
                                             ->year($localTargetDate['year'])
                                             ->month($localTargetDate['month'])
                                             ->day($localTargetDate['day']);
                    
                    $requestAnswear = $this->JsonRequestClient->sendRequest(json_encode([
                        'session_id' => $session->read('session_id'),
                        'transaction_type' => 'creation',
                        'memo' => $memo,
                        'amount' => $localAmountCent,
                        'target_pubkey'  => $pubKeyHex,
                        'target_date' => $localTargetDateFrozen,
                        'blockchain_type' => $this->blockchainType
                    ]), '/createTransaction');
                    
                    if('success' != $requestAnswear['state']) {
                      $this->addAdminError('TransactionCreations', 'createMulti', $requestAnswear, $user['id']);
                        if ($requestResult['type'] == 'request error') {
                            $this->Flash->error(__('Error by requesting LoginServer, please try again (' . $requestResult['details'] . ')' ));
                        } else {
                            $this->Flash->error(__('Error, please wait for the admin to fix it'));
                        }
                    }
                    if('success' == $requestAnswear['state'] && 'success' == $requestAnswear['data']['state']) {
                      $pendingTransactionCount++;
                      //echo "pending transaction count: $pendingTransactionCount<br>";
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
                      * if amount is invalid in creation
                      * {"state": "invalid parameter", "msg":"invalid amount", "details":"GDD amount in GDD cent ]0,10000000]"}
                      * if transaction was okay and will be further proccessed
                      * {"state":"success"}
                      */
                      $answear_data = $requestAnswear['data'];
                      if($answear_data['state'] === 'error') {
                        if($answear_data['msg'] === 'session_id invalid' || $answear_data['msg'] === 'session not found') {
                          $this->Flash->error(__('Fehler mit der Session, bitte logge dich erneut ein!'));
                          $this->set('timeUsed', microtime(true) - $startTime);
                          return;
                        }
                        if($answear_data['msg'] === 'user not in group') {
                          $this->Flash->error(__('Fehler, Benutzer gehört zu einer anderen Gruppe!'));
                          $this->set('timeUsed', microtime(true) - $startTime);
                          return;
                        }
                      } else if($answear_data['state'] === 'not found' && $answear_data['msg'] === 'receiver not found') {
                         $this->Flash->error(__('Der Empfänger wurde nicht auf dem Login-Server gefunden, hat er sein Konto schon angelegt?'));
                         $this->set('timeUsed', microtime(true) - $startTime);
                         return;
                      } else if($answear_data['state'] === 'disabled') {
                         $this->Flash->error(__('Der Empfänger ist deaktiviert, daher können ihm zurzeit keine Gradidos gesendet werden.'));
                         $this->set('timeUsed', microtime(true) - $startTime);
                         return;
                      } else if($answear_data['msg'] === 'invalid amount') {
                        $this->Flash->error(__('Der Betrag ist ungültig, er muss größer als 0 und <= 1000 sein.'));
                        $this->set('timeUsed', microtime(true) - $startTime);
                         return;
                      } else {
                         $this->Flash->error(__('Unbehandelter Fehler: ') . json_encode($answear_data));
                         $this->set('timeUsed', microtime(true) - $startTime);
                         return;
                      }
                    }
                    
                }
                /*echo "pendings: ";
                var_dump($pendings);
                echo "<br>";*/
                foreach ($possibleReceivers as $i => $possibleReceiver) {
                    $id = $possibleReceiver['id'];
                    if (isset($pendings[$id])) {
                        $possibleReceivers[$i]['pending'] = $pendings[$id];
                    }
                }
                $this->set('possibleReceivers', $possibleReceivers);
                if ($pendingTransactionCount > 0) {
                    $user_balance = 0;
                    if (isset($user['balance'])) {
                        $user_balance = $user['balance'];
                    }
                    $session->write('Transactions.pending', $pendingTransactionCount);
                    
                    if ($mode === 'next') {
                        return $this->redirect($this->loginServerUrl . 'account/checkTransactions', 303);
                    } else {
                        $this->Flash->success(__('Transaction submitted for review.'));
                    }
                }
            }
        }
    }
    
    public function ajaxCreate()
    {
        if ($this->request->is('post')) {
            $startTime = microtime(true);
            $jsonData = $this->request->input('json_decode', true);
            $session_id = $jsonData['session_id'];
            if(!isset($jsonData['session_id']) || intval($jsonData['session_id']) == 0) {
                return $this->returnJson(['state' => 'parameter missing', 'msg' => 'invalid session id']);
            }
            
            $login_result = $this->requestLogin($session_id, false);
            if($login_result !== true) {
                return $this->returnJson($login_result);
            }
            $session = $this->getRequest()->getSession();
            $user = $session->read('StateUser');        

            $memo = '';
            if(isset($jsonData['memo'])) {
                $memo = $jsonData['memo'];
            }   
            $auto_sign = true;
            if(isset($jsonData['auto_sign'])) {
                $auto_sign = $jsonData['auto_sign'];
            }
            if(!isset($jsonData['amount']) || intval($jsonData['amount']) <= 0) {
                return $this->returnJson(['state' => 'parameter missing', 'msg' => 'amount not set or <= 0']);
            }
            if(!isset($jsonData['email'])) {
                return $this->returnJson(['state' => 'parameter missing', 'msg' => 'no receiver email set']);
            }
            $amount = intval($jsonData['amount']);
            if($amount > 10000000) {
                return $this->returnJson(['state' => 'error', 'msg' => 'amount is to big']);
            }
            if($amount <= 0) {
                return $this->returnJson(['state' => 'error', 'msg' => 'amount must be > 0']);
            }
            if(!isset($jsonData['target_date'])) {
                return $this->returnJson(['state' => 'parameter missing', 'msg' => 'target_date not found']);
            }
          //$targetDate = $requestData['target_date'];
            $stateUserTable = TableRegistry::getTableLocator()->get('StateUsers');
            $requestAnswear = $this->JsonRequestClient->sendRequest(json_encode([
                'session_id' => $session_id,
                'email' => $jsonData['email'],
                'ask' => ['user.pubkeyhex', 'user.disabled', 'user.identHash']
            ]), '/getUserInfos');
            $receiverPubKeyHex = '';
            if('success' == $requestAnswear['state'] && 'success' == $requestAnswear['data']['state']) {
              // will be allways 64 byte long, even if it is empty
              $receiverPubKeyHex = $requestAnswear['data']['userData']['pubkeyhex'];
            } else {
              return $this->returnJson([
                  'state' => 'error', 
                  'msg' => 'receiver email not found on login-server', 
                  'details' => $requestAnswear,
                  'timeUsed' => microtime(true) - $startTime
              ]);
            }
            if($requestAnswear['data']['userData']['disabled']) {
                return $this->returnJson([
                    'state' => 'error',
                    'msg' => 'receiver is currently disabled, he cannot receive creations',
                    'timeUsed' => microtime(true) - $startTime
                ]);
            }
            
            $builderResult = TransactionCreation::build(
                        $amount,
                        $memo,
                        $receiverPubKeyHex,
                        new FrozenDate($jsonData['target_date'])
            );
            $transaction_base64 = '';
            if ($builderResult['state'] == 'success') {
                // todo: maybe use sodium base 64 encoder to make sure it can be readed from login-server
                 $transaction_base64 = base64_encode($builderResult['transactionBody']->serializeToString());
            }
            
            $requestResult = $this->JsonRequestClient->sendTransaction(
                $session_id,
                $transaction_base64,
                $user['balance'],
                $auto_sign,
                $this->blockchainType
            );
            if ($requestResult['state'] != 'success') {                
                $msg = 'error returned from login server';
                if ($requestResult['type'] === 'request error') {
                    $msg = 'login server couldn\'t reached';
                }
                    //$this->Flash->error(__('Error, please wait for the admin to fix it'));
                return $this->returnJson([
                            'state' => 'request error',
                            'msg' => $msg, 
                            'details' => $requestResult,
                            'timeUsed' => microtime(true) - $startTime
                       ]);
            } else {
                $json = $requestResult['data'];
                if ($json['state'] != 'success') {
                    if ($json['msg'] == 'session not found') {
                        $session->destroy();
                        return $this->returnJson(['state' => 'error', 'msg' => 'session not found', 'timeUsed' => microtime(true) - $startTime]);
                    } else {
                        return $this->returnJson(['state' => 'error', 'msg' => 'login server error', 'details' => $json, 'timeUsed' => microtime(true) - $startTime]);
                    }
                } else {
                    return $this->returnJson(['state' => 'success', 'timeUsed' => microtime(true) - $startTime]);
                }
            }
        }
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {

        $transactionCreation = $this->TransactionCreations->newEntity();
        if ($this->request->is('post')) {
            $transactionCreation = $this->TransactionCreations->patchEntity($transactionCreation, $this->request->getData());
            if ($this->TransactionCreations->save($transactionCreation)) {
                $this->Flash->success(__('The transaction creation has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction creation could not be saved. Please, try again.'));
        }
        $transactions = $this->TransactionCreations->Transactions->find('list', ['limit' => 200]);
        $stateUsers = $this->TransactionCreations->StateUsers->find('list', ['limit' => 200]);
        $this->set(compact('transactionCreation', 'transactions', 'stateUsers'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Transaction Creation id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $transactionCreation = $this->TransactionCreations->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $transactionCreation = $this->TransactionCreations->patchEntity($transactionCreation, $this->request->getData());
            if ($this->TransactionCreations->save($transactionCreation)) {
                $this->Flash->success(__('The transaction creation has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction creation could not be saved. Please, try again.'));
        }
        $transactions = $this->TransactionCreations->Transactions->find('list', ['limit' => 200]);
        $stateUsers = $this->TransactionCreations->StateUsers->find('list', ['limit' => 200]);
        $this->set(compact('transactionCreation', 'transactions', 'stateUsers'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Transaction Creation id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $transactionCreation = $this->TransactionCreations->get($id);
        if ($this->TransactionCreations->delete($transactionCreation)) {
            $this->Flash->success(__('The transaction creation has been deleted.'));
        } else {
            $this->Flash->error(__('The transaction creation could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
