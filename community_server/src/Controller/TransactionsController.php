<?php
namespace App\Controller;

use App\Controller\AppController;

use Model\Transactions\Transaction;
use Model\Transactions\TransactionBody;

use Cake\Core\Configure;
use Cake\I18n\Time;
use Cake\ORM\TableRegistry;

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
        $this->Auth->allow(['decode', 'manualTransaction']);

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
    
    public function synchronizeWithStateUserTransactions()
    {
      $startTime = microtime(true);
      $missing_transaction_ids = [];
      $transaction_ids = $this->Transactions
              ->find('all')
              ->select(['id', 'transaction_type_id'])
              ->order(['id'])
              ->all()
              ;
      $state_user_transaction_ids = $this->Transactions->StateUserTransactions
              ->find('all')
              ->select(['transaction_id'])
              ->group(['transaction_id'])
              ->order(['transaction_id'])
              ->toArray()
              ;
      $i2 = 0;
      $count1 = count($transaction_ids);
      $count2 = count($state_user_transaction_ids);
      foreach($transaction_ids as $i1 => $tr_id) {
        //echo "$i1: ";
        if($i2 >= $count2) {
          $missing_transaction_ids[] = $tr_id;
          //echo "adding to missing: $tr_id, continue <br>";
          continue;
        }
        $stu_id = $state_user_transaction_ids[$i2];
        if($tr_id->id == $stu_id->transaction_id) {
          $i2++;
          //echo "after i2++: $i2<br>";
        } else if($tr_id->id < $stu_id->transaction_id) {
          $missing_transaction_ids[] = $tr_id;
          //echo "adding to missing: $tr_id<br>";
        }
      }
      
      if($this->request->is('POST')) {
        $tablesForType = [
            1 => $this->Transactions->TransactionCreations,
            2 => $this->Transactions->TransactionSendCoins,
            3 => $this->Transactions->TransactionGroupCreates,
            4 => $this->Transactions->TransactionGroupAddaddress,
            5 => $this->Transactions->TransactionGroupAddaddress
        ];
        $idsForType = [];
        foreach($missing_transaction_ids as $i => $transaction) {
          if(!isset($idsForType[$transaction->transaction_type_id])) {
            $idsForType[$transaction->transaction_type_id] = [];
          }
          $idsForType[$transaction->transaction_type_id][] = $transaction->id;
          if($i > 200) break;
        }
        $entities = [];
        $state_user_ids = [];
        foreach($idsForType as $type_id => $transaction_ids) {
          $specific_transactions = $tablesForType[$type_id]->find('all')->where(['transaction_id IN' => $transaction_ids])->toArray();
          $keys = $tablesForType[$type_id]->getSchema()->columns();
          //var_dump($keys);
          foreach($specific_transactions as $specific) {
            
            foreach($keys as $key) {
              if(preg_match('/_user_id/', $key)) {
                $entity = $this->Transactions->StateUserTransactions->newEntity();
                $entity->transaction_id = $specific['transaction_id'];
                $entity->transaction_type_id = $type_id;
                $entity->state_user_id = $specific[$key];
                if(!in_array($entity->state_user_id, $state_user_ids)) {
                  array_push($state_user_ids, $entity->state_user_id);
                }
                $entities[] = $entity;
              }
            } 
          }
        }
        //var_dump($entities);
        $stateUsersTable = TableRegistry::getTableLocator()->get('StateUsers');
        $existingStateUsers = $stateUsersTable->find('all')->select(['id'])->where(['id IN' => $state_user_ids])->order(['id'])->all();
        $existing_state_user_ids = [];
        $finalEntities = [];
        foreach($existingStateUsers as $stateUser) {
          $existing_state_user_ids[] = $stateUser->id;
        }
        foreach($entities as $entity) {
          if(in_array($entity->state_user_id, $existing_state_user_ids)) {
            array_push($finalEntities, $entity);
          }
        }
        
        
        $results = $this->Transactions->StateUserTransactions->saveMany($finalEntities);
        foreach($entities as $i => $entity) {
          $errors = $entity->getErrors();
        /*  if(count($errors)) {
            echo "$i: ";
            echo json_encode($errors); 
            echo "<br>";
            echo "state_user_id: " . $entity->state_user_id;
            echo "<br>";
          }*/
        }
        $this->set('results', $results);
        $this->set('entities', $entities);
      }
      
      $this->set('missing_transactions', $missing_transaction_ids);
      $this->set('count1', $count1);
      $this->set('count2', $count2);
      $timeUsed = microtime(true) - $startTime;
      $this->set('timeUsed', $timeUsed);
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
            'contain' => ['TransactionTypes', 'TransactionCreations', 'TransactionGroupAddaddress', 'TransactionGroupAllowtrades', 'TransactionGroupCreates', 'TransactionSendCoins', 'TransactionSignatures']
        ]);

        $this->set('transaction', $transaction);
    }
    
    public function manualTransaction()
    {
      if ($this->request->is('post')) {
            $data = $this->request->getData();
            $type = $data['type'];
            
            $transaction = new \Proto\Gradido\GradidoTransaction();
            $transactionBody = new \Proto\Gradido\TransactionBody();
            $transactionBody->setMemo($data['memo']);
            $created = new \Proto\Gradido\TimestampSeconds();
            $now = new Time();
            $created->setSeconds($now->getTimestamp());
            $transactionBody->setCreated($created);
            if($type == "creation") {
                $creation = new \Proto\Gradido\GradidoCreation();
                $target_date = new \Proto\Gradido\TimestampSeconds();
                $target_time = new Time($data['target_date']);
                $target_date->setSeconds($target_time->getTimestamp());
                $creation->setTargetDate($target_date);
                $receiver = new \Proto\Gradido\TransferAmount();
                $receiver->setAmount(intval($data['amount']));
                $receiver->setPubkey(hex2bin($data['target_public_key']));
                $creation->setReceiver($receiver);        
                $transactionBody->setCreation($creation);
            } else if($type == "transfer") {
                $transfer = new \Proto\Gradido\GradidoTransfer();
                $local_transfer = new \Proto\Gradido\LocalTransfer();
                $sender = new \Proto\Gradido\TransferAmount();
                $sender->setAmount(intval($data['amount']));
                $sender->setPubkey(hex2bin($data['sender_public_key']));
                $local_transfer->setSender($sender);        
                $local_transfer->setReceiver(hex2bin($data['receiver_public_key']));
                $transfer->setLocal($local_transfer);
                $transactionBody->setTransfer($transfer);
            }
            $body_bytes = $transactionBody->serializeToString();
            $transaction->setBodyBytes($body_bytes);

            $protoSigMap = new \Proto\Gradido\SignatureMap();
            $sigPairs = $protoSigMap->getSigPair();
            //echo "sigPairs: "; var_dump($sigPairs); echo "<br>";
            //return null;

            // sign with keys
            //foreach($keys as $key) {
              $sigPair = new \Proto\Gradido\SignaturePair();  
              $sigPair->setPubKey(hex2bin($data['signer_public_key']));
              
              $signature = sodium_crypto_sign_detached($body_bytes, hex2bin($data['signer_private_key']));
              echo "signature: " . bin2hex($signature). "<br>";
              $sigPair->setEd25519($signature);

              $sigPairs[] = $sigPair;
              // SODIUM_BASE64_VARIANT_URLSAFE_NO_PADDING
              // SODIUM_BASE64_VARIANT_ORIGINAL
              $transaction->setSigMap($protoSigMap);
              //var_dump($protoSigMap);
              $transaction_bin = $transaction->serializeToString();
//              $url_safe = sodium_bin2base64($transaction_bin, sodium_base64_VARIANT_ORIGINAL);
              $base64 = [
                  //'original' => sodium_bin2base64($transaction_bin, sodium_base64_VARIANT_ORIGINAL),
                  //'original_nopadding' => sodium_bin2base64($transaction_bin, sodium_base64_VARIANT_ORIGINAL_NO_PADDING),
                  //'urlsafe' => sodium_bin2base64($transaction_bin, sodium_base64_VARIANT_URLSAFE),
                  'urlsafe_nopadding' => sodium_bin2base64($transaction_bin, SODIUM_BASE64_VARIANT_URLSAFE_NO_PADDING),
                  'php' => base64_encode($transaction_bin)

              ];
              
              $this->set('base64', $base64);
        }  
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
                $result = $this->Transactions->updateTxHash($transaction, 'start decay');
                if($result === true) {
                    $this->Flash->success(__('The transaction has been saved.'));
                    return $this->redirect(['action' => 'index']);
                } else {
                    $this->Flash->error(__('Error by saving: ' . json_encode($result)));
                }
            }
            $this->Flash->error(__('The transaction could not be saved. Please, try again.'));
        }
        $stateGroups = $this->Transactions->StateGroups->find('list', ['limit' => 200]);
        $transactionTypes = $this->Transactions->TransactionTypes->find('list', ['limit' => 200]);
        $blockchainTypes = $this->Transactions->BlockchainTypes->find('list');
        $this->set(compact('transaction', 'stateGroups', 'transactionTypes', 'blockchainTypes'));
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
