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
    private $mTransactionId = 0;
  
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

    public function checkWithDb()
    {
        $id = $this->getId();
        $functionName = 'GradidoBlock::checkWithDb';
        $transactionsTable = $this->getTable('transactions');
        $dbTransaction = $transactionsTable
                            ->find('all')
                            ->contain(['TransactionTypes'])
                            ->where(['nr' => $id])
                            ->first()
                            ;
        if(!$dbTransaction) {
            return false;
        }
        $stored_txHash = substr(stream_get_contents($dbTransaction->tx_hash), 0, 32);
        if($stored_txHash == $this->mProtoGradidoBlock->getRunningHash()) {
            return true;
        }
        $this->addError($functionName, 'error with  tx hash'. json_encode([
            'stored' => \Sodium\bin2hex($stored_txHash),
            'received' => \Sodium\bin2hex($this->mProtoGradidoBlock->getRunningHash())
        ]));
        // if tx hashes not the same maybe only the tx hash aren't the same, but the rest is correct
        // received cannot be the same, the stored received from db came from mysql, 
        // the received from node server came from iota milestone
        // that from iota should be younger
        if($this->getReceived() < $dbTransaction->received) {
            $this->addError($functionName, 'received date from iota is > as from db' . json_encode([
                'stored' => $dbTransaction->received,
                'received' => $this->getReceived()
            ]));
            //return false;
        }
        $result = $this->mTransaction->checkWithDb($dbTransaction);
        $this->addErrors($this->mTransaction->getErrors());
        return $result;
    }

    protected function getDbTransaction()
    {
        $transactionsTable = $this->getTable('transactions');
        $transactionQuery = $transactionsTable->find('all', ['contain' => false])->where(['nr' => $this->getId()]);
        if($transactionQuery->count() == 0) {
            $this->addError('GradidoBlock::getDbTransaction', 'couldn\'t find transaction in db with nr: ' . $this->getId());
            return NULL;
        }
        return $transactionQuery->first();
    }

    public function updateState($transactionStateId)
    {
        $transactionsTable = $this->getTable('transactions');
        $dbTransaction = $this->getDbTransaction();
        if(!$dbTransaction) return false;
        $dbTransaction->transaction_state_id = $transactionStateId;
        if(!$transactionsTable->save($dbTransaction)) {
            $errors = $dbTransaction->getErrors();
            $this->addError('GradidoBlock::updateState', "error saving transaction_state_id ($transactionStateId) with: " . json_encode($errors));
            return false;
        }
        return true;
    }

    public function updateNr($nr) {
        $transactionsTable = $this->getTable('transactions');
        $dbTransaction = $this->getDbTransaction();
        if(!$dbTransaction) return false;
        $dbTransaction->nr = $nr;
        if(!$transactionsTable->save($dbTransaction)) {
            $errors = $dbTransaction->getErrors();
            $this->addError('GradidoBlock::updateNr', "error saving with: " . json_encode($errors));
            return false;
        }
        return true;
    }

    public function calculateTxHash()
    {
        $transactionNr = $this->getId();
        $previousTxHash = null;
        if($transactionNr > 1) {
            $transactionsTable = $this->getTable('transactions');
            try {
                $previousTransaction = $transactionsTable
                        ->find('all', ['contain' => false])
                        ->select(['tx_hash'])
                        ->where(['nr' => $transactionNr - 1])
                        ->first();
            } catch(Cake\Datasource\Exception\RecordNotFoundException $ex) {
                $this->addError('GradidoBlock::calculateTxHash', 'previous transaction (with id ' . ($transactionNr-1) . ' not found');
                return false;
            }
            if(!$previousTransaction) {
                // shouldn't occur
                $this->addError('GradidoBlock::calculateTxHash', 'previous transaction (with id ' . ($transactionNr-1) . ' not found');
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
        \Sodium\crypto_generichash_update($state, strval($transactionNr));        
        $receivedTime = $this->getReceived();
        $receivedTimeString = '';
        try {
            $receivedTimeString = $receivedTime->i18nFormat('yyyy-MM-dd HH:mm:ss');
        } catch (Exception $e) {
            //echo 'Exception abgefangen: ',  $e->getMessage(), "\n";
            $this->addError('GradidoBlock::calculateTxHash', 'exception on formatting received time: ' . $e->getMessage() );
            return NULL;
        }
        \Sodium\crypto_generichash_update($state, $receivedTimeString);
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
          //$this->fixAutoIncrement();  
          $this->addError('GradidoBlock::save', 'error by calling saveTransactionBody');
          return false;
      }
      
      if(!$this->saveSignatureTxHash()) {
        $connection->rollback();
        $this->addError('GradidoBlock::save', 'error by calling saveSignatureTxHash');
        return false;
      }
      
      $connection->commit();
      
      $specificTransaction = $transactionBody->getSpecificTransaction();
      $specificTransaction->sendNotificationEmail($transactionBody->getMemo());
      $this->addWarnings($specificTransaction->getWarnings());
      
      return true;
    }

    public function saveSignatureTxHash($saveTxHash = false)
    {
        // save transaction signatures
      $transactionsSignaturesTable = $this->getTable('transaction_signatures');

      $transactionId = $this->mTransactionId;

      // if called directly from json request handler in case of transaction was received from node server and tx hash and/or signature(s) where missing
      if(!$transactionId || $saveTxHash) {
        $transactionsTable = $this->getTable('transactions');
        $dbTransaction = $transactionsTable
                            ->find('all', ['contain' => false])
                            ->where(['nr' => $this->getId()])
                            ->first()
                            ;
        if(!$dbTransaction) {
            $this->addError('GradidoBlock::saveSignatureTxHash', 'cannot find transaction with nr: ' . $this->getId());
            return false;
        }
        $transactionId = $dbTransaction->id;

        if($saveTxHash) {
            $txHash =  $this->calculateTxHash();
            if(!$txHash) {
                $this->addError('GradidoBlock::saveSignatureTxHash', 'txHash is false');
                return false;
            }
            $dbTransaction->tx_hash = $txHash;
            if (!$transactionsTable->save($dbTransaction)) {
                $this->addError('GradidoBlock::saveSignatureTxHash', 'error saving updated transaction (tx hash) with: ' . json_encode($transactionEntity->getError()));
                return false;
              }
          }    
      }
      // remove existing signatures for this transaction, maybe they are empty or invalid
      $transactionsSignaturesTable->deleteAll(['transaction_id' => $transactionId]);
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
            $this->addError('GradidoBlock::saveSignatureTxHash', 'error saving signature for pubkey: ' . $pubkeyHex . ', with errors: ' . json_encode($errors) );
          }
        }
        return false;
      }      

      return true;
    }

    private function saveTransactionBody($transactionBody)
    {
      $transactionsTable = $this->getTable('transactions');
      $transactionEntity = $transactionsTable->newEntity();
      
      $specificTransaction = $transactionBody->getSpecificTransaction();
      
      //$transactionEntity->id = $this->getId();
      $transactionEntity->nr = $this->getId();
      $transactionEntity->transaction_type_id = $transactionBody->getTransactionTypeId();
      $txHash =  $this->calculateTxHash();
      if(!$txHash) {
          $this->addError('GradidoBlock::saveTransactionBody', 'txHash is false');
          return false;
      }
      
      $transactionEntity->tx_hash = $txHash;
      $transactionEntity->memo = $transactionBody->getMemo();
      $transactionEntity->received = $this->getReceived();//->i18nFormat('yyyy-MM-dd HH:mm:ss');
      $transactionEntity->blockchain_type_id = 3; // iota
      $transactionEntity->transaction_state_id = 3; // confirmed, because this function will be called through readNode
            
      if ($transactionsTable->save($transactionEntity)) {
        $firstPublic = $this->mTransaction->getFirstPublic();
        $this->mTransactionId = $transactionEntity->id;
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
}