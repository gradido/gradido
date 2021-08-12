<?php
namespace App\Controller;

use Cake\ORM\TableRegistry;
use Cake\I18n\FrozenTime;

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
        if($update_balance_result['success'] !== true) {
            $this->addAdminError('StateBalances', 'overview', $update_balance_result, $user['id']);
        }
          
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

        
        $stateUserTransactionsQuery = $stateUserTransactionsTable
                                        ->find()
                                        ->where(['state_user_id' => $user['id']])
                                        ->order(['balance_date' => 'ASC'])
                                        ->contain([])
                                        ;
        $decay = true;
        $transactions = [];
        if($stateUserTransactionsQuery->count() > 0) {
            $transactions_with_decay = $transactionsTable->listTransactionsHumanReadable($stateUserTransactionsQuery->toArray(), $user, $decay);
            foreach($transactions_with_decay as $tr) {
                if(isset($tr['decay'])) {
                    $tr['decay']['type'] = 'decay';
                    $tr['decay']['memo'] = '';
                    $transactions[] = $tr['decay'];
                }
                $transactions[] = $tr;
            }
        }
        
        $state_balance = $stateBalancesTable->find()->where(['state_user_id' => $user['id']])->first();
        
        $body = [
            'state' => 'success',
            'transactions' => $transactions,
            'transactionExecutingCount' => $session->read('Transactions.executing'),
            'count' => count($transactions),
            'gdtSum' => $gdtSum,
            'timeUsed' => microtime(true) - $startTime
        ];
        $now = new FrozenTime();
        $body['decay_date'] = $now;
        
        if(!$state_balance) {
            $balance = 0.0;
        } else {
            $balance = $stateBalancesTable->calculateDecay($state_balance->amount, $state_balance->record_date, $now);
            //$balance = $state_balance->partDecay($now);
        }
        $calculated_balance = 0;
        foreach($transactions as $transaction) {
            if($transaction['type'] == 'decay' || $transaction['type'] == 'send') {
                $calculated_balance -= $transaction['balance'];
            } else {
                $calculated_balance += $transaction['balance'];
            }
        }
        
        $this->set('calculated_balance', $calculated_balance);
        
        $this->set('transactions', array_reverse($transactions));
        $this->set('transactionExecutingCount', $session->read('Transactions.executing'));
        $this->set('balance', $balance);
        $this->set('timeUsed', microtime(true) - $startTime);
        $this->set('gdtSum', $gdtSum);
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
        $requestResult = $this->JsonRequestClient->sendRequestGDT([
            'email' => $user['email'],
            'page' => 1,
            'count' => 100,
            'orderDirection' => 'DESC'
        ], 'GdtEntries' . DS . 'listPerEmailApi');

        //var_dump($requestResult);
        if('success' === $requestResult['state'] && 'success' === $requestResult['data']['state']) 
        {
            $moreEntrysAsShown = false;
            if(isset($requestResult['data']['count'])) {
                if($requestResult['data']['count'] > 100) {
                    $moreEntrysAsShown = true;
                }
            } else {
                $moreEntrysAsShown = $requestResult['data']['moreEntrysAsShown'];
            }
          //var_dump(array_keys($requestResult['data']));
            if(isset($requestResult['data']['gdtEntries'])) {
                $ownEntries = $requestResult['data']['gdtEntries'];
            } else {
                $ownEntries = $requestResult['data']['ownEntries'];
            }
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
            $this->set('moreEntrysAsShown', $moreEntrysAsShown);
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
