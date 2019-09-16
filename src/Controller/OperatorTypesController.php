<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * OperatorTypes Controller
 *
 * @property \App\Model\Table\OperatorTypesTable $OperatorTypes
 *
 * @method \App\Model\Entity\OperatorType[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class OperatorTypesController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $operatorTypes = $this->paginate($this->OperatorTypes);

        $this->set(compact('operatorTypes'));
    }

    /**
     * View method
     *
     * @param string|null $id Operator Type id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $operatorType = $this->OperatorTypes->get($id, [
            'contain' => ['Operators']
        ]);

        $this->set('operatorType', $operatorType);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $operatorType = $this->OperatorTypes->newEntity();
        if ($this->request->is('post')) {
            $operatorType = $this->OperatorTypes->patchEntity($operatorType, $this->request->getData());
            if ($this->OperatorTypes->save($operatorType)) {
                $this->Flash->success(__('The operator type has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The operator type could not be saved. Please, try again.'));
        }
        $this->set(compact('operatorType'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Operator Type id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $operatorType = $this->OperatorTypes->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $operatorType = $this->OperatorTypes->patchEntity($operatorType, $this->request->getData());
            if ($this->OperatorTypes->save($operatorType)) {
                $this->Flash->success(__('The operator type has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The operator type could not be saved. Please, try again.'));
        }
        $this->set(compact('operatorType'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Operator Type id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $operatorType = $this->OperatorTypes->get($id);
        if ($this->OperatorTypes->delete($operatorType)) {
            $this->Flash->success(__('The operator type has been deleted.'));
        } else {
            $this->Flash->error(__('The operator type could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
