<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * TransactionGroupCreates Controller
 *
 * @property \App\Model\Table\TransactionGroupCreatesTable $TransactionGroupCreates
 *
 * @method \App\Model\Entity\TransactionGroupCreate[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class TransactionGroupCreatesController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['Transactions', 'StateGroups']
        ];
        $transactionGroupCreates = $this->paginate($this->TransactionGroupCreates);

        $this->set(compact('transactionGroupCreates'));
    }

    /**
     * View method
     *
     * @param string|null $id Transaction Group Create id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $transactionGroupCreate = $this->TransactionGroupCreates->get($id, [
            'contain' => ['Transactions', 'StateGroups']
        ]);

        $this->set('transactionGroupCreate', $transactionGroupCreate);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $transactionGroupCreate = $this->TransactionGroupCreates->newEntity();
        if ($this->request->is('post')) {
            $transactionGroupCreate = $this->TransactionGroupCreates->patchEntity($transactionGroupCreate, $this->request->getData());
            if ($this->TransactionGroupCreates->save($transactionGroupCreate)) {
                $this->Flash->success(__('The transaction group create has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction group create could not be saved. Please, try again.'));
        }
        $transactions = $this->TransactionGroupCreates->Transactions->find('list', ['limit' => 200]);
        $stateGroups = $this->TransactionGroupCreates->StateGroups->find('list', ['limit' => 200]);
        $this->set(compact('transactionGroupCreate', 'transactions', 'stateGroups'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Transaction Group Create id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $transactionGroupCreate = $this->TransactionGroupCreates->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $transactionGroupCreate = $this->TransactionGroupCreates->patchEntity($transactionGroupCreate, $this->request->getData());
            if ($this->TransactionGroupCreates->save($transactionGroupCreate)) {
                $this->Flash->success(__('The transaction group create has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction group create could not be saved. Please, try again.'));
        }
        $transactions = $this->TransactionGroupCreates->Transactions->find('list', ['limit' => 200]);
        $stateGroups = $this->TransactionGroupCreates->StateGroups->find('list', ['limit' => 200]);
        $this->set(compact('transactionGroupCreate', 'transactions', 'stateGroups'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Transaction Group Create id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $transactionGroupCreate = $this->TransactionGroupCreates->get($id);
        if ($this->TransactionGroupCreates->delete($transactionGroupCreate)) {
            $this->Flash->success(__('The transaction group create has been deleted.'));
        } else {
            $this->Flash->error(__('The transaction group create could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
