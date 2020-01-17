<?php
namespace App\Controller;

use App\Controller\AppController;

use Model\Transactions\Transaction;
use Model\Transactions\TransactionBody;

/**
 * Transactions Controller
 *
 * @property \App\Model\Table\TransactionsTable $Transactions
 *
 * @method \App\Model\Entity\Transaction[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class TransactionsController extends AppController
{
  
    public function initialize()
    {
        parent::initialize();
        $this->loadComponent('GradidoNumber');
        $this->Auth->allow(['decode']);

    }
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['StateGroups', 'TransactionTypes']
        ];
        $transactions = $this->paginate($this->Transactions);

        $this->set(compact('transactions'));
    }

    /**
     * View method
     *
     * @param string|null $id Transaction id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $transaction = $this->Transactions->get($id, [
            'contain' => ['StateGroups', 'TransactionTypes', 'StateCreated', 'TransactionCreations', 'TransactionGroupAddaddress', 'TransactionGroupAllowtrades', 'TransactionGroupCreates', 'TransactionSendCoins', 'TransactionSignatures']
        ]);

        $this->set('transaction', $transaction);
    }
    
    public function decode()
    {
      $this->viewBuilder()->setLayout('frontend');
      if ($this->request->is('post')) {
          $base64 = $this->request->getData('base64');
          if(!$base64 || $base64 == '') {
            $this->Flash->error(__('No valid data given, please try again.'));
          } else {
            try {
              $transactionBin = sodium_base642bin($base64, SODIUM_BASE64_VARIANT_URLSAFE_NO_PADDING);
            } catch(Exception $ex) {
              var_dump($ex);
            }
            $transaction = new TransactionBody($transactionBin);
            if($transaction->hasErrors()) {
              $this->set('errors', $transaction->getErrors());
            } else {
              //$transaction->validate();
              if($transaction->hasErrors()) {
                $this->set('errors', $transaction->getErrors());
              }
              //var_dump($transaction);
              echo "<br>bin: <br>";
              var_dump($transactionBin);
              echo "<br>";
              $this->set('transaction', $transaction);
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
        $transaction = $this->Transactions->newEntity();
        if ($this->request->is('post')) {
            $transaction = $this->Transactions->patchEntity($transaction, $this->request->getData());
            if ($this->Transactions->save($transaction)) {
                $this->Flash->success(__('The transaction has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction could not be saved. Please, try again.'));
        }
        $stateGroups = $this->Transactions->StateGroups->find('list', ['limit' => 200]);
        $transactionTypes = $this->Transactions->TransactionTypes->find('list', ['limit' => 200]);
        $this->set(compact('transaction', 'stateGroups', 'transactionTypes'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Transaction id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $transaction = $this->Transactions->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $transaction = $this->Transactions->patchEntity($transaction, $this->request->getData());
            if ($this->Transactions->save($transaction)) {
                $this->Flash->success(__('The transaction has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction could not be saved. Please, try again.'));
        }
        $stateGroups = $this->Transactions->StateGroups->find('list', ['limit' => 200]);
        $transactionTypes = $this->Transactions->TransactionTypes->find('list', ['limit' => 200]);
        $this->set(compact('transaction', 'stateGroups', 'transactionTypes'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Transaction id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $transaction = $this->Transactions->get($id);
        if ($this->Transactions->delete($transaction)) {
            $this->Flash->success(__('The transaction has been deleted.'));
        } else {
            $this->Flash->error(__('The transaction could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
