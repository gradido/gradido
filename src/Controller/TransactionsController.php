<?php
namespace App\Controller;

use App\Controller\AppController;

use Model\Transactions\Transaction;
use Model\Transactions\TransactionBody;

use Cake\Core\Configure;

/**
 * Transactions Controller
 *
 * @property \App\Model\Table\TransactionsTable $Transactions
 *
 * @method \App\Model\Entity\Transaction[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class TransactionsController extends AppController
{
  
    public function initialize()
    {
        parent::initialize();
        $this->loadComponent('GradidoNumber');
        $this->loadComponent('JsonRpcRequestClient');
        $this->Auth->allow(['decode']);

    }
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['TransactionTypes']
        ];
        $transactions = $this->paginate($this->Transactions);

        $this->set(compact('transactions'));
    }

    /**
     * View method
     *
     * @param string|null $id Transaction id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $transaction = $this->Transactions->get($id, [
            'contain' => ['StateGroups', 'TransactionTypes', 'StateCreated', 'TransactionCreations', 'TransactionGroupAddaddress', 'TransactionGroupAllowtrades', 'TransactionGroupCreates', 'TransactionSendCoins', 'TransactionSignatures']
        ]);

        $this->set('transaction', $transaction);
    }
    
    public function decode()
    {
      $this->viewBuilder()->setLayout('frontend');
      if ($this->request->is('post')) {
          $base64 = $this->request->getData('base64');
          if(!$base64 || $base64 == '') {
            $this->Flash->error(__('No valid data given, please try again.'));
          } else {
            try {
              $transactionBin = sodium_base642bin($base64, SODIUM_BASE64_VARIANT_URLSAFE_NO_PADDING);
            } catch(Exception $ex) {
              var_dump($ex);
            }
            $transaction = new TransactionBody($transactionBin);
            if($transaction->hasErrors()) {
              $this->set('errors', $transaction->getErrors());
            } else {
              //$transaction->validate();
              if($transaction->hasErrors()) {
                $this->set('errors', $transaction->getErrors());
              }
              //var_dump($transaction);
              echo "<br>bin: <br>";
              var_dump($transactionBin);
              echo "<br>";
              $this->set('transaction', $transaction);
            }
              
          }
      }
      
    }
    
    public function sendToNode() {
      $this->viewBuilder()->setLayout('frontend');
      $startTime = microtime(true);
      
      //$loginServer = Configure::read('LoginServer');    
      
      $jsonRpcResult = $this->JsonRpcRequestClient->request('getlasttransaction', []);
      $result = $jsonRpcResult['result'];
      //var_dump($result);
      if($result['state'] != 'success') {
        $this->Flash->error(__('error retriving last saved transaction from gradido node.'));
        $timeUsed = microtime(true) - $startTime;
        $this->set('timeUsed', $timeUsed);
        return;
      }
      
      $firstId = 1;
      if($result['transaction'] != '') {
        $lastKnowTransaction = new Transaction($result['transaction']);
        $firstId = $lastKnowTransaction->getId()+1;
      }
      
      $transactionIDEntities = $this->Transactions
              ->find('all')
              ->select(['id'])
              ->where(['id >=' => $firstId])
              ;
      $transactionIDs = [];
      foreach($transactionIDEntities as $entity) {
        array_push($transactionIDs, $entity->id);
      }
      
      $csfr_token = $this->request->getParam('_csrfToken');
      $this->set('csfr_token', $csfr_token);
      $this->set('transactionIds', $transactionIDs);
      
      $timeUsed = microtime(true) - $startTime;
      $this->set('timeUsed', $timeUsed);
      
      if ($this->request->is('post')) {
        $host = $this->request->getData('host');
        $port = $this->request->getData('port');
        //$gradidod = new JsonRpcClient($host . ':' . $port);
        
        
        //var_dump($transactionIDs);
                
        //$result = $this->JsonRpcRequestClient->request('puttransaction', ['group' => 'Hallo', 'transaction' => 'Hallo2' ]);
        
        //$result = $gradidod->putTransaction(['group' => 'Hallo', 'transaction' => 'Hallo2' ]);
        //var_dump($result);
        
        $timeUsed = microtime(true) - $startTime;
        $this->set('timeUsed', $timeUsed);
      }
    }
    
    public function ajaxPutTransactionToGradidoNode()
    {
      $startTime = microtime(true);
      if($this->request->is('post')) {
          //$jsonData = $this->request->input('json_decode', true);
          $data = $this->request->getData();
          //$user = $jsonData['user'];
          //var_dump($data);
          $transactionId = $data['transaction_id'];
          if($transactionId == null || $transactionId < 1) {
            $timeUsed = microtime(true) - $startTime;
            return $this->returnJson(['state' => 'error', 'msg' => 'invalid transaction id', 'timeUsed' => $timeUsed]);
          }
          try {
            $transaction = Transaction::fromTable($transactionId);
          } catch(Exception $e) {
            echo "exception: ";
            var_dump($e);
          }
          if(is_array($transaction)) {
            $timeUsed = microtime(true) - $startTime;
            $transaction['timeUsed'] = $timeUsed;
            return $this->returnJson($transaction);
          } else {
            $transactionBase64 = base64_encode($transaction->serializeToString());
            //echo "base64: <br>$transactionBase64<br>";

            $result = $this->JsonRpcRequestClient->request('puttransaction', [
                'group' => 'd502c4254defe1842d71c484dc35f56983ce938e3c22058795c7520b62ab9123', 
                'transaction' => $transactionBase64 
            ]);

            $timeUsed = microtime(true) - $startTime;
            $result['timeUsed'] = $timeUsed;
            return $this->returnJson($result);
          }
          //return $this->returnJson(['state' => 'success', 'timeUsed' => $timeUsed]);
      }
      $timeUsed = microtime(true) - $startTime;
      return $this->returnJson(['state' => 'error', 'msg' => 'no post request', 'timeUsed' => $timeUsed]);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $transaction = $this->Transactions->newEntity();
        if ($this->request->is('post')) {
            $transaction = $this->Transactions->patchEntity($transaction, $this->request->getData());
            if ($this->Transactions->save($transaction)) {
                $this->Flash->success(__('The transaction has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction could not be saved. Please, try again.'));
        }
        $stateGroups = $this->Transactions->StateGroups->find('list', ['limit' => 200]);
        $transactionTypes = $this->Transactions->TransactionTypes->find('list', ['limit' => 200]);
        $this->set(compact('transaction', 'stateGroups', 'transactionTypes'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Transaction id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $transaction = $this->Transactions->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $transaction = $this->Transactions->patchEntity($transaction, $this->request->getData());
            if ($this->Transactions->save($transaction)) {
                $this->Flash->success(__('The transaction has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction could not be saved. Please, try again.'));
        }
        $stateGroups = $this->Transactions->StateGroups->find('list', ['limit' => 200]);
        $transactionTypes = $this->Transactions->TransactionTypes->find('list', ['limit' => 200]);
        $this->set(compact('transaction', 'stateGroups', 'transactionTypes'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Transaction id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $transaction = $this->Transactions->get($id);
        if ($this->Transactions->delete($transaction)) {
            $this->Flash->success(__('The transaction has been deleted.'));
        } else {
            $this->Flash->error(__('The transaction could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
