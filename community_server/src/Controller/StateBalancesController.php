<?php
namespace App\Controller;

use Cake\ORM\TableRegistry;
use Cake\I18n\Time;

use Model\Navigation\NaviHierarchy;
use Model\Navigation\NaviHierarchyEntry;

use App\Controller\AppController;


/**
 * StateBalances Controller
 *
 * @property \App\Model\Table\StateBalancesTable $StateBalances
 *
 * @method \App\Model\Entity\StateBalance[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class StateBalancesController extends AppController
{

    public function initialize()
    {
        parent::initialize();
        //$this->Auth->allow(['add', 'edit']);
        $this->Auth->allow(['overview', 'overviewGdt', 'ajaxListTransactions', 'ajaxGdtOverview', 'ajaxGetBalance', 'ajaxGdtTransactions']);
        $this->loadComponent('JsonRequestClient');
    }
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['StateUsers']
        ];
        $stateBalances = $this->paginate($this->StateBalances);

        $this->set(compact('stateBalances'));
    }
    
    

    public function overview()
    {
        $this->set(
            'naviHierarchy',
            (new NaviHierarchy())->
            add(new NaviHierarchyEntry(__('Startseite'), 'Dashboard', 'index', false))->
            add(new NaviHierarchyEntry(__('Kontoübersicht'), 'StateBalances', 'overview', true))
        );
        $startTime = microtime(true);
        $this->viewBuilder()->setLayout('frontend');
        $session = $this->getRequest()->getSession();
        $result = $this->requestLogin();
        if ($result !== true) {
            return $result;
        }
        
        $user = $session->read('StateUser');
        $update_balance_result = $this->StateBalances->updateBalances($user['id']);
        if($update_balance_result !== true) {
            $this->addAdminError('StateBalances', 'overview', $update_balance_result, $user['id']);
        }
        // sendRequestGDT
        // listPerEmailApi

        $gdtSum = 0;
        //if('admin' === $user['role']) {
          $gdtEntries = $this->JsonRequestClient->sendRequestGDT(['email' => $user['email']], 'GdtEntries' . DS . 'sumPerEmailApi');
          //var_dump($gdtEntries);
          if('success' == $gdtEntries['state'] && 'success' == $gdtEntries['data']['state']) {
            $gdtSum = intval($gdtEntries['data']['sum']);
          } else {
            if($user) {
              $this->addAdminError('StateBalancesController', 'overview', $gdtEntries, $user['id']);
            } else {
              $this->addAdminError('StateBalancesController', 'overview', $gdtEntries, 0);
            }
          }
        //}
        //
        //
        $stateUserTransactionsTable = TableRegistry::getTableLocator()->get('StateUserTransactions');

        $creationsTable = TableRegistry::getTableLocator()->get('TransactionCreations');
        $creationTransactions = $creationsTable
                ->find('all')
                ->where(['state_user_id' => $user['id']])
                ->contain(['Transactions']);

        $transferTable = TableRegistry::getTableLocator()->get('TransactionSendCoins');
        $transferTransactions = $transferTable
                ->find('all')
                ->where(['OR' => ['state_user_id' => $user['id'], 'receiver_user_id' => $user['id']]])
                ->contain(['Transactions']);

        $involvedUserIds = [];

        foreach ($transferTransactions as $sendCoins) {
          //var_dump($sendCoins);
            if ($sendCoins->state_user_id != $user['id']) {
                array_push($involvedUserIds, intval($sendCoins->state_user_id));
            } elseif ($sendCoins->receiver_user_id != $user['id']) {
                array_push($involvedUserIds, intval($sendCoins->receiver_user_id));
            }
        }

        /*echo "state user from sendCoins: $sendCoins->state_user_id<br>";
        echo "receiver user from sendCoins: $sendCoins->receiver_user_id<br>";
        echo "user id from logged in user: ".$user['id']. '<br>';
        */
        //var_dump($involvedUserIds);
        // exchange key with values and drop duplicates
        $involvedUser_temp = array_flip($involvedUserIds);
        // exchange back
        $involvedUserIds = array_flip($involvedUser_temp);
        $userTable = TableRegistry::getTableLocator()->get('StateUsers');
        $involvedUser = $userTable->find('all', [
            'contain' => false,
            'where' => ['id IN' => $involvedUserIds],
            'fields' => ['id', 'first_name', 'last_name', 'email']
          ]);
        //var_dump($involvedUser->toArray());
        $involvedUserIndices = [];
        foreach ($involvedUser as $involvedUser) {
            $involvedUserIndices[$involvedUser->id] = $involvedUser;
        }

        // sender or receiver when user has sended money
        // group name if creation
        // type: gesendet / empfangen / geschöpft
        // transaktion nr / id
        // date
        // balance

        $transactions = [];
        foreach ($creationTransactions as $creation) {
          //var_dump($creation);
            array_push($transactions, [
              'name' => 'Gradido Akademie',
              'type' => 'creation',
              'transaction_id' => $creation->transaction_id,
              'date' => $creation->target_date,
              'balance' => $creation->amount,
              'memo' => $creation->transaction->memo
            ]);
        }

        foreach ($transferTransactions as $sendCoins) {
            $type = '';
            $otherUser = null;
            $other_user_public = '';
            if ($sendCoins->state_user_id == $user['id']) {
                $type = 'send';
                
                if(isset($involvedUserIndices[$sendCoins->receiver_user_id])) {
                  $otherUser = $involvedUserIndices[$sendCoins->receiver_user_id];
                }
                $other_user_public = bin2hex(stream_get_contents($sendCoins->receiver_public_key));
            } else if ($sendCoins->receiver_user_id == $user['id']) {
                $type = 'receive';
                if(isset($involvedUserIndices[$sendCoins->state_user_id])) {
                  $otherUser = $involvedUserIndices[$sendCoins->state_user_id];
                }
                if($sendCoins->sender_public_key) {
                  $other_user_public = bin2hex(stream_get_contents($sendCoins->sender_public_key));
                }
            }
            if(null == $otherUser) {
              $otherUser = $this->StateBalances->StateUsers->newEntity();
            }
            array_push($transactions, [
             'name' => $otherUser->first_name . ' ' . $otherUser->last_name,
             'email' => $otherUser->email,
             'type' => $type,
             'transaction_id' => $sendCoins->transaction_id,
             'date' => $sendCoins->transaction->received,
             'balance' => $sendCoins->amount,
             'memo' => $sendCoins->transaction->memo,
             'pubkey' => $other_user_public
            ]);
        }
        uasort($transactions, array($this, 'sortTransactions'));
        
        // add decay transactions 
        $month_start_state_balance = null;
        $current_state_balance = null;
        $cursor = 0;
        $transactions_reversed = array_reverse($transactions);
        $decay_transactions = [];
        $maxI = count($transactions_reversed);

        foreach($transactions_reversed as $i => $transaction) {
            if(!isset($transaction['transaction_id'])) {
                //echo "missing transaction<br>";
                continue;
            }
            $transaction_id = $transaction['transaction_id'];
            //echo "transaction id: $transaction_id <br>";
            $decay_transaction = NULL;
            $state_balance = $this->StateBalances->newEntity();
            
            if($i > 0 && isset($transactions_reversed[$i-1]['transaction_id'])) {
                $prev_transaction = $transactions_reversed[$i-1];
                $stateUserTransactions = $stateUserTransactionsTable
                        ->find()
                        ->where([
                            'transaction_id IN' => [$transaction_id, $prev_transaction['transaction_id']],
                            'state_user_id' => $user['id']
                        ])
                        ->order(['balance_date ASC'])
                        ->toArray();
               
                $prev = $stateUserTransactions[0];
                if($prev->balance > 0) {
                //    var_dump($stateUserTransactions);
                    $current = $stateUserTransactions[1];
                    //echo "decay between " . $prev->transaction_id . " and " . $current->transaction_id . "<br>";
                    $interval = $current->balance_date->diff($prev->balance_date);
                    $state_balance->amount = $prev->balance;
                    $state_balance->record_date = $prev->balance_date;
                    $diff_amount = $state_balance->partDecay($current->balance_date);
     
                    //echo $interval->format('%R%a days');
                    //echo "prev balance: " . $prev->balance . ", diff_amount: $diff_amount, summe: " . (-intval($prev->balance - $diff_amount)) . "<br>";
                    $decay_transaction = [ 
                        'type' => 'decay',
                        'balance' => -intval($prev->balance - $diff_amount),
                        'decay_duration' => $interval->format('%a days, %H hours, %I minutes, %S seconds'),
                        'memo' => ''
                    ];
                }
            } 
            
            if($decay_transaction) {
                $decay_transactions[] = $decay_transaction;
                //array_splice($transactions_reversed, $i + $cursor, 0, [$decay_transaction]);
                //$cursor++;
            } 
            if($i == $maxI-1) {
                $stateUserTransaction = $stateUserTransactionsTable
                        ->find()
                        ->where(['transaction_id' => $transaction_id, 'state_user_id' => $user['id']])
                        ->order(['transaction_id ASC'])->first();
                //var_dump($stateUserTransaction);
                $state_balance->amount = $stateUserTransaction->balance;
                $state_balance->record_date = $stateUserTransaction->balance_date;
                $decay_transactions[] = [
                //$transactions_reversed[] = [
                    'type' => 'decay',
                    'balance' => -intval($stateUserTransaction->balance - $state_balance->decay),
                    'decay_duration' => $stateUserTransaction->balance_date->timeAgoInWords(),
                    'memo' => ''
                ];
                
            }
        }
        $final_transactions = [];
        foreach($transactions_reversed as $i => $transaction) {
            $final_transactions[] = $transaction;
            $final_transactions[] = $decay_transactions[$i];
        }
        // for debugging
        $calculated_balance = 0;
        foreach($final_transactions as $tr) {
            if($tr['type'] == 'send') {
                $calculated_balance -= intval($tr['balance']);
            } else {
                $calculated_balance += intval($tr['balance']);
            }
        }
        $this->set('calculated_balance', $calculated_balance);
        
        $this->set('transactions', array_reverse($final_transactions));
        $this->set('transactionExecutingCount', $session->read('Transactions.executing'));
        $this->set('balance', $session->read('StateUser.balance'));
        $this->set('timeUsed', microtime(true) - $startTime);
        $this->set('gdtSum', $gdtSum);
    }

    public function ajaxGetBalance($session_id = 0)
    {
        if(!$session_id) {
            return $this->returnJson(['state' => 'error', 'msg' => 'invalid session id']);
        }
        $login_result = $this->requestLogin($session_id, false);
        if($login_result !== true) {
            return $this->returnJson($login_result);
        }
        $session = $this->getRequest()->getSession();
        $user = $session->read('StateUser');
        
        $this->StateBalances->updateBalances($user['id']);
        
        $state_balance = $this->StateBalances->find()->where(['state_user_id' => $user['id']])->first();

        if(!$state_balance) {
            return $this->returnJson(['state' => 'success', 'balance' => 0]);
        }
        
        return $this->returnJson([
            'state' => 'success',
            'balance' => $state_balance->amount,
            'decay' => $state_balance->decay
        ]);
    }


    public function ajaxListTransactions($session_id, $page, $count)
    {
        if(!$session_id) {
            return $this->returnJson(['state' => 'error', 'msg' => 'invalid session id']);
        }
        
        $startTime = microtime(true);
        $login_result = $this->requestLogin($session_id, false);
        if($login_result !== true) {
            return $this->returnJson($login_result);
        }
        $session = $this->getRequest()->getSession();
        $user = $session->read('StateUser');
        
        $this->StateBalances->updateBalances($user['id']);

        $gdtSum = 0;        
        $gdtEntries = $this->JsonRequestClient->sendRequestGDT(['email' => $user['email']], 'GdtEntries' . DS . 'sumPerEmailApi');

        if('success' == $gdtEntries['state'] && 'success' == $gdtEntries['data']['state']) {
          $gdtSum = intval($gdtEntries['data']['sum']);
        } else {
          if($user) {   
            $this->addAdminError('StateBalancesController', 'overview', $gdtEntries, $user['id']);
          } else {
            $this->addAdminError('StateBalancesController', 'overview', $gdtEntries, 0);
          }
        }

        $creationsTable = TableRegistry::getTableLocator()->get('TransactionCreations');
        $creationTransactions = $creationsTable
                ->find('all')
                ->where(['state_user_id' => $user['id']])
                ->contain(['Transactions']);

        $transferTable = TableRegistry::getTableLocator()->get('TransactionSendCoins');
        $transferTransactions = $transferTable
                ->find('all')
                ->where(['OR' => ['state_user_id' => $user['id'], 'receiver_user_id' => $user['id']]])
                ->contain(['Transactions']);

        $involvedUserIds = [];

        foreach ($transferTransactions as $sendCoins) {
          //var_dump($sendCoins);
            if ($sendCoins->state_user_id != $user['id']) {
                array_push($involvedUserIds, intval($sendCoins->state_user_id));
            } elseif ($sendCoins->receiver_user_id != $user['id']) {
                array_push($involvedUserIds, intval($sendCoins->receiver_user_id));
            }
        }

        /*echo "state user from sendCoins: $sendCoins->state_user_id<br>";
        echo "receiver user from sendCoins: $sendCoins->receiver_user_id<br>";
        echo "user id from logged in user: ".$user['id']. '<br>';
        */
        //var_dump($involvedUserIds);
        // exchange key with values and drop duplicates
        $involvedUser_temp = array_flip($involvedUserIds);
        // exchange back
        $involvedUserIds = array_flip($involvedUser_temp);
        $userTable = TableRegistry::getTableLocator()->get('StateUsers');
        $involvedUser = $userTable->find('all', [
            'contain' => false,
            'where' => ['id IN' => $involvedUserIds],
            'fields' => ['id', 'first_name', 'last_name', 'email']
          ]);
        //var_dump($involvedUser->toArray());
        $involvedUserIndices = [];
        foreach ($involvedUser as $involvedUser) {
            $involvedUserIndices[$involvedUser->id] = $involvedUser;
        }

        // sender or receiver when user has sended money
        // group name if creation
        // type: gesendet / empfangen / geschöpft
        // transaktion nr / id
        // date
        // balance

        $transactions = [];
        foreach ($creationTransactions as $creation) {
          //var_dump($creation);
            array_push($transactions, [
              'name' => 'Gradido Akademie',
              'type' => 'creation',
              'transaction_id' => $creation->transaction_id,
              'date' => $creation->transaction->received,
              'balance' => $creation->amount,
              'memo' => $creation->transaction->memo
            ]);
        }

        foreach ($transferTransactions as $sendCoins) {
            $type = '';
            $otherUser = null;
            if ($sendCoins->state_user_id == $user['id']) {
                $type = 'send';
                
                if(isset($involvedUserIndices[$sendCoins->receiver_user_id])) {
                  $otherUser = $involvedUserIndices[$sendCoins->receiver_user_id];
                }
            } else if ($sendCoins->receiver_user_id == $user['id']) {
                $type = 'receive';
                if(isset($involvedUserIndices[$sendCoins->state_user_id])) {
                  $otherUser = $involvedUserIndices[$sendCoins->state_user_id];
                }
            }
            if(null == $otherUser) {
              $otherUser = $this->StateBalances->StateUsers->newEntity();
            }
            array_push($transactions, [
             'name' => $otherUser->first_name . ' ' . $otherUser->last_name,
             'email' => $otherUser->email,
             'type' => $type,
             'transaction_id' => $sendCoins->transaction_id,
             'date' => $sendCoins->transaction->received,
             'balance' => $sendCoins->amount,
             'memo' => $sendCoins->transaction->memo
            ]);
        }
        uasort($transactions, array($this, 'sortTransactions'));
        if($sort == 'DESC') {
            $transactions = array_reverse($transactions);
        }
        return $this->returnJson([
                'state' => 'success',
                'transactions' => $transactions,
                'transactionExecutingCount' => $session->read('Transactions.executing'),
                'count' => count($transactions),
                'gdtSum' => $gdtSum,
                'timeUsed' => microtime(true) - $startTime
            ]);
    }


    
    public function ajaxGdtOverview()
    {
      $gdtSum = 0;
      $gdtCount = -1;
      $session = $this->getRequest()->getSession();
      $user = $session->read('StateUser');
      
      if(!$user) {
        return $this->returnJson(['state' => 'error', 'msg' => 'user not found', 'details' => 'exist a valid session cookie?']);
      }
      $gdtEntries = $this->JsonRequestClient->sendRequestGDT(['email' => $user['email']], 'GdtEntries' . DS . 'sumPerEmailApi');
      
      if('success' == $gdtEntries['state'] && 'success' == $gdtEntries['data']['state']) {
        $gdtSum = intval($gdtEntries['data']['sum']);
        if(isset($gdtEntries['data']['count'])) {
          $gdtCount = intval($gdtEntries['data']['count']);
        }
      } else {
        if($user) {
          $this->addAdminError('StateBalancesController', 'ajaxGdtOverview', $gdtEntries, $user['id']);
        } else {
          $this->addAdminError('StateBalancesController', 'ajaxGdtOverview', $gdtEntries, 0);
        }
      }
      
      return $this->returnJson([
          'state' => 'success', 
          'transactions' => $transactions, 
          'transactionExecutingCount' => $session->read('Transaction.executing'), 
          'count' => $all_user_transactions_count
      ]);
    }


    public function overviewGdt()
    {
        $this->set(
            'naviHierarchy',
            (new NaviHierarchy())->
            add(new NaviHierarchyEntry(__('Startseite'), 'Dashboard', 'index', false))->
            add(new NaviHierarchyEntry(__('GDT Kontoübersicht'), 'StateBalances', 'overviewGdt', true))
        );
        $startTime = microtime(true);
        $this->viewBuilder()->setLayout('frontend');
        $session = $this->getRequest()->getSession();
        $result = $this->requestLogin();
        if ($result !== true) {
            return $result;
        }
        $user = $session->read('StateUser');
        $requestResult = $this->JsonRequestClient->sendRequestGDT(['email' => $user['email']], 'GdtEntries' . DS . 'listPerEmailApi');

        //var_dump($requestResult);
        if('success' === $requestResult['state'] && 'success' === $requestResult['data']['state']) {

          //var_dump(array_keys($requestResult['data']));
            $ownEntries = $requestResult['data']['ownEntries'];
          //$gdtEntries = $requestResult['data']['entries'];

            $gdtSum = 0;
            foreach ($ownEntries as $i => $gdtEntry) {
                $gdtSum += $gdtEntry['gdt'];
              //echo "index: $i<br>";
              //var_dump($gdtEntry);
            }
            if (isset($requestResult['data']['connectEntrys'])) {
                $connectEntries = $requestResult['data']['connectEntrys'];

                foreach ($connectEntries as $entry) {
                  //if(!$count) var_dump($entry);
                  //$count++;
                    $gdtSum += $entry['connect']['gdt_entry']['gdt'];
                }
                $this->set('connectEntries', $connectEntries);
            }

          //echo "gdtSum: $gdtSum<br>";
            $this->set('gdtSum', $gdtSum);
            $this->set('ownEntries', $ownEntries);
            $this->set('gdtSumPerEmail', $requestResult['data']['gdtSumPerEmail']);
            $this->set('moreEntrysAsShown', $requestResult['data']['moreEntrysAsShown']);
            $this->set('user', $user);

            if (isset($requestResult['data']['publishers'])) {
                $publishers = $requestResult['data']['publishers'];
                $this->set('publishers', $publishers);
            }
        } else {
          $this->addAdminError('StateBalancesController', 'overviewGdt', $requestResult, $user['id']);
          $this->Flash->error(__('Fehler beim GDT Server, bitte abwarten oder den Admin benachrichtigen!'));
        }
    }
    
    public function ajaxGdtTransactions()
    {
        $startTime = microtime(true);
        $session = $this->getRequest()->getSession();
        $user = $session->read('StateUser');
        if(!$user) {
          return $this->returnJson(['state' => 'error', 'msg' => 'user not found', 'details' => 'exist a valid session cookie?']);
        }
      
        $requestResult = $this->JsonRequestClient->sendRequestGDT(['email' => $user['email']], 'GdtEntries' . DS . 'listPerEmailApi');
        $connectEntries = [];
        $publishers = [];
        
        //var_dump($requestResult);
        if('success' === $requestResult['state'] && 'success' === $requestResult['data']['state']) {

          //var_dump(array_keys($requestResult['data']));
            $ownEntries = $requestResult['data']['ownEntries'];
          //$gdtEntries = $requestResult['data']['entries'];

            $gdtSum = 0;
            foreach ($ownEntries as $i => $gdtEntry) {
                $gdtSum += $gdtEntry['gdt'];
              //echo "index: $i<br>";
              //var_dump($gdtEntry);
            }
            if (isset($requestResult['data']['connectEntrys'])) {
                $connectEntries = $requestResult['data']['connectEntrys'];

                foreach ($connectEntries as $entry) {
                  //if(!$count) var_dump($entry);
                  //$count++;
                    $gdtSum += $entry['connect']['gdt_entry']['gdt'];
                }
            }

          //echo "gdtSum: $gdtSum<br>";

            if (isset($requestResult['data']['publishers'])) {
                $publishers = $requestResult['data']['publishers'];
            }
        } else {
          $this->addAdminError('StateBalancesController', 'ajaxGdtTransactions', $requestResult, $user['id']);
          //$this->Flash->error(__('Fehler beim GDT Server, bitte abwarten oder den Admin benachrichtigen!'));
          return $this->returnJson(['state' => 'error', 'msg' => 'error from gdt server', 'details' => $requestResult]);
        }
        
        
        return $this->returnJson([
            'state' => 'success',
            'gdtSum' => $gdtSum,
            'ownEntries' => $ownEntries,
            'connectEntries' => $connectEntries,
            'publishers' => $publishers,
            'gdtSumPerEmail' => $requestResult['data']['gdtSumPerEmail'],
            'moreEntrysAsShown' => $requestResult['data']['moreEntrysAsShown'],
            'timeUsed' =>  microtime(true) - $startTime
        ]);
    }

    public function sortTransactions($a, $b)
    {
        if ($a['date'] == $b['date']) {
            return 0;
        }
        return ($a['date'] > $b['date']) ? -1 : 1;
    }

    /**
     * View method
     *
     * @param string|null $id State Balance id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $stateBalance = $this->StateBalances->get($id, [
            'contain' => ['StateUsers']
        ]);

        $this->set('stateBalance', $stateBalance);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $stateBalance = $this->StateBalances->newEntity();
        if ($this->request->is('post')) {
            $stateBalance = $this->StateBalances->patchEntity($stateBalance, $this->request->getData());
            if ($this->StateBalances->save($stateBalance)) {
                $this->Flash->success(__('The state balance has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The state balance could not be saved. Please, try again.'));
        }
        $stateUsers = $this->StateBalances->StateUsers->find('list', ['limit' => 200]);
        $this->set(compact('stateBalance', 'stateUsers'));
    }

    /**
     * Edit method
     *
     * @param string|null $id State Balance id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $stateBalance = $this->StateBalances->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $stateBalance = $this->StateBalances->patchEntity($stateBalance, $this->request->getData());
            if ($this->StateBalances->save($stateBalance)) {
                $this->Flash->success(__('The state balance has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The state balance could not be saved. Please, try again.'));
        }
        $stateUsers = $this->StateBalances->StateUsers->find('list', ['limit' => 200]);
        $this->set(compact('stateBalance', 'stateUsers'));
    }

    /**
     * Delete method
     *
     * @param string|null $id State Balance id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $stateBalance = $this->StateBalances->get($id);
        if ($this->StateBalances->delete($stateBalance)) {
            $this->Flash->success(__('The state balance has been deleted.'));
        } else {
            $this->Flash->error(__('The state balance could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
