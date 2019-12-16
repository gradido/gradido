<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * AdminErrors Controller
 *
 * @property \App\Model\Table\AdminErrorsTable $AdminErrors
 *
 * @method \App\Model\Entity\AdminError[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class AdminErrorsController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['StateUsers']
        ];
        $adminErrors = $this->paginate($this->AdminErrors);

        $this->set(compact('adminErrors'));
    }

    /**
     * View method
     *
     * @param string|null $id Admin Error id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $adminError = $this->AdminErrors->get($id, [
            'contain' => ['StateUsers']
        ]);

        $this->set('adminError', $adminError);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $adminError = $this->AdminErrors->newEntity();
        if ($this->request->is('post')) {
            $adminError = $this->AdminErrors->patchEntity($adminError, $this->request->getData());
            if ($this->AdminErrors->save($adminError)) {
                $this->Flash->success(__('The admin error has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The admin error could not be saved. Please, try again.'));
        }
        $stateUsers = $this->AdminErrors->StateUsers->find('list', ['limit' => 200]);
        $this->set(compact('adminError', 'stateUsers'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Admin Error id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $adminError = $this->AdminErrors->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $adminError = $this->AdminErrors->patchEntity($adminError, $this->request->getData());
            if ($this->AdminErrors->save($adminError)) {
                $this->Flash->success(__('The admin error has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The admin error could not be saved. Please, try again.'));
        }
        $stateUsers = $this->AdminErrors->StateUsers->find('list', ['limit' => 200]);
        $this->set(compact('adminError', 'stateUsers'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Admin Error id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $adminError = $this->AdminErrors->get($id);
        if ($this->AdminErrors->delete($adminError)) {
            $this->Flash->success(__('The admin error has been deleted.'));
        } else {
            $this->Flash->error(__('The admin error could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
