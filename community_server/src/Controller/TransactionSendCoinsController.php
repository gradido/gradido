<?php
namespace App\Controller;

use App\Controller\AppController;
use Cake\ORM\TableRegistry;
use Cake\Http\Client;
use Cake\Core\Configure;
use Cake\Routing\Router;

use Cake\I18n\I18n;

use App\Form\TransferForm;
use App\Form\TransferRawForm;

use Model\Navigation\NaviHierarchy;
use Model\Navigation\NaviHierarchyEntry;

use Model\Transactions\TransactionTransfer;
use Model\Transactions\TransactionBody;
use Model\Transactions\Transaction;

/**
 * TransactionSendCoins Controller
 *
 * @property \App\Model\Table\TransactionSendCoinsTable $TransactionSendCoins
 *
 * @method \App\Model\Entity\TransactionSendCoin[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class TransactionSendCoinsController extends AppController
{

    public function initialize()
    {
        parent::initialize();
        $this->loadComponent('GradidoNumber');
        $this->loadComponent('JsonRequestClient');
        //$this->Auth->allow(['add', 'edit']);
        $this->Auth->allow('create');
        $this->Auth->allow('createRaw');
        $this->Auth->allow('ajaxCreate');
        $this->set(
            'naviHierarchy',
            (new NaviHierarchy())->
            add(new NaviHierarchyEntry(__('Startseite'), 'Dashboard', 'index', false))->
            add(new NaviHierarchyEntry(__('Überweisung'), 'TransactionSendCoins', 'create', true))
        );
    }

    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['Transactions', 'StateUsers', 'ReceiverUsers']
        ];
        $transactionSendCoins = $this->paginate($this->TransactionSendCoins);
        $simple = $this->TransactionSendCoins->find('all');

        $this->set(compact('transactionSendCoins', 'simple'));
    }

    /**
     * View method
     *
     * @param string|null $id Transaction Send Coin id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $transactionSendCoin = $this->TransactionSendCoins->get($id, [
            'contain' => ['Transactions', 'StateUsers', 'ReceiverUsers']
        ]);

        $this->set('transactionSendCoin', $transactionSendCoin);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $transactionSendCoin = $this->TransactionSendCoins->newEntity();
        if ($this->request->is('post')) {
            $transactionSendCoin = $this->TransactionSendCoins->patchEntity($transactionSendCoin, $this->request->getData());
            if ($this->TransactionSendCoins->save($transactionSendCoin)) {
                $this->Flash->success(__('The transaction send coin has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction send coin could not be saved. Please, try again.'));
        }
        $transactions = $this->TransactionSendCoins->Transactions->find('list', ['limit' => 200]);
        $stateUsers = $this->TransactionSendCoins->StateUsers->find('list', ['limit' => 200]);
        $receiverUsers = $this->TransactionSendCoins->ReceiverUsers->find('list', ['limit' => 200]);
        $this->set(compact('transactionSendCoin', 'transactions', 'stateUsers', 'receiverUsers'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Transaction Send Coin id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $transactionSendCoin = $this->TransactionSendCoins->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $transactionSendCoin = $this->TransactionSendCoins->patchEntity($transactionSendCoin, $this->request->getData());
            if ($this->TransactionSendCoins->save($transactionSendCoin)) {
                $this->Flash->success(__('The transaction send coin has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction send coin could not be saved. Please, try again.'));
        }
        $transactions = $this->TransactionSendCoins->Transactions->find('list', ['limit' => 200]);
        $stateUsers = $this->TransactionSendCoins->StateUsers->find('list', ['limit' => 200]);
        $receiverUsers = $this->TransactionSendCoins->ReceiverUsers->find('list', ['limit' => 200]);
        $this->set(compact('transactionSendCoin', 'transactions', 'stateUsers', 'receiverUsers'));
    }

    public function create()
    {
        /*$locale = I18n::getLocale();
        $defaultLocale = I18n::getDefaultLocale();
        echo "locale: $locale, default locale: $defaultLocale<br>";
         * */
        $startTime = microtime(true);
        $this->viewBuilder()->setLayout('frontend');
        $session = $this->getRequest()->getSession();
        $user = $session->read('StateUser');
