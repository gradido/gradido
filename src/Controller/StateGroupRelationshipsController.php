<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * StateGroupRelationships Controller
 *
 * @property \App\Model\Table\StateGroupRelationshipsTable $StateGroupRelationships
 *
 * @method \App\Model\Entity\StateGroupRelationship[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class StateGroupRelationshipsController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['StateGroup1s', 'StateGroup2s', 'StateRelationships']
        ];
        $stateGroupRelationships = $this->paginate($this->StateGroupRelationships);

        $this->set(compact('stateGroupRelationships'));
    }

    /**
     * View method
     *
     * @param string|null $id State Group Relationship id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $stateGroupRelationship = $this->StateGroupRelationships->get($id, [
            'contain' => ['StateGroup1s', 'StateGroup2s', 'StateRelationships']
        ]);

        $this->set('stateGroupRelationship', $stateGroupRelationship);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $stateGroupRelationship = $this->StateGroupRelationships->newEntity();
        if ($this->request->is('post')) {
            $stateGroupRelationship = $this->StateGroupRelationships->patchEntity($stateGroupRelationship, $this->request->getData());
            if ($this->StateGroupRelationships->save($stateGroupRelationship)) {
                $this->Flash->success(__('The state group relationship has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The state group relationship could not be saved. Please, try again.'));
        }
        $stateGroup1s = $this->StateGroupRelationships->StateGroup1s->find('list', ['limit' => 200]);
        $stateGroup2s = $this->StateGroupRelationships->StateGroup2s->find('list', ['limit' => 200]);
        $stateRelationships = $this->StateGroupRelationships->StateRelationships->find('list', ['limit' => 200]);
        $this->set(compact('stateGroupRelationship', 'stateGroup1s', 'stateGroup2s', 'stateRelationships'));
    }

    /**
     * Edit method
     *
     * @param string|null $id State Group Relationship id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $stateGroupRelationship = $this->StateGroupRelationships->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $stateGroupRelationship = $this->StateGroupRelationships->patchEntity($stateGroupRelationship, $this->request->getData());
            if ($this->StateGroupRelationships->save($stateGroupRelationship)) {
                $this->Flash->success(__('The state group relationship has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The state group relationship could not be saved. Please, try again.'));
        }
        $stateGroup1s = $this->StateGroupRelationships->StateGroup1s->find('list', ['limit' => 200]);
        $stateGroup2s = $this->StateGroupRelationships->StateGroup2s->find('list', ['limit' => 200]);
        $stateRelationships = $this->StateGroupRelationships->StateRelationships->find('list', ['limit' => 200]);
        $this->set(compact('stateGroupRelationship', 'stateGroup1s', 'stateGroup2s', 'stateRelationships'));
    }

    /**
     * Delete method
     *
     * @param string|null $id State Group Relationship id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $stateGroupRelationship = $this->StateGroupRelationships->get($id);
        if ($this->StateGroupRelationships->delete($stateGroupRelationship)) {
            $this->Flash->success(__('The state group relationship has been deleted.'));
        } else {
            $this->Flash->error(__('The state group relationship could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
