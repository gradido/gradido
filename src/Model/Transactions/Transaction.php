<<<<<<< HEAD
<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace Model\Transactions;

//use Model\Messages\Gradido\Transaction;
//use Model\Messages\Gradido\TransactionBody;
use Cake\ORM\TableRegistry;
use Cake\Datasource\ConnectionManager;

class Transaction extends TransactionBase {
  
    private $mProtoTransaction = null;
    private $mTransactionBody = null;
  
    public function __construct($base64Data) {
        $transactionBin = base64_decode($base64Data);
        if($transactionBin == FALSE) {
          //$this->addError('base64 decode failed');
          $this->addError('Transaction', ['data' => $base64Data, 'bin' => $transactionBin, 'msg' => 'base64 decode error']);
        } else {
          $this->mProtoTransaction = new \Model\Messages\Gradido\Transaction();
          $this->mProtoTransaction->mergeFromString($transactionBin);
          //echo 'serialize to json: <br>';
          //echo $this->mProtoTransaction->serializeToJsonString();
          
          $this->mTransactionBody = new TransactionBody($this->mProtoTransaction->getBodyBytes());
        }
    }
    
    public function getTransactionBody() {
      return $this->mTransactionBody;
    }
    
    public function getFirstPublic() {
      $sigPairs = $this->mProtoTransaction->getSigMap()->getSigPair();
      return $sigPairs[0]->getPubKey();
    }
    
    public function validate() {
        $sigPairs = $this->mProtoTransaction->getSigMap()->getSigPair();
        $bodyBytes = $this->mProtoTransaction->getBodyBytes();
        
        
        if(!$sigPairs || count($sigPairs) < 1) {
          $this->addError('Transaction::validate', 'no signature found');
          return false;
        }
        
        // check signature(s)
        foreach($sigPairs as $sigPair) {
          //echo 'sig Pair: '; var_dump($sigPair); echo "<br>";
          $pubkey = $sigPair->getPubKey();
          $signature = $sigPair->getEd25519();
          if (!\Sodium\crypto_sign_verify_detached($signature, $bodyBytes, $pubkey)) {
              $this->addError('Transaction::validate', 'signature for key ' . bin2hex($pubkey) . ' isn\'t valid ' );
              return false;
          } 
        }
        
        if(!$this->mTransactionBody->validate($sigPairs)) {
          $this->addErrors($this->mTransactionBody->getErrors());
          return false;
        }
        
        return true;
    }
    
    public function save()
    {
      $connection = ConnectionManager::get('default');
      $connection->begin();
      //id transaction_id signature     pubkey 
      
       if (!$this->mTransactionBody->save($this->getFirstPublic())) {
          $this->addErrors($this->mTransactionBody->getErrors());
          $connection->rollback();
          return false;
      }
      
      // save transaction signatures
      $transactionsSignaturesTable = TableRegistry::getTableLocator()->get('transaction_signatures');
      $transactionId = $this->mTransactionBody->getTransactionID();
      //signature     pubkey
      
      $sigPairs = $this->mProtoTransaction->getSigMap()->getSigPair();
      echo "sigPairs: "; var_dump($sigPairs);
      $signatureEntitys = [];
      foreach($sigPairs as $sigPair) {
          $signatureEntity = $transactionsSignaturesTable->newEntity();
          
          $signatureEntity->transaction_id = $transactionId;
          $signatureEntity->signature = $sigPair->getEd25519();
          $signatureEntity->pubkey = $sigPair->getPubKey();
          array_push($signatureEntitys, $signatureEntity);
      }
      //debug($signatureEntitys);
      if(!$transactionsSignaturesTable->saveMany($signatureEntitys)) {
        foreach($signatureEntitys as $entity) {
          $errors = $entity->getErrors();
          if(!$errors && count($errors) > 0) {
            $pubkeyHex = bin2hex($entity->pubkey);
            $this->addError('Transaction::save', 'error saving signature for pubkey: ' . $pubkeyHex . ', with errors: ' . json_encode($errors) );
          }
        }
        $connection->rollback();
        return false;
      }
      
      $connection->commit();
      return true;
    }

    

    
            
  
=======
<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace Model\Transactions;

//use Model\Messages\Gradido\Transaction;
//use Model\Messages\Gradido\TransactionBody;

class Transaction extends TransactionBase {
  
    private $mProtoTransaction = null;
    private $mProtoTransactionBody = null;
    private $errors = [];
  
    public function __construct($base64Data) {
        $transactionBin = base64_decode($base64Data);
        if($transactionBin == FALSE) {
          //$this->addError('base64 decode failed');
          $this->addError(['data' => $base64Data, 'bin' => $transactionBin, 'msg' => 'base64 decode error']);
        } else {
          $this->mProtoTransaction = new \Model\Messages\Gradido\Transaction();
          $this->mProtoTransaction->mergeFromString($transactionBin);
          
          $this->mProtoTransactionBody = new \Model\Messages\Gradido\TransactionBody();
          $this->mProtoTransactionBody->mergeFromString($this->mProtoTransaction->getBodyBytes());
          
          $data = $this->mProtoTransactionBody->getData();
          var_dump($data);
        }
    }
    
    public function validate() {
        $sigPairs = $this->mProtoTransaction->getSigMap()->getSigPair();
        $bodyBytes = $this->mProtoTransaction->getBodyBytes();
        
        // check signature(s)
        foreach($sigPairs as $sigPair) {
          $pubkey = $sigPair->getPubKey();
          $signature = $sigPair->getEd25519();
          if (!\Sodium\crypto_sign_verify_detached($signature, $bodyBytes, $pubkey)) {
              $this->addError('signature for key ' . bin2hex($pubkey) . ' isn\'t valid ' );
              return false;
          } 
        }
        
        return true;
    }
    
    public function getErrors() {
      return $this->errors;
    }
    
    public function hasErrors() {
       return count($this->errors) > 0;
    }
            
    
    private function addError($message) {
      array_push($this->errors, $message);
    }
>>>>>>> bcb8f1761e3eb94f89e9d2c4e70ab096e528e6c6
}