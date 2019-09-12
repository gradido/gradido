<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * Operators Controller
 *
 * @property \App\Model\Table\OperatorsTable $Operators
 *
 * @method \App\Model\Entity\Operator[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class OperatorsController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $operators = $this->paginate($this->Operators);

        $this->set(compact('operators'));
    }

    /**
     * View method
     *
     * @param string|null $id Operator id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $operator = $this->Operators->get($id, [
            'contain' => []
        ]);

        $this->set('operator', $operator);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $operator = $this->Operators->newEntity();
        if ($this->request->is('post')) {
            $operator = $this->Operators->patchEntity($operator, $this->request->getData());
            if ($this->Operators->save($operator)) {
                $this->Flash->success(__('The operator has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The operator could not be saved. Please, try again.'));
        }
        $this->set(compact('operator'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Operator id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $operator = $this->Operators->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $operator = $this->Operators->patchEntity($operator, $this->request->getData());
            if ($this->Operators->save($operator)) {
                $this->Flash->success(__('The operator has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The operator could not be saved. Please, try again.'));
        }
        $this->set(compact('operator'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Operator id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $operator = $this->Operators->get($id);
        if ($this->Operators->delete($operator)) {
            $this->Flash->success(__('The operator has been deleted.'));
        } else {
            $this->Flash->error(__('The operator could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
