<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * TransactionGroupAllowtrades Controller
 *
 * @property \App\Model\Table\TransactionGroupAllowtradesTable $TransactionGroupAllowtrades
 *
 * @method \App\Model\Entity\TransactionGroupAllowtrade[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class TransactionGroupAllowtradesController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['Transactions', 'Groups']
        ];
        $transactionGroupAllowtrades = $this->paginate($this->TransactionGroupAllowtrades);

        $this->set(compact('transactionGroupAllowtrades'));
    }

    /**
     * View method
     *
     * @param string|null $id Transaction Group Allowtrade id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $transactionGroupAllowtrade = $this->TransactionGroupAllowtrades->get($id, [
            'contain' => ['Transactions', 'Groups']
        ]);

        $this->set('transactionGroupAllowtrade', $transactionGroupAllowtrade);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $transactionGroupAllowtrade = $this->TransactionGroupAllowtrades->newEntity();
        if ($this->request->is('post')) {
            $transactionGroupAllowtrade = $this->TransactionGroupAllowtrades->patchEntity($transactionGroupAllowtrade, $this->request->getData());
            if ($this->TransactionGroupAllowtrades->save($transactionGroupAllowtrade)) {
                $this->Flash->success(__('The transaction group allowtrade has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction group allowtrade could not be saved. Please, try again.'));
        }
        $transactions = $this->TransactionGroupAllowtrades->Transactions->find('list', ['limit' => 200]);
        $groups = $this->TransactionGroupAllowtrades->Groups->find('list', ['limit' => 200]);
        $this->set(compact('transactionGroupAllowtrade', 'transactions', 'groups'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Transaction Group Allowtrade id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $transactionGroupAllowtrade = $this->TransactionGroupAllowtrades->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $transactionGroupAllowtrade = $this->TransactionGroupAllowtrades->patchEntity($transactionGroupAllowtrade, $this->request->getData());
            if ($this->TransactionGroupAllowtrades->save($transactionGroupAllowtrade)) {
                $this->Flash->success(__('The transaction group allowtrade has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction group allowtrade could not be saved. Please, try again.'));
        }
        $transactions = $this->TransactionGroupAllowtrades->Transactions->find('list', ['limit' => 200]);
        $groups = $this->TransactionGroupAllowtrades->Groups->find('list', ['limit' => 200]);
        $this->set(compact('transactionGroupAllowtrade', 'transactions', 'groups'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Transaction Group Allowtrade id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $transactionGroupAllowtrade = $this->TransactionGroupAllowtrades->get($id);
        if ($this->TransactionGroupAllowtrades->delete($transactionGroupAllowtrade)) {
            $this->Flash->success(__('The transaction group allowtrade has been deleted.'));
        } else {
            $this->Flash->error(__('The transaction group allowtrade could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
