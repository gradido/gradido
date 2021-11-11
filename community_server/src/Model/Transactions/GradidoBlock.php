<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace Model\Transactions;

use Cake\Datasource\ConnectionManager;
use Cake\I18n\FrozenTime;
use Cake\I18n\Time;

class GradidoBlock extends TransactionBase {
  
    private $mProtoGradidoBlock = null;
    private $mTransaction = null;
  
    public function __construct($base64Data) 
    {
        try {
            $transactionBin = sodium_base642bin($base64Data, SODIUM_BASE64_VARIANT_ORIGINAL);
        } catch(\SodiumException $e) {
            $transactionBin = base64_decode($base64Data, true);
            if($transactionBin == false) {
               $this->addError('GradidoBlock', $e->getMessage());// . ' ' . $base64Data);
               $this->addError('base64', $base64Data);
               return;
            }
        }
            
        if($transactionBin == false) {
            $this->addError('GradidoBlock', 'base64 decode error: ' . $base64Data);
        } else {
            $this->mProtoGradidoBlock = new \Proto\Gradido\GradidoBlock();
            try {
                $this->mProtoGradidoBlock->mergeFromString($transactionBin);
            } catch(\Google\Protobuf\Internal\GPBDecodeException $e) {
                $this->addError('GradidoBlock', $e->getMessage());
                return;
            }
        }
        if($this->mProtoGradidoBlock) {
            $this->mTransaction = new Transaction($this->mProtoGradidoBlock->getTransaction());
        } else {
            $this->addError('GradidoBlock', 'gradido block is zero');
        }
    }

    public function getId() {
        return $this->mProtoGradidoBlock->getId();
    }

    public function getReceived() {
        return new FrozenTime($this->mProtoGradidoBlock->getReceived()->getSeconds());
    }

    public function validate()
    {
        $result = $this->mTransaction->validate();
        if(!$result) {
            $this->addErrors($this->mTransaction->getErrors());
            return false;
        }
        $versionNumber = $this->mProtoGradidoBlock->getVersionNumber();
        if($versionNumber != 1) {
            $this->addError('GradidoBlock::validate', 'version number is not like expected: ' . $versionNumber);
            return false;
        }
        $received = $this->getReceived();
        if($received > Time::now()) {
            $this->addError('GradidoBlock::validate', 'the transaction came from the future: ' . $received->nice());
            return false;
        }
        $txHash = $this->calculateTxHash();
        if(0 != strcmp($txHash, $this->mProtoGradidoBlock->getRunningHash())) {
            $this->addError('GradidoBlock::validate', 'error with tx hash'. json_encode([
                'calculated' => \Sodium\bin2hex($txHash),
                'received' => \Sodium\bin2hex($this->mProtoGradidoBlock->getRunningHash())
            ]));
            return false;
        }

        return $result;
    }

    public function calculateTxHash()
    {
        $transactionId = $this->getId();
        $previousTxHash = null;
        if($transactionId > 1) {
            $transactionsTable = $this->getTable('transactions');
            try {
                $previousTransaction = $transactionsTable
                        ->find('all', ['contain' => false])
                        ->select(['tx_hash'])
                        ->where(['id' => $transactionId - 1])
                        ->first();
            } catch(Cake\Datasource\Exception\RecordNotFoundException $ex) {
                $this->addError('GradidoBlock::calculateTxHash', 'previous transaction (with id ' . ($transactionId-1) . ' not found');
                return false;
            }
            if(!$previousTransaction) {
                // shouldn't occur
                $this->addError('GradidoBlock::calculateTxHash', 'previous transaction (with id ' . ($transactionId-1) . ' not found');
                return false;
            }
            $previousTxHash = $previousTransaction->tx_hash;
        }

        // calculate tx hash
        // previous tx hash + id + received + sigMap as string
        // Sodium use for the generichash function BLAKE2b today (11.11.2019), mabye change in the future
        $state = \Sodium\crypto_generichash_init();
        if($previousTxHash != null) {
            $previousTxHashCutted = substr(stream_get_contents($previousTxHash), 0, 32);
            \Sodium\crypto_generichash_update($state, $previousTxHashCutted);
            //$this->addError("prev tx hash", \Sodium\bin2hex($previousTxHashCutted));
        }
        \Sodium\crypto_generichash_update($state, strval($transactionId));        
        \Sodium\crypto_generichash_update($state, $this->getReceived()->i18nFormat('yyyy-MM-dd HH:mm:ss'));
        $sigMap = $this->mProtoGradidoBlock->getTransaction()->getSigMap();
        \Sodium\crypto_generichash_update($state, $sigMap->serializeToString());

        return \Sodium\crypto_generichash_final($state);        
    }


