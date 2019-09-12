<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * StateRelationshipTypes Controller
 *
 * @property \App\Model\Table\StateRelationshipTypesTable $StateRelationshipTypes
 *
 * @method \App\Model\Entity\StateRelationshipType[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class StateRelationshipTypesController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $stateRelationshipTypes = $this->paginate($this->StateRelationshipTypes);

        $this->set(compact('stateRelationshipTypes'));
    }

    /**
     * View method
     *
     * @param string|null $id State Relationship Type id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $stateRelationshipType = $this->StateRelationshipTypes->get($id, [
            'contain' => []
        ]);

        $this->set('stateRelationshipType', $stateRelationshipType);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $stateRelationshipType = $this->StateRelationshipTypes->newEntity();
        if ($this->request->is('post')) {
            $stateRelationshipType = $this->StateRelationshipTypes->patchEntity($stateRelationshipType, $this->request->getData());
            if ($this->StateRelationshipTypes->save($stateRelationshipType)) {
                $this->Flash->success(__('The state relationship type has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The state relationship type could not be saved. Please, try again.'));
        }
        $this->set(compact('stateRelationshipType'));
    }

    /**
     * Edit method
     *
     * @param string|null $id State Relationship Type id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $stateRelationshipType = $this->StateRelationshipTypes->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $stateRelationshipType = $this->StateRelationshipTypes->patchEntity($stateRelationshipType, $this->request->getData());
            if ($this->StateRelationshipTypes->save($stateRelationshipType)) {
                $this->Flash->success(__('The state relationship type has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The state relationship type could not be saved. Please, try again.'));
        }
        $this->set(compact('stateRelationshipType'));
    }

    /**
     * Delete method
     *
     * @param string|null $id State Relationship Type id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $stateRelationshipType = $this->StateRelationshipTypes->get($id);
        if ($this->StateRelationshipTypes->delete($stateRelationshipType)) {
            $this->Flash->success(__('The state relationship type has been deleted.'));
        } else {
            $this->Flash->error(__('The state relationship type could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