//        var_dump($user);
        if(!$user) {
          //return $this->redirect(Router::url('/', true) . 'account/', 303);
          $result = $this->requestLogin();
          if($result !== true) {
            return $result;
          }
          $user = $session->read('StateUser');
        }
        
        $known_groups = $this->JsonRequestClient->sendRequest(json_encode([
                'ask' => ['groups']
            ]), '/networkInfos');
        

        $transferForm = new TransferForm();
        $this->set('transferForm', $transferForm);
        $this->set('timeUsed', microtime(true) - $startTime);
        $this->set('groups', $known_groups['data']['data']['groups']);
        $this->set('user', $user);

        if ($this->request->is('post')) {
          //$this->Flash->error(__('Wird zurzeit noch entwickelt!'));

          $requestData = $this->request->getData();
          $mode = 'next';
          if(isset($requestData['add'])) {$mode = 'add'; }
          if($transferForm->validate($requestData)) {

            $amountCent = $this->GradidoNumber->parseInputNumberToCentNumber($requestData['amount']);

            if(!isset($user['balance']) || $amountCent > $user['balance']) {
              $this->Flash->error(__('Du hast nicht genug Gradidos!'));
              return;
            }
            
            $receiverEmail = $requestData['email'];
            if($receiverEmail === $user['email']) {
              $this->Flash->error(__('Du kannst dir selbst keine Gradidos senden!'));
              return;
            }
            $requestAnswear = $this->JsonRequestClient->sendRequest(json_encode([
                'session_id' => $session->read('session_id'),
                'transaction_type' => 'transfer',
                'memo' => $requestData['memo'],
                'amount' => $amountCent,
                'group' => $known_groups['data']['data']['groups'][$requestData['group']],
                'target_email'  => $receiverEmail,
                'blockchain_type' => $this->blockchainType
            ]), '/createTransaction');
            
            if('success' == $requestAnswear['state'] && 'success' == $requestAnswear['data']['state']) {
                $pendingTransactionCount = $session->read('Transactions.pending');
                if($pendingTransactionCount == null) {
                  $pendingTransactionCount = 1;
                } else {
                  $pendingTransactionCount++;
                }
                $session->write('Transactions.pending', $pendingTransactionCount);
                //echo "pending: " . $pendingTransactionCount;
                if($mode === 'next') {
                  return $this->redirect($this->loginServerUrl . 'account/checkTransactions', 303);
                } else {
                  $this->Flash->success(__('Transaction submitted for review.'));
                }
            } else {
              
              /*
               * if request contain unknown parameter format, shouldn't happen't at all
               * {"state": "error", "msg": "parameter format unknown"}
               * if json parsing failed
               * {"state": "error", "msg": "json exception", "details":"exception text"}
               * if session_id is zero or not set
               * {"state": "error", "msg": "session_id invalid"}
               * if session id wasn't found on login server, if server was restartet or user logged out (also per timeout, default: 15 minutes)
               * {"state": "error", "msg": "session not found"}
               * if session hasn't active user, shouldn't happen't at all, login-server should be checked if happen
               * {"state": "code error", "msg":"user is zero"}
               * if transaction type not known
               * {"state": "error", "msg":"transaction_type unknown"}
               * if receiver wasn't known to Login-Server
               * {"state": "not found", "msg":"receiver not found"}
               * if receiver account disabled, and therefor cannto receive any coins
               * {"state": "disabled", "msg":"receiver is disabled"}
               * if transaction was okay and will be further proccessed
               * {"state":"success"}
               */
               $answear_data = $requestAnswear['data'];
               if($answear_data['state'] === 'error') {
                 if($answear_data['msg'] === 'session_id invalid' || $answear_data['msg'] === 'session not found') {
                   $this->Flash->error(__('Fehler mit der Session, bitte logge dich erneut ein!'));
                   $this->set('timeUsed', microtime(true) - $startTime);
                   return;
                 }
                 if($answear_data['msg'] === 'user not in group') {
                   $this->Flash->error(__('Empfänger befindet sich nicht in Zielgruppe!'));
                   $this->set('timeUsed', microtime(true) - $startTime);
                   return;
                 }
                 if($answear_data['msg'] === 'memo is not set or not in expected range [5;150]') {
                    $this->Flash->error(__('Ein Verwendungszweck zwischen 5 und 150 Zeichen wird benötig!'));
                    $this->set('timeUsed', microtime(true) - $startTime);
                    return;
                 }
               } else if($answear_data['state'] === 'not found' && $answear_data['msg'] === 'receiver not found') {
                  $this->Flash->error(__('Der Empfänger wurde nicht auf dem Login-Server gefunden, hat er sein Konto schon angelegt?'));
                  $this->set('timeUsed', microtime(true) - $startTime);
                  return;
               } else if($answear_data['state'] === 'disabled') {
                  $this->Flash->error(__('Der Empfänger ist deaktiviert, daher können ihm zurzeit keine Gradidos gesendet werden.'));
                  $this->set('timeUsed', microtime(true) - $startTime);
                  return;
               } else {
                  $this->Flash->error(__('Unbehandelter Fehler: ') . json_encode($answear_data));
                  $this->set('timeUsed', microtime(true) - $startTime);
                  return;
               }
               
            }
          }
        }
        
        $this->set('timeUsed', microtime(true) - $startTime);
    }
    
    public function ajaxCreate() 
    {
        if ($this->request->is('post')) {
            $startTime = microtime(true);
            $jsonData = $this->request->input('json_decode', true);
            $session_id = $jsonData['session_id'];
            if(!$session_id) {
                return $this->returnJson(['state' => 'error', 'msg' => 'invalid session id']);
            }
            
            $login_result = $this->requestLogin($session_id, false);
            if($login_result !== true) {
                return $this->returnJson($login_result);
            }
            $session = $this->getRequest()->getSession();
            $user = $session->read('StateUser');            
            
            $receiverPubKeyHex = '';
            $senderPubKeyHex = $user['public_hex'];

            if(!isset($jsonData['amount']) || !isset($jsonData['email'])) {
                return $this->returnJson(['state' => 'parameter missing', 'msg' => 'amount and/or email not set']);
            }
            $amount = intval($jsonData['amount']);
            if($amount < 0) {
                return $this->returnJson(['state' => 'error', 'msg' => 'amout must be > 0 and int']);
            }
            
            if(!isset($user['balance']) || $jsonData['amount'] > $user['balance']) {
              return $this->returnJson(['state' => 'error', 'msg' => 'not enough GDD']);
            }
            $memo = '';
            if(isset($jsonData['memo'])) {
                $memo = $jsonData['memo'];
            }

            $receiverEmail = $jsonData['email'];
            if($receiverEmail === $user['email']) {
              return $this->returnJson(['state' => 'error', 'msg' => 'sender and receiver email are the same']);
            }

            $requestAnswear = $this->JsonRequestClient->sendRequest(json_encode([
                'session_id' => $session_id,
                'email' => $receiverEmail,
                'ask' => ['user.pubkeyhex', 'user.disabled']
            ]), '/getUserInfos');
            if('success' == $requestAnswear['state'] && 'success' == $requestAnswear['data']['state']) {
              // will be allways 64 byte long, even if it is empty
              $receiverPubKeyHex = $requestAnswear['data']['userData']['pubkeyhex'];
            } else {
              return $this->returnJson([
                  'state' => 'error', 
                  'msg' => 'receiver email not found on login-server', 
                  'details' => $requestAnswear,
                  'timeUsed' => microtime(true) - $startTime
              ]);
            }
            if($requestAnswear['data']['userData']['disabled']) {
                return $this->returnJson([
                    'state' => 'error',
                    'msg' => 'receiver is currently disabled, he cannot receive payments',
                    'timeUsed' => microtime(true) - $startTime
                ]);
            }

            
            //var_dump($sessionStateUser);

            $builderResult = TransactionTransfer::build(
                    $amount,
                    $memo,
                    $receiverPubKeyHex,
                    $senderPubKeyHex
            );
            $auto_sign = true;
            if(isset($jsonData['auto_sign'])) {
                $auto_sign = $jsonData['auto_sign'];
            }
            if($builderResult['state'] === 'success') {

              $http = new Client();
              try {
                $loginServer = Configure::read('LoginServer');
                $url = $loginServer['host'] . ':' . $loginServer['port'];
               
                $response = $http->post($url . '/checkTransaction', json_encode([
                    'session_id' => $session_id,
                    'transaction_base64' => base64_encode($builderResult['transactionBody']->serializeToString()),
                    'auto_sign' => $auto_sign,
                    'balance' => $user['balance']
                ]), ['type' => 'json']);
                $json = $response->getJson();
                if($json['state'] != 'success') {
                  if($json['msg'] == 'session not found') {
                    $session->destroy();
                    return $this->returnJson([
                        'state' => 'error',
                        'msg' => 'session not found',
                        'details' => $session_id,
                        'timeUsed' => microtime(true) - $startTime
                    ]);
                    //$this->Flash->error(__('session not found, please login again'));
                  } else {
                      return $this->returnJson([
                          'state' => 'error',
                          'msg' => 'login server return error',
                          'details' => $json,
                          'timeUsed' => microtime(true) - $startTime
                      ]);
                  }
                } else {
                    return $this->returnJson(['state' => 'success', 'timeUsed' => microtime(true) - $startTime]);
                }

              } catch(\Exception $e) {
                  $msg = $e->getMessage();
                  //$this->Flash->error(__('error http request: ') . $msg);
                  return $this->returnJson([
                      'state' => 'error',
                      'msg' => 'error http request',
                      'details' => $msg,
                      'timeUsed' => microtime(true) - $startTime
                  ]);
              }

            } else {
                return $this->returnJson([
                    'state' => 'error',
                    'msg' => 'no valid receiver public key given',
                    'details' => $receiverPubKeyHex,
                    'timeUsed' => microtime(true) - $startTime
                ]);
            }
        }
        return $this->returnJson(['state' => 'error', 'msg' => 'no post request']);
    }

    public function createRaw()
    {
        $startTime = microtime(true);
        $this->viewBuilder()->setLayout('frontend');

        $transferRawForm = new TransferRawForm();
        $this->set('transferRawForm', $transferRawForm);

        if ($this->request->is('post')) {
          $requestData = $this->request->getData();
          if($transferRawForm->validate($requestData)) {
            $amountCent = $this->GradidoNumber->parseInputNumberToCentNumber($requestData['amount']);
            $sender = ['priv' => $requestData['sender_privkey_hex'], 'pub' => $requestData['sender_pubkey_hex']];
            $reciver = ['pub' => $requestData['receiver_pubkey_hex']];

            $builderResult = TransactionTransfer::build(
                    $amountCent,
                    $requestData['memo'],
                    $reciver['pub'],
                    $sender['pub']
            );
            if($builderResult['state'] === 'success') {
              $protoTransaction = Transaction::build($builderResult['transactionBody'], $sender);
              $transaction = new Transaction($protoTransaction);
              if(!$transaction->validate()) {
                $this->Flash->error(__('Error validating transaction'));
              } else {
                if(!$transaction->save()) {
                  $this->Flash->error(__('Error saving transaction'));
                } else {
                  $this->Flash->success(__('Gradidos erfolgreich überwiesen!'));
                }
              }
            } else {
              $this->Flash->error(__('Error building transaction'));
            }

          }
          //var_dump($requestData);
          //
          //var_dump($data);

        }

        $this->set('timeUsed', microtime(true) - $startTime);
    }

    /**
     * Delete method
     *
     * @param string|null $id Transaction Send Coin id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $transactionSendCoin = $this->TransactionSendCoins->get($id);
        if ($this->TransactionSendCoins->delete($transactionSendCoin)) {
            $this->Flash->success(__('The transaction send coin has been deleted.'));
        } else {
            $this->Flash->error(__('The transaction send coin could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
