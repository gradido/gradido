<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * StateUsers Controller
 *
 * @property \App\Model\Table\StateUsersTable $StateUsers
 *
 * @method \App\Model\Entity\StateUser[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class StateUsersController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['Indices', 'StateGroups']
        ];
        $stateUsers = $this->paginate($this->StateUsers);

        $this->set(compact('stateUsers'));
    }

    /**
     * View method
     *
     * @param string|null $id State User id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $stateUser = $this->StateUsers->get($id, [
            'contain' => ['Indices', 'StateGroups', 'StateBalances', 'StateCreated', 'TransactionCreations', 'TransactionSendCoins']
        ]);

        $this->set('stateUser', $stateUser);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $stateUser = $this->StateUsers->newEntity();
        if ($this->request->is('post')) {
            $stateUser = $this->StateUsers->patchEntity($stateUser, $this->request->getData());
            if ($this->StateUsers->save($stateUser)) {
                $this->Flash->success(__('The state user has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The state user could not be saved. Please, try again.'));
        }
        $indices = $this->StateUsers->Indices->find('list', ['limit' => 200]);
        $stateGroups = $this->StateUsers->StateGroups->find('list', ['limit' => 200]);
        $this->set(compact('stateUser', 'indices', 'stateGroups'));
    }

    /**
     * Edit method
     *
     * @param string|null $id State User id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $stateUser = $this->StateUsers->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $stateUser = $this->StateUsers->patchEntity($stateUser, $this->request->getData());
            if ($this->StateUsers->save($stateUser)) {
                $this->Flash->success(__('The state user has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The state user could not be saved. Please, try again.'));
        }
        $indices = $this->StateUsers->Indices->find('list', ['limit' => 200]);
        $stateGroups = $this->StateUsers->StateGroups->find('list', ['limit' => 200]);
        $this->set(compact('stateUser', 'indices', 'stateGroups'));
    }

    /**
     * Delete method
     *
     * @param string|null $id State User id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $stateUser = $this->StateUsers->get($id);
        if ($this->StateUsers->delete($stateUser)) {
            $this->Flash->success(__('The state user has been deleted.'));
        } else {
            $this->Flash->error(__('The state user could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
