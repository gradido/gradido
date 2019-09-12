<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * TransactionSendCoins Controller
 *
 * @property \App\Model\Table\TransactionSendCoinsTable $TransactionSendCoins
 *
 * @method \App\Model\Entity\TransactionSendCoin[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class TransactionSendCoinsController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['Transactions', 'StateUsers', 'ReceiverUsers']
        ];
        $transactionSendCoins = $this->paginate($this->TransactionSendCoins);

        $this->set(compact('transactionSendCoins'));
    }

    /**
     * View method
     *
     * @param string|null $id Transaction Send Coin id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $transactionSendCoin = $this->TransactionSendCoins->get($id, [
            'contain' => ['Transactions', 'StateUsers', 'ReceiverUsers']
        ]);

        $this->set('transactionSendCoin', $transactionSendCoin);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $transactionSendCoin = $this->TransactionSendCoins->newEntity();
        if ($this->request->is('post')) {
            $transactionSendCoin = $this->TransactionSendCoins->patchEntity($transactionSendCoin, $this->request->getData());
            if ($this->TransactionSendCoins->save($transactionSendCoin)) {
                $this->Flash->success(__('The transaction send coin has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction send coin could not be saved. Please, try again.'));
        }
        $transactions = $this->TransactionSendCoins->Transactions->find('list', ['limit' => 200]);
        $stateUsers = $this->TransactionSendCoins->StateUsers->find('list', ['limit' => 200]);
        $receiverUsers = $this->TransactionSendCoins->ReceiverUsers->find('list', ['limit' => 200]);
        $this->set(compact('transactionSendCoin', 'transactions', 'stateUsers', 'receiverUsers'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Transaction Send Coin id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $transactionSendCoin = $this->TransactionSendCoins->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $transactionSendCoin = $this->TransactionSendCoins->patchEntity($transactionSendCoin, $this->request->getData());
            if ($this->TransactionSendCoins->save($transactionSendCoin)) {
                $this->Flash->success(__('The transaction send coin has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction send coin could not be saved. Please, try again.'));
        }
        $transactions = $this->TransactionSendCoins->Transactions->find('list', ['limit' => 200]);
        $stateUsers = $this->TransactionSendCoins->StateUsers->find('list', ['limit' => 200]);
        $receiverUsers = $this->TransactionSendCoins->ReceiverUsers->find('list', ['limit' => 200]);
        $this->set(compact('transactionSendCoin', 'transactions', 'stateUsers', 'receiverUsers'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Transaction Send Coin id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $transactionSendCoin = $this->TransactionSendCoins->get($id);
        if ($this->TransactionSendCoins->delete($transactionSendCoin)) {
            $this->Flash->success(__('The transaction send coin has been deleted.'));
        } else {
            $this->Flash->error(__('The transaction send coin could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