    public function save()
    {
        $connection = ConnectionManager::get('default');
        $connection->begin();
        $transactionBody = $this->mTransaction->getTransactionBody();
        if (!$this->saveTransactionBody($transactionBody)) {
          $connection->rollback();
          // correct auto-increment value to prevent gaps
          $this->fixAutoIncrement();  
          
          return false;
      }
      
      // save transaction signatures
      $transactionsSignaturesTable = $this->getTable('transaction_signatures');
      $transactionId = $this->getId();
            
      $sigPairs = $this->mProtoGradidoBlock->getTransaction()->getSigMap()->getSigPair();
      
      $signatureEntitys = [];
      foreach($sigPairs as $sigPair) {
          $signatureEntity = $transactionsSignaturesTable->newEntity();
          $signatureEntity->transaction_id = $transactionId;
          $signatureEntity->signature = $sigPair->getSignature();
          $signatureEntity->pubkey = $sigPair->getPubKey();
          array_push($signatureEntitys, $signatureEntity);
      }
      
      if(!$transactionsSignaturesTable->saveMany($signatureEntitys)) {
        foreach($signatureEntitys as $entity) {
          $errors = $entity->getErrors();
          if(!$errors && count($errors) > 0) {
            $pubkeyHex = bin2hex($entity->pubkey);
            $this->addError('GradidoBlock::save', 'error saving signature for pubkey: ' . $pubkeyHex . ', with errors: ' . json_encode($errors) );
          }
        }
        $connection->rollback();
        // correct auto-increment value to prevent gaps
        $this->fixAutoIncrement();  
        return false;
      }
      
      $connection->commit();
      
      $specificTransaction = $transactionBody->getSpecificTransaction();
      
      $specificTransaction->sendNotificationEmail($transactionBody->getMemo());
      $this->addWarnings($specificTransaction->getWarnings());
      return true;
    }

    private function saveTransactionBody($transactionBody)
    {
      $transactionsTable = $this->getTable('transactions');
      $transactionEntity = $transactionsTable->newEntity();
      
      $specificTransaction = $transactionBody->getSpecificTransaction();
      
      $transactionEntity->id = $this->getId();
      $transactionEntity->transaction_type_id = $transactionBody->getTransactionTypeId();
      $txHash =  $this->calculateTxHash();
      if(!$txHash) {
          $this->addError('GradidoBlock::saveTransactionBody', 'txHash is false');
          return false;
      }

      $transactionEntity->tx_hash = $txHash;
      $transactionEntity->memo = $transactionBody->getMemo();
      $transactionEntity->received = $this->getReceived()->format("Y-m-d H:i:s");
      $transactionEntity->blockchain_type_id = 3; // iota
            
      if ($transactionsTable->save($transactionEntity)) {
        $firstPublic = $this->mTransaction->getFirstPublic();
        if(!$specificTransaction->save($transactionEntity->id, $firstPublic, new FrozenTime($transactionEntity->received))) {
          $this->addErrors($specificTransaction->getErrors());
          return false;
        }  
      } else {
        $this->addError('GradidoBlock::saveTransactionBody', 'error saving transaction with: ' . json_encode($transactionEntity->getError()));
        return false;
      }
      return true;
    }

    
    private function fixAutoIncrement()
    {
        $transactionsTable = $this->getTable('transactions');
        $transactions = $transactionsTable->find()->select(['id'])->contain(false);
        $count = $transactions->count();
        $connection = ConnectionManager::get('default');
        $connection->execute("ALTER TABLE `transactions` auto_increment = $count;");
    }
}