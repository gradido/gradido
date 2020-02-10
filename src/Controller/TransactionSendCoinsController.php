<?php
namespace App\Controller;

use App\Controller\AppController;
use Cake\ORM\TableRegistry;
use Cake\Http\Client;
use Cake\Core\Configure;
use Cake\Routing\Router;

use Cake\I18n\I18n;

use App\Form\TransferForm;

use Model\Transactions\TransactionTransfer;
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
        //$this->Auth->allow(['add', 'edit']);
        $this->Auth->allow('create');
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

        $this->set(compact('transactionSendCoins'));
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
        $this->viewBuilder()->setLayout('frontend_ripple');
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
        
        $transferForm = new TransferForm();
        $this->set('transferForm', $transferForm);
        $this->set('timeUsed', microtime(true) - $startTime);
        
        if ($this->request->is('post')) {
          //$this->Flash->error(__('Wird zurzeit noch entwickelt!'));          
          
          $requestData = $this->request->getData();
          $mode = 'next';
          if(isset($requestData['add'])) {$mode = 'add'; }
          if($transferForm->validate($requestData)) {
            
            $receiverPubKeyHex = '';
            $senderPubKeyHex = $user['public_hex'];
            $amountCent = $this->GradidoNumber->parseInputNumberToCentNumber($requestData['amount']);
            
            if(!isset($user['balance']) || $amountCent > $user['balance']) {
              $this->Flash->error(__('Du hast nicht genug Geld!'));
              return;
            }
            
            $receiverEmail = $requestData['email'];
            if($receiverEmail === $user['email']) {
              $this->Flash->error(__('Du kannst dir leider nicht selbst Geld schicken!'));
              return;
            }
            
            $stateUserTable = TableRegistry::getTableLocator()->get('StateUsers');
            $receiverUser = $stateUserTable
                     ->find('all')
                     ->select(['public_key'])
                     ->contain(false)
                     ->where(['email' => $receiverEmail])->first();
            //var_dump($receiverUser);
            if(!$receiverUser) {
              $this->Flash->error(__('Diese E-Mail ist mir nicht bekannt, hat dein Empfänger denn schon ein Gradido-Konto?'));
              return;
            }
             $receiverPubKeyHex = bin2hex(stream_get_contents($receiverUser->public_key));
            //var_dump($sessionStateUser);
            
            $builderResult = TransactionTransfer::build(
                    $amountCent, 
                    $requestData['memo'], 
                    $receiverPubKeyHex,
                    $senderPubKeyHex
            );
            if($builderResult['state'] === 'success') {
              
              $http = new Client();
              try {
                $loginServer = Configure::read('LoginServer');
                $url = $loginServer['host'] . ':' . $loginServer['port'];
                $session_id = $session->read('session_id');
                /*
                 * 
                 *  $response = $http->post(
                 *    'http://example.com/tasks',
                 *    json_encode($data),
                 *    ['type' => 'json']
                 *  ); 
                 */
                $response = $http->post($url . '/checkTransaction', json_encode([
                    'session_id' => $session_id,
                    'transaction_base64' => base64_encode($builderResult['transactionBody']->serializeToString()),
                    'balance' => $user['balance']
                ]), ['type' => 'json']);
                $json = $response->getJson();
                if($json['state'] != 'success') {
                  if($json['msg'] == 'session not found') {
                    $session->destroy();
                    return $this->redirect(Router::url('/', true) . 'account', 303);
                    //$this->Flash->error(__('session not found, please login again'));
                  } else {
                    $this->Flash->error(__('login server return error: ' . json_encode($json)));
                  }
                } else {
                  $pendingTransactionCount = $session->read('Transactions.pending');
                  if($pendingTransactionCount == null) {
                    $pendingTransactionCount = 1;
                  } else {
                    $pendingTransactionCount++;
                  }
                  $session->write('Transactions.pending', $pendingTransactionCount);
                  //echo "pending: " . $pendingTransactionCount;
                  if($mode === 'next') {
                    return $this->redirect(Router::url('/', true) . 'account/checkTransactions', 303);
                  } else {
                    $this->Flash->success(__('Transaction submitted for review.'));
                  }
                }
                
              } catch(\Exception $e) {
                  $msg = $e->getMessage();
                  $this->Flash->error(__('error http request: ') . $msg);
              }
              
            } else {
              $this->Flash->error(__('No Valid Receiver Public given'));
            }
           
//           */
          } else {
            $this->Flash->error(__('Something was invalid, please try again!'));
          }
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
