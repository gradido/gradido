<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * TransactionStates Controller
 *
 * @property \App\Model\Table\TransactionStatesTable $TransactionStates
 *
 * @method \App\Model\Entity\TransactionState[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class TransactionStatesController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $transactionStates = $this->paginate($this->TransactionStates);

        $this->set(compact('transactionStates'));
    }

    /**
     * View method
     *
     * @param string|null $id Transaction State id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $transactionState = $this->TransactionStates->get($id, [
            'contain' => ['Transactions'],
        ]);

        $this->set('transactionState', $transactionState);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $transactionState = $this->TransactionStates->newEntity();
        if ($this->request->is('post')) {
            $transactionState = $this->TransactionStates->patchEntity($transactionState, $this->request->getData());
            if ($this->TransactionStates->save($transactionState)) {
                $this->Flash->success(__('The transaction state has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction state could not be saved. Please, try again.'));
        }
        $this->set(compact('transactionState'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Transaction State id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $transactionState = $this->TransactionStates->get($id, [
            'contain' => [],
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $transactionState = $this->TransactionStates->patchEntity($transactionState, $this->request->getData());
            if ($this->TransactionStates->save($transactionState)) {
                $this->Flash->success(__('The transaction state has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction state could not be saved. Please, try again.'));
        }
        $this->set(compact('transactionState'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Transaction State id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $transactionState = $this->TransactionStates->get($id);
        if ($this->TransactionStates->delete($transactionState)) {
            $this->Flash->success(__('The transaction state has been deleted.'));
        } else {
            $this->Flash->error(__('The transaction state could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
