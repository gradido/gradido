<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * TransactionTypes Controller
 *
 * @property \App\Model\Table\TransactionTypesTable $TransactionTypes
 *
 * @method \App\Model\Entity\TransactionType[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class TransactionTypesController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $transactionTypes = $this->paginate($this->TransactionTypes);

        $this->set(compact('transactionTypes'));
    }

    /**
     * View method
     *
     * @param string|null $id Transaction Type id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $transactionType = $this->TransactionTypes->get($id, [
            'contain' => ['Transactions']
        ]);

        $this->set('transactionType', $transactionType);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $transactionType = $this->TransactionTypes->newEntity();
        if ($this->request->is('post')) {
            $transactionType = $this->TransactionTypes->patchEntity($transactionType, $this->request->getData());
            if ($this->TransactionTypes->save($transactionType)) {
                $this->Flash->success(__('The transaction type has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction type could not be saved. Please, try again.'));
        }
        $this->set(compact('transactionType'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Transaction Type id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $transactionType = $this->TransactionTypes->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $transactionType = $this->TransactionTypes->patchEntity($transactionType, $this->request->getData());
            if ($this->TransactionTypes->save($transactionType)) {
                $this->Flash->success(__('The transaction type has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction type could not be saved. Please, try again.'));
        }
        $this->set(compact('transactionType'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Transaction Type id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $transactionType = $this->TransactionTypes->get($id);
        if ($this->TransactionTypes->delete($transactionType)) {
            $this->Flash->success(__('The transaction type has been deleted.'));
        } else {
            $this->Flash->error(__('The transaction type could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
