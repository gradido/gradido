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
    
    
  
    public function __construct($base64Data) 
    {
        //$transactionBin = base64_decode($base64Data, true);
        //if($transactionBin == false) {
      //sodium_base64_VARIANT_URLSAFE_NO_PADDING
      if(is_a($base64Data, '\Proto\Gradido\GradidoTransaction')) {
        $this->mProtoTransaction = $base64Data;
        $this->mTransactionBody = new TransactionBody($this->mProtoTransaction->getBodyBytes());
        return;
      }
      
      try {
        $transactionBin = sodium_base642bin($base64Data, SODIUM_BASE64_VARIANT_URLSAFE_NO_PADDING);
      } catch(\SodiumException $e) {
        //$this->addError('Transaction', $e->getMessage());// . ' ' . $base64Data);
        //return;
         $transactionBin = base64_decode($base64Data, true);
         if($transactionBin == false) {
           $this->addError('Transaction', $e->getMessage());// . ' ' . $base64Data);
           $this->addError('base64', $base64Data);
           return;
         }
      }
        //*/}
        
        if($transactionBin == false) {
          //$this->addError('base64 decode failed');
          $this->addError('Transaction', 'base64 decode error: ' . $base64Data);
        } else {
          //var_dump($transactionBin);
          $this->mProtoTransaction = new \Proto\Gradido\GradidoTransaction();
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
    
    static public function build(\Proto\Gradido\TransactionBody $transactionBody, $senderKeyPair) 
    {
        $protoTransaction = new \Proto\Gradido\GradidoTransaction();
        
        $recevied = new \Proto\Gradido\TimestampSeconds();
        $recevied->setSeconds(time());
        $protoTransaction->setReceived($recevied);
        
        $bodyBytes = $transactionBody->serializeToString();
        
        $sigMap = SignatureMap::build($bodyBytes, [$senderKeyPair]);
        $protoTransaction->setSigMap($sigMap->getProto());
        
        $protoTransaction->setBodyBytes($bodyBytes);
        
        return $protoTransaction;
        
    }
    
    public function getTransactionBody() {
      return $this->mTransactionBody;
    }
    
    public function getFirstPublic() 
    {
      if(!$this->mProtoTransaction || !$this->mProtoTransaction->getSigMap()) {
          return '';
      }
      $sigPairs = $this->mProtoTransaction->getSigMap()->getSigPair();
      return $sigPairs[0]->getPubKey();
    }
    
    public function getFirstSigningUser()
    {
        return $this->getStateUserFromPublickey($this->getFirstPublic());
    }
    
    public function getId() {
      return $this->mProtoTransaction->getId();
    }
    
    public function validate() {
        $sigMap = $this->mProtoTransaction->getSigMap();
        if(!$sigMap) {
          $this->addError('Transaction', 'signature map is zero');
          //var_dump($this->mProtoTransaction);
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
          $signature = $sigPair->getSignature();
          //echo "verify bodybytes: <br>" . bin2hex($bodyBytes) . '<br>';
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

    public function checkWithDb($dbTransaction)
    {
       $functionName = 'Transaction::checkWithDb';
       $transactionsSignaturesTable = $this->getTable('transaction_signatures');
       $dbSignatures = $transactionsSignaturesTable->find('all')->where(['transaction_id' => $dbTransaction->id]);
       $sortedDBSignatures = [];
       foreach($dbSignatures as $dbSignature) {
         $publicKeyHex = \Sodium\bin2hex(stream_get_contents($dbSignature->pubkey));
         $sortedDBSignatures[$publicKeyHex] = $dbSignature->signature;
       }
       $sigPairs = $this->mProtoTransaction->getSigMap()->getSigPair();
       $signaturesMatch = true;
       if(count($sortedDBSignatures) == count($sigPairs)) {
          foreach($sigPairs as $sigPair) {
            $publicKeyHex = \Sodium\bin2hex($sigPair->getPubKey());
            if(!isset($sortedDBSignatures[$publicKeyHex])) {
              $this->addError($functionName, 'couldn\'t find public key from received transaction in db: ' . $publicKeyHex);
              $signaturesMatch = false;
              break;
            }
            if($sortedDBSignatures[$publicKeyHex] != $sigPair->getSignature()) {
              $this->addError($functionName, 'signatures for pubkey: ' . $publicKeyHex . ' don\'t match');
              $signaturesMatch = false;
              break;
            }
          }
       }
       if($signaturesMatch) {
         return true;
       }
       $this->addError($functionName, 'signatures don\'t match');
       // check more parameter
       $result = $this->mTransactionBody->checkWithDb($dbTransaction);
       $this->addErrors($this->mTransactionBody->getErrors());
       return $result;

    }
    
    public function save($blockchainType)
    {
      $connection = ConnectionManager::get('default');
      $connection->begin();
      //id transaction_id signature     pubkey 
      
       if (!$this->mTransactionBody->save($this->getFirstPublic(), $this->mProtoTransaction->getSigMap(), $blockchainType)) {
          $this->addErrors($this->mTransactionBody->getErrors());
          $connection->rollback();

          return false;
      }
      
      // save transaction signatures
      $transactionsSignaturesTable = $this->getTable('transaction_signatures');
      $transactionId = $this->mTransactionBody->getTransactionID();
      //signature     pubkey
      
      $sigPairs = $this->mProtoTransaction->getSigMap()->getSigPair();
      //echo "sigPairs: "; var_dump($sigPairs);
      $signatureEntitys = [];
      foreach($sigPairs as $sigPair) {
          $signatureEntity = $transactionsSignaturesTable->newEntity();
          $signatureEntity->transaction_id = $transactionId;
          $signatureEntity->signature = $sigPair->getSignature();
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
      
      $specificTransaction = $this->mTransactionBody->getSpecificTransaction();
      
      $specificTransaction->sendNotificationEmail($this->mTransactionBody->getMemo());
      $this->addWarnings($specificTransaction->getWarnings());
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
        $protoTransaction = new \Proto\Gradido\Transaction();
        
        
        
        $protoTransaction->setId($transactionEntry->id);

        
        $recevied = new \Proto\Gradido\TimestampSeconds();
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
        
        // validate signatures
        $sigPairs = $sigMap->getProto()->getSigPair();
        
        if(!$sigPairs || count($sigPairs) < 1) {
          return ['state' => 'error', 'msg' => 'error no signatures found'];
        }
        
        //echo "verify bodybytes: <br>" . bin2hex($bodyBytes) . '<br>';
        $created = new \Proto\Gradido\TimestampSeconds();
        $created->setSeconds($recevied->getSeconds());
        $body->setCreated($created);
        $bodyBytes = $body->serializeToString();
        $createTrys = 0;
        $createRight = false;
        // check signature(s) and 
        // try to get created field of TransactionBody right, because it wasn't saved
        foreach($sigPairs as $sigPair) {
          //echo 'sig Pair: '; var_dump($sigPair); echo "<br>";
          $pubkey = $sigPair->getPubKey();
          $signature = $sigPair->getSignature();
          if(!$createRight) {
            while($createTrys < 500) {
              if(\Sodium\crypto_sign_verify_detached($signature, $bodyBytes, $pubkey)) {
                $createRight = true;
                break;
              } else {
                $createTrys++;
                $created->setSeconds($created->getSeconds() - 1);
                //$body->setCreated($created);
                $bodyBytes = $body->serializeToString();
              }
            }
          }
            
          if (!\Sodium\crypto_sign_verify_detached($signature, $bodyBytes, $pubkey)) {
              return ['state' => 'error', 'msg' => 'signature for key ' . bin2hex($pubkey) . ' isn\'t valid '];
          } 
        }
        
        $protoTransaction->setBodyBytes($bodyBytes);
        
        
        
        return $protoTransaction;
    }    

}