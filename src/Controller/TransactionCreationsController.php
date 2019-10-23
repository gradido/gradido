<?php
namespace App\Controller;

use App\Controller\AppController;

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
        //$this->Auth->allow(['add', 'edit']);
        $this->Auth->allow('add');
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

        $this->set(compact('transactionCreations'));
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
        //var_dump($user);
        $transactionCreation = $this->TransactionCreations->newEntity();
        $transactionCreation->state_user_id  = $user->id;
        $timeUsed = microtime(true) - $startTime;
        $this->set(compact('transactionCreation', 'timeUsed'));
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
