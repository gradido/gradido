<?php
namespace App\Controller;

use App\Controller\AppController;
use Cake\Datasource\ConnectionManager;
use Cake\I18n\Time;

/**
 * Users Controller
 *
 * @property \App\Model\Table\UsersTable $Users
 *
 * @method \App\Model\Entity\User[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class UsersController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $users = $this->paginate($this->Users);

        $this->set(compact('users'));
    }
    
    public function statistics()
    {
        $startTime = microtime(true);
        $this->viewBuilder()->setLayout('frontend_ripple');
        $users = $this->Users->find('all')->select(['id']);
        
        //$newUsersThisMonth
        $now = new Time();
        $sortDate = $this->getStartEndForMonth($now->month, $now->year);
        $newUsersThisMonth = $this->Users->find('all')
                                         ->select(['id'])
                                         ->where(['created >=' => $sortDate[0], 'created <' => $sortDate[1]]);
        $lastMonth = new Time();
        $lastMonth = $lastMonth->subMonth(1);
        $prevSortDate = $this->getStartEndForMonth($lastMonth->month, $lastMonth->year);
        $newUsersLastMonth = $this->Users->find('all')
                                         ->select(['id'])
                                         ->where(['created >=' => $prevSortDate[0], 'created <' => $prevSortDate[1]]);
        
        // new user sorted after date
        $connection = ConnectionManager::get('loginServer');
        $newAccountsPerDay = $connection->execute('SELECT count(id) as count, created FROM users GROUP BY CAST(created as DATE) ORDER BY created DESC ')->fetchAll('assoc');
        
        $newAccountsTree = [];
        foreach($newAccountsPerDay as $entry) {
          $created = new Time($entry['created']);
          if(!isset($newAccountsTree[$created->year])) {
            $newAccountsTree[$created->year] = [];
          }
          if(!isset($newAccountsTree[$created->year][$created->month])) {
            $newAccountsTree[$created->year][$created->month] = ['count' => 0, 'days' => []];
          }
          array_push($newAccountsTree[$created->year][$created->month]['days'], $entry);
          $newAccountsTree[$created->year][$created->month]['count'] += intval($entry['count']);
        }
        
        // last 5 new users
        $lastUsers = $this->Users->find('all')->order(['created DESC'])->limit(5);
        
        $timeUsed = microtime(true) - $startTime;
        
        $this->set(compact(
                'users', 'newUsersThisMonth', 'newUsersLastMonth',
                'timeUsed', 'newAccountsTree', 'lastUsers'));
    }

    /**
     * View method
     *
     * @param string|null $id User id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $user = $this->Users->get($id, [
            'contain' => ['EmailOptIn', 'UserBackups', 'UserRoles'],
        ]);

        $this->set('user', $user);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $user = $this->Users->newEntity();
        if ($this->request->is('post')) {
            $user = $this->Users->patchEntity($user, $this->request->getData());
            if ($this->Users->save($user)) {
                $this->Flash->success(__('The user has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The user could not be saved. Please, try again.'));
        }
        $this->set(compact('user'));
    }

    /**
     * Edit method
     *
     * @param string|null $id User id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $user = $this->Users->get($id, [
            'contain' => [],
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $user = $this->Users->patchEntity($user, $this->request->getData());
            if ($this->Users->save($user)) {
                $this->Flash->success(__('The user has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The user could not be saved. Please, try again.'));
        }
        $this->set(compact('user'));
    }

    /**
     * Delete method
     *
     * @param string|null $id User id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $user = $this->Users->get($id);
        if ($this->Users->delete($user)) {
            $this->Flash->success(__('The user has been deleted.'));
        } else {
            $this->Flash->error(__('The user could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
