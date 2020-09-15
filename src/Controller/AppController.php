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
use Cake\Http\Client;
use Cake\Routing\Router;
use Cake\ORM\TableRegistry;
use Cake\Core\Configure;
use Cake\I18n\Time;
use Cake\I18n\I18n;

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

    var $loginServerUrl = '';
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
        if ($state_user_id) {
            $stateBalancesTable = TableRegistry::getTableLocator()->get('stateBalances');
            $stateBalanceQuery = $stateBalancesTable
                  ->find('all')
                  ->select('amount')
                  ->contain(false)
                  ->where(['state_user_id' => $state_user_id]);
            if ($stateBalanceQuery->count() == 1) {
              //var_dump($stateBalanceEntry->first());
                $session->write('StateUser.balance', $stateBalanceQuery->first()->amount);
              //echo "stateUser.balance: " . $session->read('StateUser.balance');
            }
        }

        // load error count
        if ($state_user_id) {
            $stateErrorsTable = TableRegistry::getTableLocator()->get('stateErrors');
            $stateErrorQuery = $stateErrorsTable
                  ->find('all')
                  ->select('id')
                  ->contain(false)
                  ->where(['state_user_id' => $state_user_id]);
            $session->write('StateUser.errorCount', $stateErrorQuery->count());
        }
        //echo "initialize";


        // put current page into global for navi
        $GLOBALS["passed"] = null;
        $side = $this->request->getParam('controller');
        $GLOBALS["side"] = $side;
        $subside = $this->request->getParam('action');
        $passedArguments = $this->request->getParam('pass');
        if ($passedArguments) {
            $GLOBALS["passed"] = $passedArguments[0];
        }
        $GLOBALS["subside"] = $subside;

        // server login
        if ($this->Auth->user('id')) {
            $GLOBALS['ServerUser'] = $this->Auth->user();
        }
        // login server url
        $loginServer = Configure::read('LoginServer');
        if ($loginServer && isset($loginServer['url'])) {
            $this->loginServerUrl = $loginServer['url'] . '/';
        } else {
            $this->loginServerUrl = Router::url('/', true);
        }
    }

    protected function requestLogin()
    {
        $session = $this->getRequest()->getSession();
        // check login
        // disable encryption for cookies
        //$this->Cookie->configKey('User', 'encryption', false);
        $session_id = intval($this->request->getCookie('GRADIDO_LOGIN', ''));
        $ip = $this->request->clientIp();
        if (!$session->check('client_ip')) {
            $session->write('client_ip', $ip);
        }
        // login server cannot detect host ip
        // TODO: update login server, recognize nginx real ip header
        $loginServer = Configure::read('LoginServer');

        if ($session_id != 0) {
            $userStored = $session->read('StateUser');

            $transactionPendings = $session->read('Transactions.pending');
            $transactionExecutings = $session->read('Transaction.executing');
            if ($session->read('session_id') != $session_id ||
             ( $userStored && (!isset($userStored['id']) || !$userStored['email_checked'])) ||
              intval($transactionPendings) > 0 ||
              intval($transactionExecutings) > 0) {
                $http = new Client();

                try {
                    $url = $loginServer['host'] . ':' . $loginServer['port'];

                    $response = $http->get($url . '/login', ['session_id' => $session_id]);
                    $json = $response->getJson();

                    if (isset($json) && count($json) > 0) {
                        if ($json['state'] === 'success') {
                          //echo "email checked: " . $json['user']['email_checked'] . "; <br>";
                            if ($session->read('session_id') != $session_id ||
                            ( $userStored && !isset($userStored['id']))) {
                                $session->destroy();
                            }
                            foreach ($json['user'] as $key => $value) {
                                $session->write('StateUser.' . $key, $value);
                            }
                          //var_dump($json);
                            $transactionPendings = $json['Transaction.pending'];
                            $transactionExecuting = $json['Transaction.executing'];
                          //echo "read transaction pending: $transactionPendings<br>";
                            $session->write('Transactions.pending', $transactionPendings);
                            $session->write('Transaction.executing', $transactionExecuting);
                            $session->write('session_id', $session_id);
                            $stateUserTable = TableRegistry::getTableLocator()->get('StateUsers');

                            if (isset($json['user']['public_hex']) && $json['user']['public_hex'] != '') {
                                $public_key_bin = hex2bin($json['user']['public_hex']);
                                $stateUserQuery = $stateUserTable
                                ->find('all')
                                ->where(['public_key' => $public_key_bin])
                                ->contain(['StateBalances']);
                                if ($stateUserQuery->count() == 1) {
                                    $stateUser = $stateUserQuery->first();
                                    if ($stateUser->first_name != $json['user']['first_name'] ||
                                        $stateUser->last_name  != $json['user']['last_name'] ||
                                        $stateUser->disabled  != intval($json['user']['disabled']) ||
                                        //$stateUser->username  != $json['user']['username'] ||
                                        // -> throws error
                                        $stateUser->email      != $json['user']['email']
                                    ) {
                                        $stateUser->first_name = $json['user']['first_name'];
                                        $stateUser->last_name = $json['user']['last_name'];
                                        $stateUser->disabled = intval($json['user']['disabled']);
                                        //$stateUser->username = $json['user']['username'];
                                        $stateUser->email = $json['user']['email'];
                                        if (!$stateUserTable->save($stateUser)) {
                                            $this->Flash->error(__('error updating state user ' . json_encode($stateUser->errors())));
                                        }
                                    }
                                  //var_dump($stateUser);
                                    if (count($stateUser->state_balances) > 0) {
                                        $session->write('StateUser.balance', $stateUser->state_balances[0]->amount);
                                    }
                                    $session->write('StateUser.id', $stateUser->id);
                              //echo $stateUser['id'];
                                } else {
                                    $newStateUser = $stateUserTable->newEntity();
                                    $newStateUser->public_key = $public_key_bin;
                                    $newStateUser->first_name = $json['user']['first_name'];
                                    $newStateUser->last_name = $json['user']['last_name'];
                                    $newStateUser->disabled = intval($json['user']['disabled']);
                                    //$newStateUser->username = $json['user']['username'];
                                    $newStateUser->email = $json['user']['email'];
                                    if (!$stateUserTable->save($newStateUser)) {
                                        $this->Flash->error(__('error saving state user ' . json_encode($newStateUser->errors())));
                                    }
                                    $session->write('StateUser.id', $newStateUser->id);
                                  //echo $newStateUser->id;
                                }
                            } else {
                          // we haven't get a pubkey? something seems to gone wrong on the login-server
                                $this->Flash->error(__('no pubkey'));
                          //var_dump($json);
                                return $this->redirect($this->loginServerUrl . 'account/error500/noPubkey', 303);
                            }
                        } else {
                            if ($json['state'] === 'not found') {
                                $this->Flash->error(__('invalid session'));
                            } else {
                                $this->Flash->error(__('Konto ist nicht aktiviert!'));
                            }
                      //die(json_encode($json));
                            return $this->redirect($this->loginServerUrl . 'account/', 303);
                        }
                    }
                } catch (\Exception $e) {
                    $msg = $e->getMessage();
                    $this->Flash->error(__('error http request: ') . $msg);
                    return $this->redirect(['controller' => 'Dashboard', 'action' => 'errorHttpRequest']);
                  //continue;
                }
            }
        } else {
          // no login
          //die("no login");
            if (isset($loginServer['path'])) {
                return $this->redirect($loginServer['path'], 303);
            } else {
                return $this->redirect($this->loginServerUrl . 'account/', 303);
            }
        }
        return true;
    }

    /*
    public function beforeFilter(Event $event)
    {
      //$this->Auth->allow(['display']);
    }
     */

    public function addAdminError($controller, $action, array $returnTable, $state_user_id)
    {
        if (!is_array($returnTable)) {
            $this->addAdminError('AppController', 'addAdminError', ['state' => 'error', 'msg' => 'returnTable isn\'t array', 'details' => gettype($returnTable)], $state_user_id);
            return false;
        }
        $adminErrorTable = TableRegistry::getTableLocator()->get('AdminErrors');
        $adminErrorEntity = $adminErrorTable->newEntity();
        $adminErrorEntity->state_user_id = $state_user_id;
        $adminErrorEntity->controller = $controller;
        $adminErrorEntity->action = $action;
        $adminErrorEntity->state = $returnTable['state'];
        if (isset($returnTable['msg'])) {
            $adminErrorEntity->msg = $returnTable['msg'];
        } else {
            $adminErrorEntity->msg = __('(Leere Message)');
        }
        if (isset($returnTable['details'])) {
            $adminErrorEntity->details = $returnTable['details'];
        } else {
            $adminErrorEntity->details = __('(Leere Details)');
        }
        if (!$adminErrorTable->save($adminErrorEntity)) {
            $this->Flash->error(
                __('Serious error, couldn\'t save to db, please write the admin: ' . $this->getAdminEmailLink()),
                ['escape' => false]
            );
        }
        return true;
    }

    public function getAdminEmailLink($text = '')
    {
        $serverAdminEmail = Configure::read('ServerAdminEmail');
        return '<a href="mailto:' . $serverAdminEmail . '">'. $serverAdminEmail . '</a>';
    }

    public function returnJsonEncoded($json)
    {
        $this->autoRender = false;
        $response = $this->response->withType('application/json');
        return $response->withStringBody($json);
    }

    public function returnJson($array)
    {
        $this->autoRender = false;
        $response = $this->response->withType('application/json');
        return $response->withStringBody(json_encode($array));
    }

    public function getStartEndForMonth($month, $year)
    {
        $timeString = $year . '-' . $month . '-01 00:00';
        $firstDay = new Time($timeString);
        $lastDay  = new Time($timeString);
        $lastDay = $lastDay->addMonth(1);
        return [$firstDay, $lastDay];
    }
}
