<?php
namespace App\Controller;

use Cake\Routing\Router;
use Cake\I18n\I18n;
use Cake\I18n\FrozenTime;

use App\Controller\AppController;
use App\Form\UserSearchForm;
use App\Model\Validation\GenericValidation;

use Model\Transactions\TransactionCreation;

// for translating
__('account created');
__('account not on login-server');
__('email activated');
__('account copied to community');
__('email not activated');
__('account multiple times on login-server');
__('account not on community server');
__('no keys');

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
        $this->Auth->allow(['search', 'ajaxCopyLoginToCommunity']);
        
    }
    
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => []
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
        I18n::setLocale('de_DE');
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
        $csfr_token = $this->request->getParam('_csrfToken');
        $this->set(compact('timeUsed', 'searchForm', 'csfr_token'));
        
        if ($this->request->is('post')) {
          $requestData = $this->request->getData();
          
          if($searchForm->validate($requestData)) {
            //var_dump($requestData);
            $searchString = $requestData['search'];
            $searchType = 'unknown';
            if(GenericValidation::email($searchString, [])) {
              $searchType = 'email';
            }
            // find users on login server
            $resultJson = $this->JsonRequestClient->getUsers($session->read('session_id'), $searchString);
            $loginServerUser = [];
            if($resultJson['state'] == 'success') {
              $dataJson = $resultJson['data'];
              if($dataJson['state'] != 'success') {
                  if($dataJson['msg'] == 'session not found') {
                    $session->destroy();
                    return $this->redirect(Router::url('/', true) . 'account', 303);
                  }
              }
              //var_dump($dataJson);
              $loginServerUser = $dataJson['users'];
            }
            $pubkeySorted = [];
            $emptyPubkeys = [];
            foreach($loginServerUser as $u) {
              if(!isset($u['public_hex']) || $u['public_hex'] == '') {
                array_push($emptyPubkeys, $u);
              } else {
                if(!isset($pubkeySorted[$u['public_hex']])) {
                  $pubkeySorted[$u['public_hex']] = ['login' => [], 'community' => []];
                }
                array_push($pubkeySorted[$u['public_hex']]['login'], $u);
              }
            }
            // find user on community server db
            $globalSearch = '%' . $searchString . '%';
            $communityUsers = $this->StateUsers
                    ->find('all')
                    ->contain(['StateBalances' => ['fields' => ['amount', 'state_user_id']]]);
            
            $communityUsers->where(['OR' => [
                  'first_name LIKE' => $globalSearch,
                  'last_name  LIKE' => $globalSearch,
                  'email      LIKE' => $globalSearch
            ]]);
            
            //var_dump($communityUsers->toArray());
            foreach($communityUsers as $u) {
              $pubkey_hex = bin2hex(stream_get_contents($u->public_key));
              $u->public_hex = $pubkey_hex;
              if(!isset($pubkeySorted[$pubkey_hex])) {
                $pubkeySorted[$pubkey_hex] = ['login' => [], 'community' => []];
              }
              array_push($pubkeySorted[$u['public_hex']]['community'], $u);
            }
            $finalUserEntrys = [];
            // detect states
            foreach($pubkeySorted as $pubhex => $user) {
              $finalUser = [];
              $state = 'account created';
              $color = 'secondary';
              $finalUser['balance'] = 0;
              $finalUser['pubkeyhex'] = $pubhex;
              $finalUser['created'] = null;
              
              if(count($user['login']) == 0) {
                $state = 'account not on login-server';
                $color = 'danger';
                if(count($user['community']) == 1) {
                  $c_user = $user['community'][0];
                  $finalUser['name'] = $c_user->first_name . ' ' . $c_user->last_name;
                  $finalUser['email'] = $c_user->email;
                }
              } else if(count($user['login']) == 1) {
                if($user['login'][0]['email_checked'] == true) {
                  $state = 'email activated';
                  $color = 'primary';
                  $l_user = $user['login'][0];
                  $finalUser['name'] = $l_user['first_name'] . ' ' . $l_user['last_name'];
                  $finalUser['first_name'] = $l_user['first_name'];
                  $finalUser['last_name'] = $l_user['last_name'];
                  $finalUser['email'] = $l_user['email'];
                  $finalUser['created'] =  new FrozenTime($l_user['created']);
                  if(count($user['community']) == 1) {
                    $state = 'account copied to community';
                    $color = 'success';
                    //var_dump($user['community'][0]->state_balances[0]['amount']);
                    if(isset($user['community'][0]->state_balances) && 
                       isset($user['community'][0]->state_balances[0]['amount'])) {
                      $finalUser['balance'] = $user['community'][0]->state_balances[0]->amount;
                    }
                  }
                  
                } else {
                  $state = 'email not activated';
                  $color = 'warning';
                }
              } else {
                $state = 'account multiple times on login-server';
                $color = 'danger';
              }
              $finalUser['indicator'] = ['name' => $state, 'color' => $color];
              array_push($finalUserEntrys, $finalUser);
            }
            
            foreach($emptyPubkeys as $user) {
              $finalUser = [];
              $state = 'account not on community server';
              $color = 'secondary';
              if($user['email_checked'] == false) {
                $state = 'email not activated';
                $color = 'warning';
              } else {
                $state = 'no keys';
                $color = 'warning';
              }
              $finalUser['balance'] = 0;
              $finalUser['pubkeyhex'] = '';
              $finalUser['name'] = $user['first_name'] . ' ' . $user['last_name'];
              $finalUser['first_name'] = $user['first_name'];
              $finalUser['last_name'] = $user['last_name'];
              $finalUser['email'] = $user['email'];
              $finalUser['created'] = new FrozenTime($user['created']);
              $finalUser['indicator'] = ['name' => $state, 'color' => $color];
              array_push($finalUserEntrys, $finalUser);
            }
            //var_dump($pubkeySorted);
          } else {
            $this->Flash->error(__('Something was invalid, please try again!'));
          }
          
          $this->set('finalUserEntrys', $finalUserEntrys);
        }
        $timeUsed = microtime(true) - $startTime;
        $this->set('timeUsed', $timeUsed);
    }
    
    public function ajaxCopyLoginToCommunity() 
    {
      if($this->request->is('post')) {
          $jsonData = $this->request->input('json_decode', true);
          //$user = $jsonData['user'];
          //var_dump($jsonData);
          
          $newStateUser = $this->StateUsers->newEntity();
          $this->StateUsers->patchEntity($newStateUser, $jsonData);
          $newStateUser->public_key = hex2bin($jsonData['pubkeyhex']);
          
          if(!$this->StateUsers->save($newStateUser)) {
            return $this->returnJson(['state' => 'error', 'msg' => 'error by saving', 'details' => json_encode($newStateUser->errors())]);
          }
                      
          return $this->returnJson(['state' => 'success']);
      }
      return $this->returnJson(['state' => 'error', 'msg' => 'no post request']);
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
