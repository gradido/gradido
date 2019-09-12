<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * TransactionSignatures Controller
 *
 * @property \App\Model\Table\TransactionSignaturesTable $TransactionSignatures
 *
 * @method \App\Model\Entity\TransactionSignature[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class TransactionSignaturesController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['Transactions']
        ];
        $transactionSignatures = $this->paginate($this->TransactionSignatures);

        $this->set(compact('transactionSignatures'));
    }

    /**
     * View method
     *
     * @param string|null $id Transaction Signature id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $transactionSignature = $this->TransactionSignatures->get($id, [
            'contain' => ['Transactions']
        ]);

        $this->set('transactionSignature', $transactionSignature);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $transactionSignature = $this->TransactionSignatures->newEntity();
        if ($this->request->is('post')) {
            $transactionSignature = $this->TransactionSignatures->patchEntity($transactionSignature, $this->request->getData());
            if ($this->TransactionSignatures->save($transactionSignature)) {
                $this->Flash->success(__('The transaction signature has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction signature could not be saved. Please, try again.'));
        }
        $transactions = $this->TransactionSignatures->Transactions->find('list', ['limit' => 200]);
        $this->set(compact('transactionSignature', 'transactions'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Transaction Signature id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $transactionSignature = $this->TransactionSignatures->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $transactionSignature = $this->TransactionSignatures->patchEntity($transactionSignature, $this->request->getData());
            if ($this->TransactionSignatures->save($transactionSignature)) {
                $this->Flash->success(__('The transaction signature has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction signature could not be saved. Please, try again.'));
        }
        $transactions = $this->TransactionSignatures->Transactions->find('list', ['limit' => 200]);
        $this->set(compact('transactionSignature', 'transactions'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Transaction Signature id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $transactionSignature = $this->TransactionSignatures->get($id);
        if ($this->TransactionSignatures->delete($transactionSignature)) {
            $this->Flash->success(__('The transaction signature has been deleted.'));
        } else {
            $this->Flash->error(__('The transaction signature could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
