<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * ServerUsers Controller
 *
 * @property \App\Model\Table\ServerUsersTable $ServerUsers
 *
 * @method \App\Model\Entity\ServerUser[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class ServerUsersController extends AppController
{
    public function initialize()
    {
        parent::initialize();
        $this->Auth->allow(['add', 'edit']);
        $this->Auth->deny('index');
    }

    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $serverUsers = $this->paginate($this->ServerUsers);
        $this->set(compact('serverUsers'));
    }

    public function login()
    {
        $startTime = microtime(true);
        if ($this->request->is('post')) {
            $user = $this->Auth->identify();
            if ($user) {
                $this->Auth->setUser($user);
                return $this->redirect($this->Auth->redirectUrl());
            }
            $this->Flash->error(__('Invalid username or password, try again'));
        }
        $this->set('timeUsed', microtime(true) - $startTime);
    }

    public function logout()
    {
        return $this->redirect($this->Auth->logout());
    }

    /**
     * View method
     *
     * @param string|null $id Server User id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $serverUser = $this->ServerUsers->get($id, [
            'contain' => []
        ]);

        $this->set('serverUser', $serverUser);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $serverUser = $this->ServerUsers->newEntity();
        if ($this->request->is('post')) {
            $serverUser = $this->ServerUsers->patchEntity($serverUser, $this->request->getData());
            if ($this->ServerUsers->save($serverUser)) {
                $this->Flash->success(__('The server user has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The server user could not be saved. Please, try again.'));
        }
        $this->set(compact('serverUser'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Server User id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $serverUser = $this->ServerUsers->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $serverUser = $this->ServerUsers->patchEntity($serverUser, $this->request->getData());
            if ($this->ServerUsers->save($serverUser)) {
                $this->Flash->success(__('The server user has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The server user could not be saved. Please, try again.'));
        }
        $this->set(compact('serverUser'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Server User id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $serverUser = $this->ServerUsers->get($id);
        if ($this->ServerUsers->delete($serverUser)) {
            $this->Flash->success(__('The server user has been deleted.'));
        } else {
            $this->Flash->error(__('The server user could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
