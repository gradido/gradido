<?php
namespace App\Controller;

use Cake\Routing\Router;
use Cake\I18n\I18n;
use Cake\I18n\FrozenTime;
use Cake\ORM\TableRegistry;

use App\Controller\AppController;
use App\Form\UserSearchForm;
use App\Model\Validation\GenericValidation;

use Model\Navigation\NaviHierarchy;
use Model\Navigation\NaviHierarchyEntry;

use Model\Transactions\TransactionCreation;
use App\Model\Table\StateUsersTable;

use App\Form\AssignRoleForm;


/**
 * StateUserRoles Controller
 *
 * @property \App\Model\Table\StateUsersTable $StateUsers
 *
 * @method \App\Model\Entity\StateUser[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class StateUserRolesController extends AppController
{

    public function initialize()
    {
        parent::initialize();
        $this->loadComponent('JsonRequestClient');
        $this->Auth->allow([
            'search'
         ]);
        $this->set(
            'naviHierarchy',
            (new NaviHierarchy())->
            add(new NaviHierarchyEntry(__('Startseite'), 'Dashboard', 'index', false))->add(new NaviHierarchyEntry(__('Benutzer suchen'), 'StateUsers', 'search', true))
        );
    }

    public function search()
    {
        $this->loadModel('StateUsers');
        $startTime = microtime(true);
        I18n::setLocale('de_DE');
        $this->viewBuilder()->setLayout('frontend');
        $session = $this->getRequest()->getSession();
        $result = $this->requestLogin();
        if ($result !== true) {
            return $result;
        }
        $user = $session->read('StateUser');
        if ($user['role'] != 'admin') {
            return $this->redirect(['controller' => 'dashboard', 'action' => 'index']);
        }

        $searchForm = new UserSearchForm();

        $timeUsed = microtime(true) - $startTime;
        //$this->set('timeUsed', $timeUsed);
        $csfr_token = $this->request->getParam('_csrfToken');
        $this->set(compact('timeUsed', 'searchForm', 'csfr_token'));

        if ($this->request->is('post')) {
            $requestData = $this->request->getData();

            if ($searchForm->validate($requestData)) {
              //var_dump($requestData);
                $searchString = $requestData['search'];
                $searchType = 'unknown';
                if (GenericValidation::email($searchString, [])) {
                    $searchType = 'email';
                }
              // find users on login server
                $resultJson = $this->JsonRequestClient->getUsers($session->read('session_id'), $searchString);
                $loginServerUser = [];
                if ($resultJson['state'] == 'success') {
                    $dataJson = $resultJson['data'];
                    if ($dataJson['state'] != 'success') {
                        if ($dataJson['msg'] == 'session not found') {
                            $session->destroy();
                            return $this->redirect(Router::url('/', true) . 'account', 303);
                        }
                    }
                  //var_dump($dataJson);
                    if (isset($dataJson['users'])) {
                        $loginServerUser = $dataJson['users'];
                    }
                }
                $pubkeySorted = [];
                $emptyPubkeys = [];
                foreach ($loginServerUser as $u) {
                    if (!isset($u['public_hex']) || $u['public_hex'] == '') {
                        array_push($emptyPubkeys, $u);
                    } else {
                        if (!isset($pubkeySorted[$u['public_hex']])) {
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
                  //'username   LIKE' => $globalSearch,
                  'email      LIKE' => $globalSearch
                ]]);

              //var_dump($communityUsers->toArray());
                foreach ($communityUsers as $u) {
                    $pubkey_hex = bin2hex(stream_get_contents($u->public_key));
                    $u->public_hex = $pubkey_hex;
                    if (!isset($pubkeySorted[$pubkey_hex])) {
                        $pubkeySorted[$pubkey_hex] = ['login' => [], 'community' => []];
                    }
                    array_push($pubkeySorted[$pubkey_hex]['community'], $u);
                }
                $finalUserEntrys = [];
              // detect states
                foreach ($pubkeySorted as $pubhex => $user) {
                    $finalUser = [];
                    $state = 'account created';
                    $color = 'secondary';
                    $finalUser['balance'] = 0;
                    $finalUser['pubkeyhex'] = $pubhex;
                    $finalUser['created'] = null;

                    if (count($user['community']) == 1) {
                        if (isset($user['community'][0]->state_balances) &&
                         isset($user['community'][0]->state_balances[0]['amount'])) {
                            $finalUser['balance'] = $user['community'][0]->state_balances[0]->amount;
                        }
                    }

                    if (count($user['login']) == 0) {
                        $state = 'account not on login-server';
                        $color = 'danger';
                        if (count($user['community']) == 1) {
                            $c_user = $user['community'][0];
                            $finalUser['name'] = $c_user->first_name . ' ' . $c_user->last_name;
                            $finalUser['first_name'] = $c_user->first_name;
                            $finalUser['last_name'] = $c_user->last_name;
                            //$finalUser['username'] = $c_user->username;
                            $finalUser['email'] = $c_user->email;
                        }
                    } elseif (count($user['login']) == 1) {
                        if ($user['login'][0]['email_checked'] == true) {
                            $state = 'email activated';
                            $color = 'primary';

                            if (count($user['community']) == 1) {
                                $state = 'account copied to community';
                                $color = 'success';
                                //var_dump($user['community'][0]->state_balances[0]['amount']);
                            }
                        } else {
                            $state = 'email not activated';
                            $color = 'warning';
                        }

                        $l_user = $user['login'][0];
                        $finalUser['name'] = $l_user['first_name'] . ' ' . $l_user['last_name'];
                        $finalUser['first_name'] = $l_user['first_name'];
                        $finalUser['last_name'] = $l_user['last_name'];
                        //$finalUser['username'] = $l_user['username'];
                        $finalUser['email'] = $l_user['email'];
                        $finalUser['created'] =  new FrozenTime($l_user['created']);
                    } else {
                        $state = 'account multiple times on login-server';
                        $color = 'danger';
                    }
                   
                    $this->loadModel('Roles');
                    $state_user_id = $user['community'][0]->id;
                    $stateUserRole = $this->StateUserRoles->find('all')->where(['state_user_id' => $state_user_id])->all();

                    $role_ids = "";
                    foreach ($stateUserRole as $userRole) {
                        if($role_ids != "")
                            $role_ids .= ",".$userRole->role_id;
                        else
                            $role_ids = $userRole->role_id;
                    }

                    $roles = $this->Roles->find('all')->where(['id IN' => explode(",",$role_ids)])->all();

                    $role_names = "";
                    foreach($roles as $role)
                    {
                        if($role_names != "")
                            $role_names .= "<br/>".$role->title;
                        else
                            $role_names = $role->title;   
                    }

                    $finalUser['role_name'] = $role_names;

                    $finalUser['indicator'] = ['name' => $state, 'color' => $color];
                    array_push($finalUserEntrys, $finalUser);
                }

                foreach ($emptyPubkeys as $user) {
                    $finalUser = [];
                    $state = 'account not on community server';
                    $color = 'secondary';
                    if ($user['email_checked'] == false) {
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
                    //$finalUser['username'] = $user['username'];
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

    public function assignRole()
    {
        $this->loadModel('Roles');
        $this->loadModel('StateUsers');

        if ($this->request->is('post')) {
            $requestData = $this->request->getData();

            $public_hex = hex2bin($requestData['public_hex']);

            $stateUser = $this->StateUsers->find('all')->where(['public_key' => $public_hex])->first();

            foreach($requestData['role_id'] as $role_id)
            {
                $newStateUserRole = $this->StateUserRoles->newEntity();

                $post_data = [];
                $post_data['state_user_id'] = $stateUser->id;
                $post_data['role_id'] = $role_id;
                $this->StateUserRoles->patchEntity($newStateUserRole, $post_data);
                $this->StateUserRoles->save($newStateUserRole);

            }

            $this->Flash->success(__('Role has been assigned to User.'));

            return $this->redirect(['controller' => 'state-user-roles', 'action' => 'search']);
                        
        }

        $assignRoleForm = new AssignRoleForm();

        $public_hex = $this->request->getParam('pass')[0];

        $publichex = hex2bin($public_hex);

        $stateUser = $this->StateUsers->find('all')->where(['public_key' => $publichex])->first();

        $stateUserRoles = $this->StateUserRoles->find('all')->where(['state_user_id' => $stateUser->id])->all();

        $role_ids = "";
        foreach ($stateUserRoles as $userRole) {
            if($role_ids != "")
                $role_ids .= ",".$userRole->role_id;
            else
                $role_ids = $userRole->role_id;
        }

        $role_ids = explode(",", $role_ids);

        $roles = $this->Roles->find('list', array('fields' => array('id', 'title')));

     
        $this->set('roles', $roles);
        $this->set('stateUser', $stateUser);
        $this->set('role_ids', $role_ids);
        $this->set('assignRoleForm', $assignRoleForm);
        $this->set('public_hex', $public_hex);
    }
   
}
