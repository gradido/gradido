<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * StateGroups Controller
 *
 * @property \App\Model\Table\StateGroupsTable $StateGroups
 *
 * @method \App\Model\Entity\StateGroup[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class StateGroupsController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['Indices']
        ];
        $stateGroups = $this->paginate($this->StateGroups);

        $this->set(compact('stateGroups'));
    }

    /**
     * View method
     *
     * @param string|null $id State Group id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $stateGroup = $this->StateGroups->get($id, [
            'contain' => ['Indices', 'StateGroupAddresses', 'StateUsers', 'TransactionGroupCreates', 'Transactions']
        ]);

        $this->set('stateGroup', $stateGroup);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $stateGroup = $this->StateGroups->newEntity();
        if ($this->request->is('post')) {
            $stateGroup = $this->StateGroups->patchEntity($stateGroup, $this->request->getData());
            if ($this->StateGroups->save($stateGroup)) {
                $this->Flash->success(__('The state group has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The state group could not be saved. Please, try again.'));
        }
        $indices = $this->StateGroups->Indices->find('list', ['limit' => 200]);
        $this->set(compact('stateGroup', 'indices'));
    }

    /**
     * Edit method
     *
     * @param string|null $id State Group id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $stateGroup = $this->StateGroups->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $stateGroup = $this->StateGroups->patchEntity($stateGroup, $this->request->getData());
            if ($this->StateGroups->save($stateGroup)) {
                $this->Flash->success(__('The state group has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The state group could not be saved. Please, try again.'));
        }
        $indices = $this->StateGroups->Indices->find('list', ['limit' => 200]);
        $this->set(compact('stateGroup', 'indices'));
    }

    /**
     * Delete method
     *
     * @param string|null $id State Group id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $stateGroup = $this->StateGroups->get($id);
        if ($this->StateGroups->delete($stateGroup)) {
            $this->Flash->success(__('The state group has been deleted.'));
        } else {
            $this->Flash->error(__('The state group could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
