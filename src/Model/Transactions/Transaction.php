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
        //$transactionBin = base64_decode($base64Data, true);
        //if($transactionBin == false) {
      //sodium_base64_VARIANT_URLSAFE_NO_PADDING
            try {
              $transactionBin = sodium_base642bin($base64Data, SODIUM_BASE64_VARIANT_URLSAFE_NO_PADDING);
            } catch(\SodiumException $e) {
              //$this->addError('Transaction', $e->getMessage());// . ' ' . $base64Data);
              //return;
               $transactionBin = base64_decode($base64Data, true);
               if($transactionBin == false) {
                 $this->addError('Transaction', $e->getMessage());// . ' ' . $base64Data);
                 return;
               }
            }
        //*/}
        
        if($transactionBin == false) {
          //$this->addError('base64 decode failed');
          $this->addError('Transaction', 'base64 decode error: ' . $base64Data);
        } else {
          //var_dump($transactionBin);
          $this->mProtoTransaction = new \Model\Messages\Gradido\Transaction();
          try {
            $this->mProtoTransaction->mergeFromString($transactionBin);
            //var_dump($this->mProtoTransaction);
            // cannot catch Exception with cakePHP, I don't know why
          } catch(\Google\Protobuf\Internal\GPBDecodeException $e) {
            //var_dump($e);
            $this->addError('Transaction', $e->getMessage());
            return;
          }//*/
          
          //echo 'serialize to json: <br>';
          //echo $this->mProtoTransaction->serializeToJsonString();
          //echo "body bytes: <br>";
          //var_dump($this->mProtoTransaction->getBodyBytes());
          //echo "<br>end body bytes<br>";
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
    
    public function getId() {
      return $this->mProtoTransaction->getId();
    }
    
    public function validate() {
        $sigMap = $this->mProtoTransaction->getSigMap();
        if(!$sigMap) {
          $this->addError('Transaction', 'signature map is zero');
          return false;
        }
        //var_dump($sigMap);
        //die();
        $sigPairs = $sigMap->getSigPair();
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
      
       if (!$this->mTransactionBody->save($this->getFirstPublic(), $this->mProtoTransaction->getSigMap())) {
          $this->addErrors($this->mTransactionBody->getErrors());
          $connection->rollback();
          return false;
      }
      
      // save transaction signatures
      $transactionsSignaturesTable = TableRegistry::getTableLocator()->get('transaction_signatures');
      $transactionId = $this->mTransactionBody->getTransactionID();
      //signature     pubkey
      
      $sigPairs = $this->mProtoTransaction->getSigMap()->getSigPair();
      //echo "sigPairs: "; var_dump($sigPairs);
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
      
      $this->mTransactionBody->getSpecificTransaction()->sendNotificationEmail($this->mTransactionBody->getMemo());
      
      return true;
    }

    static public function fromTable($id) 
    {   
        $transactionsTable = TableRegistry::getTableLocator()->get('transactions');
        $transactionEntry = $transactionsTable
                ->find('all')
                ->where(['id' => $id])
                ->contain([
                    'TransactionCreations', 
                    'TransactionSendCoins', 
                    'TransactionSignatures'])
                ->first();
        //var_dump($transactionEntry->toArray());
        $protoTransaction = new \Model\Messages\Gradido\Transaction();
        
        
        
        $protoTransaction->setId($transactionEntry->id);

        
        $recevied = new \Model\Messages\Gradido\TimestampSeconds();
        $recevied->setSeconds($transactionEntry->received->getTimestamp());
        $protoTransaction->setReceived($recevied);
        
        
        $sigMap = SignatureMap::fromEntity($transactionEntry->transaction_signatures);
        $protoTransaction->setSigMap($sigMap->getProto());
        
        //echo "sig map: check<br>";
        $protoTransaction->setTxHash(stream_get_contents($transactionEntry->tx_hash));
        
        $body = TransactionBody::fromEntity($transactionEntry->memo, $transactionEntry);
        if(is_array($body)) {
          return ['state' => 'error', 'msg' => 'error creating body transaction', 'details' => $body];
        }
        //$protoTransaction->setBodyBytes($body->serializeToString());
        return $protoTransaction;
    }    

}