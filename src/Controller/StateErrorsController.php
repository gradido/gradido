<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * StateErrors Controller
 *
 * @property \App\Model\Table\StateErrorsTable $StateErrors
 *
 * @method \App\Model\Entity\StateError[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class StateErrorsController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['StateUsers', 'TransactionTypes']
        ];
        $stateErrors = $this->paginate($this->StateErrors);

        $this->set(compact('stateErrors'));
    }

    /**
     * View method
     *
     * @param string|null $id State Error id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $stateError = $this->StateErrors->get($id, [
            'contain' => ['StateUsers', 'TransactionTypes']
        ]);

        $this->set('stateError', $stateError);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $stateError = $this->StateErrors->newEntity();
        if ($this->request->is('post')) {
            $stateError = $this->StateErrors->patchEntity($stateError, $this->request->getData());
            if ($this->StateErrors->save($stateError)) {
                $this->Flash->success(__('The state error has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The state error could not be saved. Please, try again.'));
        }
        $stateUsers = $this->StateErrors->StateUsers->find('list', ['limit' => 200]);
        $transactionTypes = $this->StateErrors->TransactionTypes->find('list', ['limit' => 200]);
        $this->set(compact('stateError', 'stateUsers', 'transactionTypes'));
    }

    /**
     * Edit method
     *
     * @param string|null $id State Error id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $stateError = $this->StateErrors->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $stateError = $this->StateErrors->patchEntity($stateError, $this->request->getData());
            if ($this->StateErrors->save($stateError)) {
                $this->Flash->success(__('The state error has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The state error could not be saved. Please, try again.'));
        }
        $stateUsers = $this->StateErrors->StateUsers->find('list', ['limit' => 200]);
        $transactionTypes = $this->StateErrors->TransactionTypes->find('list', ['limit' => 200]);
        $this->set(compact('stateError', 'stateUsers', 'transactionTypes'));
    }

    /**
     * Delete method
     *
     * @param string|null $id State Error id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $stateError = $this->StateErrors->get($id);
        if ($this->StateErrors->delete($stateError)) {
            $this->Flash->success(__('The state error has been deleted.'));
        } else {
            $this->Flash->error(__('The state error could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
