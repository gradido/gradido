<?php
namespace App\Controller;

use App\Controller\AppController;
use Cake\ORM\TableRegistry;
use Cake\Routing\Router;
use Cake\I18n\Number;
use Cake\Http\Client;
use Cake\Core\Configure;

use App\Form\CreationForm;
// protobuf transactions
use Model\Messages\Gradido\TransactionCreation;
use Model\Messages\Gradido\TransactionBody;
use Model\Messages\Gradido\ReceiverAmount;
/**
 * TransactionCreations Controller
 *
 * @property \App\Model\Table\TransactionCreationsTable $TransactionCreations
 *
 * @method \App\Model\Entity\TransactionCreation[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class TransactionCreationsController extends AppController
{
  
    public function initialize()
    {
        parent::initialize();
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
            'contain' => ['Transactions', 'StateUsers']
        ];
        $transactionCreations = $this->paginate($this->TransactionCreations);

        $this->set(compact('transactionCreations'));
    }

    /**
     * View method
     *
     * @param string|null $id Transaction Creation id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $transactionCreation = $this->TransactionCreations->get($id, [
            'contain' => ['Transactions', 'StateUsers']
        ]);

        $this->set('transactionCreation', $transactionCreation);
    }
    
    public function create()
    {
        $startTime = microtime(true);
        $this->viewBuilder()->setLayout('frontend');
        $session = $this->getRequest()->getSession();
        $user = $session->read('StateUser');
//        var_dump($user);
        if(!$user) {
          return $this->redirect(Router::url('/', true) . 'account/', 303);
        }
        $creationForm = new CreationForm();
        $transactionCreation = $this->TransactionCreations->newEntity();
        $transactionCreation->state_user_id  = $user['id'];
        
        // adding possible addresses + input field for copy 
        $stateUserTable = TableRegistry::getTableLocator()->get('StateUsers');
        $stateUsers = $stateUserTable->find('all');
        $receiverProposal = [];
        foreach($stateUsers as $stateUser) {
          $name = $stateUser->email;
          $keyHex = bin2hex(stream_get_contents($stateUser->public_key));
          if($name === NULL) {
            $name = $stateUser->first_name . ' ' . $stateUser->last_name;
          }
          array_push($receiverProposal, ['name' => $name, 'key' => $keyHex]);
          //$stateUser->public_key
        }
        $timeUsed = microtime(true) - $startTime;
        $this->set(compact('transactionCreation', 'timeUsed', 'receiverProposal', 'creationForm'));
        
        if ($this->request->is('post')) {
          $requestData = $this->request->getData();
          $mode = 'next';
          if(isset($requestData['add'])) {$mode = 'add'; }
          if($creationForm->validate($requestData)) {
          
            $pubKeyHex = '';
            $receiver = new ReceiverAmount();
            //echo 'amount: ' . $requestData['amount'] . '<br>';
            $floatAmount = floatval(Number::format($requestData['amount'], ['places' => 4, 'locale' => 'en_GB']));
            //echo 'set for receiver: ' . round($floatAmount * 10000) . '<br>';
            $receiver->setAmount(round($floatAmount * 10000));
            //echo 'after receiver amount set<br>';
            
            if(intval($requestData['receiver']) == 0) {
              if(strlen($requestData['receiver_pubkey_hex']) != 64) {
                $this->Flash->error(__('Invalid public Key, must contain 64 Character'));
              } else {
                $pubKeyHex = $requestData['receiver_pubkey_hex'];
              }
            } else {
              $receiverIndex = intval($requestData['receiver'])-1;
              
              if(count($receiverProposal) > $receiverIndex) {
                $pubKeyHex = $receiverProposal[$receiverIndex]['key'];
              }
            }
            if($pubKeyHex != '') {
              $receiver->setEd25519ReceiverPubkey(hex2bin($pubKeyHex));
              //var_dump($requestData);
              $transactionBody = new TransactionBody();
              $transactionBody->setMemo($requestData['memo']);

              $transaction = new TransactionCreation();
              $transaction->setReceiverAmount($receiver);
              $transaction->setIdentHash($user['ident_hash']);
              $transactionBody->setCreation($transaction);
              
              $http = new Client();
              try {
                $loginServer = Configure::read('LoginServer');
                $url = $loginServer['host'] . ':' . $loginServer['port'];
                $session_id = $session->read('session_id');
                $response = $http->get($url . '/checkTransaction', [
                    'session_id' => $session_id,
                    'transaction_base64' => base64_encode($transactionBody->serializeToString())
                ]);
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
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        
        $transactionCreation = $this->TransactionCreations->newEntity();
        if ($this->request->is('post')) {
            $transactionCreation = $this->TransactionCreations->patchEntity($transactionCreation, $this->request->getData());
            if ($this->TransactionCreations->save($transactionCreation)) {
                $this->Flash->success(__('The transaction creation has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction creation could not be saved. Please, try again.'));
        }
        $transactions = $this->TransactionCreations->Transactions->find('list', ['limit' => 200]);
        $stateUsers = $this->TransactionCreations->StateUsers->find('list', ['limit' => 200]);
        $this->set(compact('transactionCreation', 'transactions', 'stateUsers'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Transaction Creation id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $transactionCreation = $this->TransactionCreations->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $transactionCreation = $this->TransactionCreations->patchEntity($transactionCreation, $this->request->getData());
            if ($this->TransactionCreations->save($transactionCreation)) {
                $this->Flash->success(__('The transaction creation has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction creation could not be saved. Please, try again.'));
        }
        $transactions = $this->TransactionCreations->Transactions->find('list', ['limit' => 200]);
        $stateUsers = $this->TransactionCreations->StateUsers->find('list', ['limit' => 200]);
        $this->set(compact('transactionCreation', 'transactions', 'stateUsers'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Transaction Creation id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $transactionCreation = $this->TransactionCreations->get($id);
        if ($this->TransactionCreations->delete($transactionCreation)) {
            $this->Flash->success(__('The transaction creation has been deleted.'));
        } else {
            $this->Flash->error(__('The transaction creation could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
