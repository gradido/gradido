<?php
namespace App\Controller;

use App\Controller\AppController;
//use Cake\Routing\Router;
use Cake\ORM\TableRegistry;

/**
 * StateUsers Controller
 *
 * @property \App\Model\Table\StateUsersTable $StateUsers
 *
 * @method \App\Model\Entity\StateUser[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class DashboardController extends AppController
{

    public function initialize()
    {
        parent::initialize();
        //$this->Auth->allow(['add', 'edit']);
        $this->Auth->allow(['index', 'errorHttpRequest']);
    }
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $startTime = microtime(true);
        $this->viewBuilder()->setLayout('frontend_ripple');
        $session = $this->getRequest()->getSession();
        $result = $this->requestLogin();
        if($result !== true) {
          return $result;
        }
        $user = $session->read('StateUser');

        $serverUser = $this->Auth->user('id');
        if($serverUser) {
          $adminErrorsTable = TableRegistry::getTableLocator()->get('AdminErrors');
          $adminErrorCount = $adminErrorsTable->find('all')->count();
          $this->set('adminErrorCount', $adminErrorCount);
        }

        $this->set('user', $user);
        $this->set('serverUser', $serverUser);
        $this->set('timeUsed', microtime(true) - $startTime);

    }

    public function serverIndex()
    {
        $startTime = microtime(true);
        $this->viewBuilder()->setLayout('frontend');
        $adminErrorsTable = TableRegistry::getTableLocator()->get('AdminErrors');
        $adminErrorCount = $adminErrorsTable->find('all')->count();

        $this->set('adminErrorCount', $adminErrorCount);
        $this->set('timeUsed', microtime(true) - $startTime);
    }

    public function errorHttpRequest()
    {
      $startTime = microtime(true);
      $this->viewBuilder()->setLayout('frontend');
      $this->set('timeUsed', microtime(true) - $startTime);
    }

}
