<?php
namespace App\Controller;

use App\Controller\AppController;
use Cake\ORM\TableRegistry;

/**
 * StateUserTransactions Controller
 *
 * @property \App\Model\Table\StateUserTransactionsTable $StateUserTransactions
 *
 * @method \App\Model\Entity\StateUserTransaction[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class StateUserTransactionsController extends AppController
{
    public function initialize()
    {
        parent::initialize();
        //$this->Auth->allow(['add', 'edit']);
        $this->Auth->allow(['ajaxListTransactions']);
        //$this->loadComponent('JsonRequestClient');
    }
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['StateUsers', 'Transactions', 'TransactionTypes'],
        ];
        $stateUserTransactions = $this->paginate($this->StateUserTransactions);

        $this->set(compact('stateUserTransactions'));
    }
    
    public function sortTransactions($a, $b)
    {
        if ($a['date'] == $b['date']) {
            return 0;
        }
        return ($a['date'] > $b['date']) ? -1 : 1;
    }

    
    public function ajaxListTransactions($page = 1, $count = 20)
    {
      $startTime = microtime(true);
      $session = $this->getRequest()->getSession();
      $user = $session->read('StateUser');
      if(!$user) {
        return $this->returnJson(['state' => 'error', 'msg' => 'user not found', 'details' => 'exist a valid session cookie?']);
      }
      
      $paged_state_user_transactions = $this->StateUserTransactions
              ->find('all')
              ->where(['state_user_id' => $user['id'], 'transaction_type_id IN' => [1,2]])
              ->limit($count)
              ->page($page)
              ->order(['transaction_id'])
              ;
      $all_user_transactions_count = $this->StateUserTransactions
              ->find('all')
              ->where(['state_user_id' => $user['id'], 'transaction_type_id IN' => [1,2]])
              ->count()
              ;
      $creationTransaction_ids = [];
      $transferTransaction_ids = [];
      $allTransaction_ids = [];
      foreach($paged_state_user_transactions as $state_user_transaction) {
        $allTransaction_ids[] = $state_user_transaction->transaction_id;
        switch($state_user_transaction->transaction_type_id) {
          case 1: $creationTransaction_ids[] = $state_user_transaction->transaction_id; break;
          case 2: $transferTransaction_ids[] = $state_user_transaction->transaction_id; break;
        }
      }
      $transactionsTable = TableRegistry::getTableLocator()->get('Transactions');
      $transactionCreationsTable = TableRegistry::getTableLocator()->get('TransactionCreations');
      $transactionSendCoinsTable = TableRegistry::getTableLocator()->get('TransactionSendCoins');
      $stateUsersTable = TableRegistry::getTableLocator()->get('StateUsers');
      if(count($allTransaction_ids) > 0) {
        $transactionEntries = $transactionsTable->find('all')->where(['id IN' => $allTransaction_ids])->order(['id'])->toArray();
      }
      if(count($creationTransaction_ids) > 0) {
        $transactionCreations = $transactionCreationsTable->find('all')->where(['transaction_id IN' => $creationTransaction_ids]);
      }
      if(count($transferTransaction_ids)) {
        $transactionTransfers = $transactionSendCoinsTable->find('all')->where(['transaction_id IN' => $transferTransaction_ids]);
      }
      //var_dump($transactions->all());
      
      $transactions = [];
      // creations
      if(isset($transactionCreations)) {
        foreach ($transactionCreations as $creation) {
            //var_dump($creation);
           $transaction_entries_index = array_search($creation->transaction_id, $allTransaction_ids);
           if(FALSE === $transaction_entries_index) {
             return $this->returnJson(['state' => 'error', 'msg' => 'code error', 'details' => 'creation, transaction_entries_index is FALSE, shouldn\'t occure']);
           }
           $transaction = $transactionEntries[$transaction_entries_index];
            array_push($transactions, [
              'name' => 'Gradido Akademie',
              'type' => 'creation',
              'transaction_id' => $creation->transaction_id,
              'date' => $transaction->received,
              'balance' => $creation->amount,
              'memo' => $transaction->memo
            ]);
        }
      }
      
      // involved users
      if(isset($transactionTransfers)) {
        $involvedUserIds = [];

        foreach ($transactionTransfers as $transfer) {
          //var_dump($sendCoins);
            if ($transfer->state_user_id != $user['id']) {
                array_push($involvedUserIds, intval($transfer->state_user_id));
            } elseif ($transfer->receiver_user_id != $user['id']) {
                array_push($involvedUserIds, intval($transfer->receiver_user_id));
            }
        }

        // exchange key with values and drop duplicates
        $involvedUser_temp = array_flip($involvedUserIds);
        // exchange back
        $involvedUserIds = array_flip($involvedUser_temp);

        $involvedUser = $stateUsersTable->find('all', [
            'contain' => false,
            'where' => ['id IN' => $involvedUserIds],
            'fields' => ['id', 'first_name', 'last_name', 'email']
          ]);
        //var_dump($involvedUser->toArray());
        $involvedUserIndices = [];
        foreach ($involvedUser as $involvedUser) {
            $involvedUserIndices[$involvedUser->id] = $involvedUser;
        }

        // transfers - send coins
        foreach($transactionTransfers as $transfer) 
        {
          $transaction_entries_index = array_search($transfer->transaction_id, $allTransaction_ids);
          if(FALSE === $transaction_entries_index) {
            
            return $this->returnJson([
                'state' => 'error',
                'msg' => 'code error', 
                'details' => 'transfer, transaction_entries_index is FALSE, shouldn\'t occure',
                'data' => ['haystack' => $allTransaction_ids, 'needle' => $transfer->transaction_id]
            ]);
          }
          $transaction = $transactionEntries[$transaction_entries_index];
          $type = '';
          $otherUser = null;
          $other_user_public = '';

          if ($transfer->state_user_id == $user['id']) {
              $type = 'send';

              if(isset($involvedUserIndices[$transfer->receiver_user_id])) {
                $otherUser = $involvedUserIndices[$transfer->receiver_user_id];
              }
              $other_user_public = bin2hex(stream_get_contents($transfer->receiver_public_key));
          } else if ($transfer->receiver_user_id == $user['id']) {
              $type = 'receive';
              if(isset($involvedUserIndices[$transfer->state_user_id])) {
                $otherUser = $involvedUserIndices[$transfer->state_user_id];
              }
              if($transfer->sender_public_key) {
                $other_user_public = bin2hex(stream_get_contents($transfer->sender_public_key));
              }
          }
          if(null == $otherUser) {
            $otherUser = $stateUsersTable->newEntity();
          }
          array_push($transactions, [
           'name' => $otherUser->first_name . ' ' . $otherUser->last_name,
           'email' => $otherUser->email,
           'type' => $type,
           'transaction_id' => $transfer->transaction_id,
           'date' => $transaction->received,
           'balance' => $transfer->amount,
           'memo' => $transaction->memo,
           'pubkey' => $other_user_public
          ]);
          //*/

        }
      }
      uasort($transactions, array($this, 'sortTransactions'));
      
      return $this->returnJson([
          'state' => 'success', 
          'transactions' => $transactions, 
          'transactionExecutingCount' => $session->read('Transaction.executing'), 
          'count' => $all_user_transactions_count,
          'timeUsed' =>  microtime(true) - $startTime
      ]);
    }

    /**
     * View method
     *
     * @param string|null $id State User Transaction id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $stateUserTransaction = $this->StateUserTransactions->get($id, [
            'contain' => ['StateUsers', 'Transactions', 'TransactionTypes'],
        ]);

        $this->set('stateUserTransaction', $stateUserTransaction);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $stateUserTransaction = $this->StateUserTransactions->newEntity();
        if ($this->request->is('post')) {
            $stateUserTransaction = $this->StateUserTransactions->patchEntity($stateUserTransaction, $this->request->getData());
            if ($this->StateUserTransactions->save($stateUserTransaction)) {
                $this->Flash->success(__('The state user transaction has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The state user transaction could not be saved. Please, try again.'));
        }
        $stateUsers = $this->StateUserTransactions->StateUsers->find('list', ['limit' => 200]);
        $transactions = $this->StateUserTransactions->Transactions->find('list', ['limit' => 200]);
        $transactionTypes = $this->StateUserTransactions->TransactionTypes->find('list', ['limit' => 200]);
        $this->set(compact('stateUserTransaction', 'stateUsers', 'transactions', 'transactionTypes'));
    }

    /**
     * Edit method
     *
     * @param string|null $id State User Transaction id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $stateUserTransaction = $this->StateUserTransactions->get($id, [
            'contain' => [],
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $stateUserTransaction = $this->StateUserTransactions->patchEntity($stateUserTransaction, $this->request->getData());
            if ($this->StateUserTransactions->save($stateUserTransaction)) {
                $this->Flash->success(__('The state user transaction has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The state user transaction could not be saved. Please, try again.'));
        }
        $stateUsers = $this->StateUserTransactions->StateUsers->find('list', ['limit' => 200]);
        $transactions = $this->StateUserTransactions->Transactions->find('list', ['limit' => 200]);
        $transactionTypes = $this->StateUserTransactions->TransactionTypes->find('list', ['limit' => 200]);
        $this->set(compact('stateUserTransaction', 'stateUsers', 'transactions', 'transactionTypes'));
    }

    /**
     * Delete method
     *
     * @param string|null $id State User Transaction id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $stateUserTransaction = $this->StateUserTransactions->get($id);
        if ($this->StateUserTransactions->delete($stateUserTransaction)) {
            $this->Flash->success(__('The state user transaction has been deleted.'));
        } else {
            $this->Flash->error(__('The state user transaction could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
