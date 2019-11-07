<?php
/**
 * CakePHP(tm) : Rapid Development Framework (https://cakephp.org)
 * Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 * @link      https://cakephp.org CakePHP(tm) Project
 * @since     0.2.9
 * @license   https://opensource.org/licenses/mit-license.php MIT License
 */
namespace App\Controller;

use Cake\Controller\Controller;
//use Cake\Event\Event;
use Cake\ORM\TableRegistry;

/**
 * Application Controller
 *
 * Add your application-wide methods in the class below, your controllers
 * will inherit them.
 *
 * @link https://book.cakephp.org/3.0/en/controllers.html#the-app-controller
 */
class AppController extends Controller
{

    /**
     * Initialization hook method.
     *
     * Use this method to add common initialization code like loading components.
     *
     * e.g. `$this->loadComponent('Security');`
     *
     * @return void
     */
    public function initialize()
    {
        parent::initialize();

        $this->loadComponent('RequestHandler', [
            'enableBeforeRedirect' => false,
        ]);
        $this->loadComponent('Flash');

         $this->loadComponent('Auth', [
            'loginAction' => [
              'controller' => 'ServerUsers',
              'action' => 'login'
            ],
            'loginRedirect' => [
                'controller' => 'Transactions',
                'action' => 'index'
            ],
            'logoutRedirect' => [
                'controller' => 'Pages',
                'action' => 'display',
                'gradido'
            ],
            'authenticate' => [
              'all' => ['userModel' => 'ServerUsers'],
              'Form' => [
                  'userModel' => 'ServerUsers',
              ]
            ]
        ]);
        
        $this->Auth->deny(['index']);
         
        /*
         * Enable the following component for recommended CakePHP security settings.
         * see https://book.cakephp.org/3.0/en/controllers/components/security.html
         */
        //$this->loadComponent('Security');
        
        
        // load current balance
        $session = $this->getRequest()->getSession();
        $state_user_id = $session->read('StateUser.id');
        if($state_user_id) {
          $stateBalancesTable = TableRegistry::getTableLocator()->get('stateBalances');
          $stateBalanceEntry = $stateBalancesTable
                  ->find('all')
                  ->select('amount')
                  ->contain(false)
                  ->where(['state_user_id' => $state_user_id]);
          if($stateBalanceEntry->count() == 1) {
            //var_dump($stateBalanceEntry->first());
            $session->write('StateUser.balance', $stateBalanceEntry->first()->amount);
            //echo "stateUser.balance: " . $session->read('StateUser.balance');
          }
        }
        //echo "initialize";
    }
    /*
    public function beforeFilter(Event $event)
    {
      //$this->Auth->allow(['display']);
    }
     */
    
    public function returnJson($array) {
      $this->autoRender = false;
      $response = $this->response->withType('application/json');
      return $response->withStringBody(json_encode($array));
    }
}
