<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * StateCreated Controller
 *
 * @property \App\Model\Table\StateCreatedTable $StateCreated
 *
 * @method \App\Model\Entity\StateCreated[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class StateCreatedController extends AppController
{
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
        $stateCreated = $this->paginate($this->StateCreated);

        $this->set(compact('stateCreated'));
    }

    /**
     * View method
     *
     * @param string|null $id State Created id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $stateCreated = $this->StateCreated->get($id, [
            'contain' => ['Transactions', 'StateUsers']
        ]);

        $this->set('stateCreated', $stateCreated);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $stateCreated = $this->StateCreated->newEntity();
        if ($this->request->is('post')) {
            $stateCreated = $this->StateCreated->patchEntity($stateCreated, $this->request->getData());
            if ($this->StateCreated->save($stateCreated)) {
                $this->Flash->success(__('The state created has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The state created could not be saved. Please, try again.'));
        }
        $transactions = $this->StateCreated->Transactions->find('list', ['limit' => 200]);
        $stateUsers = $this->StateCreated->StateUsers->find('list', ['limit' => 200]);
        $this->set(compact('stateCreated', 'transactions', 'stateUsers'));
    }

    /**
     * Edit method
     *
     * @param string|null $id State Created id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $stateCreated = $this->StateCreated->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $stateCreated = $this->StateCreated->patchEntity($stateCreated, $this->request->getData());
            if ($this->StateCreated->save($stateCreated)) {
                $this->Flash->success(__('The state created has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The state created could not be saved. Please, try again.'));
        }
        $transactions = $this->StateCreated->Transactions->find('list', ['limit' => 200]);
        $stateUsers = $this->StateCreated->StateUsers->find('list', ['limit' => 200]);
        $this->set(compact('stateCreated', 'transactions', 'stateUsers'));
    }

    /**
     * Delete method
     *
     * @param string|null $id State Created id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $stateCreated = $this->StateCreated->get($id);
        if ($this->StateCreated->delete($stateCreated)) {
            $this->Flash->success(__('The state created has been deleted.'));
        } else {
            $this->Flash->error(__('The state created could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
