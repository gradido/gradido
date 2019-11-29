<?php
namespace App\Controller;

use App\Controller\AppController;
//use Cake\Routing\Router;
//use Cake\ORM\TableRegistry;

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
        $this->viewBuilder()->setLayout('frontend');
        $session = $this->getRequest()->getSession();
        
        
        //return $this->redirect(Router::url('/', true) . 'account/', 303);
        $result = $this->requestLogin();
        if($result !== true) {
          return $result;
        }
        $user = $session->read('StateUser');
        
        $this->set('user', $user);
        $this->set('timeUsed', microtime(true) - $startTime);
         
    }
    
    public function errorHttpRequest()
    {
      $startTime = microtime(true);
      $this->viewBuilder()->setLayout('frontend');
      $this->set('timeUsed', microtime(true) - $startTime);
    }

    
}
