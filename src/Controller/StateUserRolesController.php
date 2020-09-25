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
//            'search'
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

        $searchForm = new UserSearchForm();

        $timeUsed = microtime(true) - $startTime;
        //$this->set('timeUsed', $timeUsed);
        $this->set(compact('timeUsed', 'searchForm'));

        if ($this->request->is('post')) {
            $requestData = $this->request->getData();

            if ($searchForm->validate($requestData)) {
              //var_dump($requestData);
                $searchString = $requestData['search'];

              // find user on community server db
                $globalSearch = '%' . $searchString . '%';
                $communityUsers = $this->StateUsers
                    ->find('all')
                    ->contain([]);

                $communityUsers->where(['OR' => [
                  'first_name LIKE' => $globalSearch,
                  'last_name  LIKE' => $globalSearch,
                  //'username   LIKE' => $globalSearch,
                  'email      LIKE' => $globalSearch
                ]]);

              //var_dump($communityUsers->toArray());
                $finalUserEntrys = [];
              // detect states
                $this->loadModel('Roles');
//                foreach ($pubkeySorted as $pubhex => $user) {
		foreach($communityUsers as $communityUser) {
                    $finalUser = $communityUser;
		    $finalUser['pubkeyhex'] = bin2hex(stream_get_contents($communityUser->public_key));
                   
                    $state_user_id = $communityUser->id;
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
