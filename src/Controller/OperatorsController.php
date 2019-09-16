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
  
    public function initialize()
    {
        parent::initialize();
        $this->Auth->allow(['ajaxSave', 'ajaxLoad']);
    }
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['OperatorTypes']
        ];
        $operators = $this->paginate($this->Operators);

        $this->set(compact('operators'));
    }
    
    public function ajaxSave() 
    {
      if ($this->request->is('post')) {
        
        
        
        $operatorTypeName = $this->request->getData('operator_type_name');
        $usernamePasswordHash = $this->request->getData('usernamePasswordHash');
        $operatorTypeId = $this->Operators->OperatorTypes->
                find()
                ->where(['name' => $operatorTypeName])
                ->select(['id'])
                ->first();
        
        // load operator from db if already exist
        $operator = $this->Operators
                ->find()
                ->where([
                    'operator_type_id' => $operatorTypeId->id,
                    'usernamePasswordHash' => $usernamePasswordHash])
                ->first();
        if(!$operator) {
          // create new entity
          $operator = $this->Operators->newEntity();
        }
        
        $operator = $this->Operators->patchEntity($operator, $this->request->getData());
        $operator->operator_type_id = $operatorTypeId->id;
        if ($this->Operators->save($operator)) {
            return $this->returnJson(['state' => 'success']);
        }
        return $this->returnJson(['state' => 'error', 'details' => $operator->getErrors()]);
      }
      return $this->returnJson(['state' => 'error', 'msg' => 'no post request']);
    }
    
    public function ajaxLoad()
    {
      if ($this->request->is('get')) {
        $usernamePasswordHash = $this->request->getQuery('usernamePasswordHash');
        $operators = $this->Operators
                ->find()
                ->where(['usernamePasswordHash' => $usernamePasswordHash])
                ->contain(['OperatorTypes'])
                ->toArray();
        ;
        if($operators) {
          return $this->returnJson(['state' => 'success', 'operators' => $operators]);
        } else {
          return $this->returnJson(['state' => 'not found']);
        }
        
      }
      return $this->returnJson(['state' => 'error', 'msg' => 'no post request']);
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
            'contain' => ['OperatorTypes']
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
        $operatorTypes = $this->Operators->OperatorTypes->find('list', ['limit' => 200]);
        $this->set(compact('operator', 'operatorTypes'));
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
        $operatorTypes = $this->Operators->OperatorTypes->find('list', ['limit' => 200]);
        $this->set(compact('operator', 'operatorTypes'));
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
