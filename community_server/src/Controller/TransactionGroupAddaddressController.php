<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * TransactionGroupAddaddress Controller
 *
 * @property \App\Model\Table\TransactionGroupAddaddressTable $TransactionGroupAddaddress
 *
 * @method \App\Model\Entity\TransactionGroupAddaddres[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class TransactionGroupAddaddressController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['Transactions', 'AddressTypes']
        ];
        $transactionGroupAddaddress = $this->paginate($this->TransactionGroupAddaddress);

        $this->set(compact('transactionGroupAddaddress'));
    }

    /**
     * View method
     *
     * @param string|null $id Transaction Group Addaddres id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $transactionGroupAddaddres = $this->TransactionGroupAddaddress->get($id, [
            'contain' => ['Transactions', 'AddressTypes']
        ]);

        $this->set('transactionGroupAddaddres', $transactionGroupAddaddres);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $transactionGroupAddaddres = $this->TransactionGroupAddaddress->newEntity();
        if ($this->request->is('post')) {
            $transactionGroupAddaddres = $this->TransactionGroupAddaddress->patchEntity($transactionGroupAddaddres, $this->request->getData());
            if ($this->TransactionGroupAddaddress->save($transactionGroupAddaddres)) {
                $this->Flash->success(__('The transaction group addaddres has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction group addaddres could not be saved. Please, try again.'));
        }
        $transactions = $this->TransactionGroupAddaddress->Transactions->find('list', ['limit' => 200]);
        $addressTypes = $this->TransactionGroupAddaddress->AddressTypes->find('list', ['limit' => 200]);
        $this->set(compact('transactionGroupAddaddres', 'transactions', 'addressTypes'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Transaction Group Addaddres id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $transactionGroupAddaddres = $this->TransactionGroupAddaddress->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $transactionGroupAddaddres = $this->TransactionGroupAddaddress->patchEntity($transactionGroupAddaddres, $this->request->getData());
            if ($this->TransactionGroupAddaddress->save($transactionGroupAddaddres)) {
                $this->Flash->success(__('The transaction group addaddres has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction group addaddres could not be saved. Please, try again.'));
        }
        $transactions = $this->TransactionGroupAddaddress->Transactions->find('list', ['limit' => 200]);
        $addressTypes = $this->TransactionGroupAddaddress->AddressTypes->find('list', ['limit' => 200]);
        $this->set(compact('transactionGroupAddaddres', 'transactions', 'addressTypes'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Transaction Group Addaddres id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $transactionGroupAddaddres = $this->TransactionGroupAddaddress->get($id);
        if ($this->TransactionGroupAddaddress->delete($transactionGroupAddaddres)) {
            $this->Flash->success(__('The transaction group addaddres has been deleted.'));
        } else {
            $this->Flash->error(__('The transaction group addaddres could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
