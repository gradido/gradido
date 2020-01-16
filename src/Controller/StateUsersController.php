<?php
namespace App\Controller;

use Cake\Routing\Router;

use App\Controller\AppController;
use App\Form\UserSearchForm;
use App\Model\Validation\GenericValidation;

use Model\Transactions\TransactionCreation;

/**
 * StateUsers Controller
 *
 * @property \App\Model\Table\StateUsersTable $StateUsers
 *
 * @method \App\Model\Entity\StateUser[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class StateUsersController extends AppController
{
  
    public function initialize()
    {
        parent::initialize();
        $this->loadComponent('GradidoNumber');
        $this->loadComponent('JsonRequestClient');
        $this->Auth->allow(['search']);
        
    }
    
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
    
    public function listIdentHashes()
    {
        $stateUsers = $this->StateUsers->find('all')->toArray();
        foreach($stateUsers as $i => $user) {
          $stateUsers[$i]->identHash = TransactionCreation::DRMakeStringHash($user->email);
        }
        $this->set('stateUsers', $stateUsers);
    }
    
    public function search()
    {
        $startTime = microtime(true);
        $this->viewBuilder()->setLayout('frontend_ripple');
        $session = $this->getRequest()->getSession();
        $result = $this->requestLogin();
        if($result !== true) {
          return $result;
        }
        $user = $session->read('StateUser');
        if($user['role'] != 'admin') {
          return $this->redirect(['controller' => 'dashboard', 'action' => 'index']); 
        }
        
        $searchForm = new UserSearchForm();
        
        $timeUsed = microtime(true) - $startTime;
        //$this->set('timeUsed', $timeUsed);
        $this->set(compact('timeUsed', 'searchForm'));
        
        if ($this->request->is('post')) {
          $requestData = $this->request->getData();
          
          if($searchForm->validate($requestData)) {
            //var_dump($requestData);
            $searchString = $requestData['search'];
            $searchType = 'unknown';
            if(GenericValidation::email($searchString, [])) {
              $searchType = 'email';
            }
            $resultJson = $this->JsonRequestClient->getUsers($session->read('session_id'), $searchString);
            if($resultJson['state'] == 'success') {
              $dataJson = $resultJson['data'];
              if($dataJson['state'] != 'success') {
                  if($dataJson['msg'] == 'session not found') {
                    $session->destroy();
                    return $this->redirect(Router::url('/', true) . 'account', 303);
                  }
              }
              var_dump($dataJson);
            }
            
          } else {
            $this->Flash->error(__('Something was invalid, please try again!'));
          }
          $timeUsed = microtime(true) - $startTime;
          $this->set('timeUsed', $timeUsed);
        }
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
