<?php
namespace App\Controller;

use App\Controller\AppController;
use Cake\Http\Client;
use Cake\Routing\Router;
use Cake\ORM\TableRegistry;
use Cake\Core\Configure;

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
        // check login
        // disable encryption for cookies
        //$this->Cookie->configKey('User', 'encryption', false);
        //$this->Cookie->read('GRADIDO_LOGIN');
        $session_id = intval($this->request->getCookie('GRADIDO_LOGIN', ''));
        $ip = $this->request->clientIp();
        if(!$session->check('client_ip')) {
          $session->write('client_ip', $ip);
        }
        
        // login server cannot detect host ip
        //echo "client ip: $ip<br>";
        //echo $session_id; echo "<br>";
        //echo $session->read('session_id');
        if($session_id != 0) {
          $userStored = $session->read('StateUser');
          $transactionPendings = $session->read('Transactions.pending');
          if($session->read('session_id') != $session_id || 
             ( $userStored && !isset($userStored['id'])) ||
              intval($transactionPendings) > 0) {
            $http = new Client();
            try {
              $loginServer = Configure::read('LoginServer');
              $url = $loginServer['host'] . ':' . $loginServer['port'];
              //$url = 'http://***REMOVED***';
              $requestStart = microtime(true);
              $response = $http->get($url . '/login', ['session_id' => $session_id]);
              $json = $response->getJson();
              $requestEnd = microtime(true);
              

              if(isset($json) && count($json) > 0) {

                if($json['state'] === 'success' && intval($json['user']['email_checked']) === 1) {
                  //echo "email checked: " . $json['user']['email_checked'] . "; <br>";
                  $session->destroy();
                  foreach($json['user'] as $key => $value) {
                    if($key === 'state') { continue; }
                    $session->write('StateUser.' . $key, $value );
                  }
                  
                  $transactionPendings = $json['Transaction.pending'];
                  //echo "read transaction pending: $transactionPendings<br>";
                  $session->write('Transactions.pending', $transactionPendings);
                  $session->write('session_id', $session_id);
                  $stateUserTable = TableRegistry::getTableLocator()->get('StateUsers');
                  if($json['user']['public_hex'] != '') {
                    $public_key_bin = hex2bin($json['user']['public_hex']);
                    $stateUserQuery = $stateUserTable
                            ->find('all')
                            ->where(['public_key' => $public_key_bin])
                            ->contain(['StateBalances']);
                    if($stateUserQuery->count() == 1) {
                      $stateUser = $stateUserQuery->first();
                      if($stateUser->first_name != $json['user']['first_name'] ||
                         $stateUser->last_name  != $json['user']['last_name']) {
                        $stateUser->first_name = $json['user']['first_name'];
                        $stateUser->last_name = $json['user']['last_name'];
                        if(!$stateUserTable->save($stateUser)) {
                          $this->Flash->error(__('error updating state user ' . json_encode($stateUser->errors())));
                        }
                      }
                      //var_dump($stateUser);
                      if(count($stateUser->state_balances) > 0) {
                        $session->write('StateUser.balance', $stateUser->state_balances[0]->amount);
                      }
                      $session->write('StateUser.id', $stateUser->id);
                      //echo $stateUser['id'];
                    } else {
                      $newStateUser = $stateUserTable->newEntity();
                      $newStateUser->public_key = $public_key_bin;
                      $newStateUser->first_name = $json['user']['first_name'];
                      $newStateUser->last_name = $json['user']['last_name'];
                      if(!$stateUserTable->save($newStateUser)) {
                        $this->Flash->error(__('error saving state user ' . json_encode($newStateUser->errors())));
                      }
                      $session->write('StateUser.id', $newStateUser->id);
                      //echo $newStateUser->id;
                    }
                  }
                
                
                
                // for debugging
                
                $this->set('user', $json['user']);
                //$this->set('json', $json);
                $this->set('timeUsed', microtime(true) - $startTime);
                $this->set('requestTime', $requestEnd - $requestStart);
                
                } else {
                  if($json['state'] === 'not found' ) {
                    $this->Flash->error(__('invalid session'));
                  //echo $json['user']['email_checked'];
                  //var_dump($json);
                  //
                  return $this->redirect(Router::url('/', true) . 'account/', 303);
                  }
                }
              }
          
            } catch(\Exception $e) {
              $msg = $e->getMessage();
              $this->Flash->error(__('error http request: ') . $msg);
              return $this->redirect(['controller' => 'Dashboard', 'action' => 'errorHttpRequest']);
              //continue;
            }
          } else {
            // login already in session
            $user = $session->read('StateUser');
            $this->set('user', $user);
            $this->set('timeUsed', microtime(true) - $startTime);
          }
          
        } else {
          // no login
          return $this->redirect(Router::url('/', true) . 'account/', 303);
        }
    }
    
    public function errorHttpRequest()
    {
      $startTime = microtime(true);
      $this->viewBuilder()->setLayout('frontend');
      $this->set('timeUsed', microtime(true) - $startTime);
    }

    
}
