<?php

namespace Model\Transactions;

use Cake\ORM\TableRegistry;
use Cake\I18n\FrozenDate;
use Cake\I18n\FrozenTime;

class TransactionBody extends TransactionBase {
  private $mProtoTransactionBody = null;
  private $mSpecificTransaction = null;
  private $mTransactionID = 0;
  private $transactionTypeId = 0;
  
  public function __construct($bodyBytes) {
    $this->mProtoTransactionBody = new \Proto\Gradido\TransactionBody();
    try {
      $this->mProtoTransactionBody->mergeFromString($bodyBytes);
      // cannot catch Exception with cakePHP, I don't know why
    } catch(\Google\Protobuf\Internal\GPBDecodeException $e) {
      //var_dump($e);
      $this->addError('TransactionBody', $e->getMessage());
      return;
    }
    
    switch($this->mProtoTransactionBody->getData()) {
      case 'creation' : $this->mSpecificTransaction = new TransactionCreation($this->mProtoTransactionBody->getCreation()); break;
      case 'transfer' : $this->mSpecificTransaction = new TransactionTransfer($this->mProtoTransactionBody->getTransfer()); break;
    }
  }
  
  public function validate($sigPairs) {
    
    // transaction type id
    $transactionTypesTable = TableRegistry::getTableLocator()->get('transaction_types');

    $typeName = $this->getTransactionTypeName();
    $transactionType = $transactionTypesTable->find('all')->where(['name' => $typeName])->select(['id'])->first();
    if($transactionType == NULL) {
      $this->addError('TransactionBody::validate', 'zero type id for type: ' . $typeName);
      return false;
    }
    $this->transactionTypeId = $transactionType->id;
      
    // check if creation time is in the past
    if($this->mProtoTransactionBody->getCreated()->getSeconds() > time()) {
      $this->addError('TransactionBody::validate', 'Transaction were created in the future!');
      return false;
    }
    if(!$this->mSpecificTransaction->validate($sigPairs, new FrozenDate($this->mProtoTransactionBody->getCreated()->getSeconds()))) {
      $this->addErrors($this->mSpecificTransaction->getErrors());
      return false;
    }   
      
    return true;
  }

  public function checkWithDb($dbTransaction)
  {
     $functionName = 'TransactionBody::checkWithDb';
     if($this->getMemo() != $dbTransaction->memo) {
        $this->addError($functionName, 'memos don\'t match');
        $this->addError($functionName, 'stored: ' . $dbTransaction->memo);
        $this->addError($functionName, 'received: ' . $this->getMemo());
        return false;
     }
     // currently not stored in db
     /*$created = new FrozenTime($this->mProtoTransactionBody->getCreated()->getSeconds());
     if($created != $dbTransaction->created) {
        $this->addError($functionName, 'created date don\'t match' . json_encode([
          'stored' => $dbTransaction->created ? $dbTransaction->created->i18nFormat(): null,
          'received' => $created->i18nFormat()
        ]));
        return false;
     }*/
     if($this->getTransactionTypeName() != $dbTransaction->transaction_type->name) {
       $this->addError($functionName, 'transaction types not the same: ' .  json_encode([
         'stored' => $dbTransaction->transaction_type->name,
         'received' => $this->getTransactionTypeName()
       ]));
       return false;
     }
     $specificTransaction = $this->getSpecificTransaction();
     if($specificTransaction) {
        $result = $specificTransaction->checkWithDb($dbTransaction);
        $this->addErrors($specificTransaction->getErrors());
        return $result;
     }
     $this->addError($functionName, 'no specific transaction');
     return false;

  }
  
  public function getSpecificTransaction() {
    return $this->mSpecificTransaction;
  }
  
  public function getMemo() {
    return $this->mProtoTransactionBody->getMemo();
  }
  
  public function getTransactionTypeName()
  {
    return $this->mProtoTransactionBody->getData(); 
  }
  
  public function save($firstPublic, $sigMap, $blockchainType) {
      $transactionsTable = $this->getTable('transactions');
      $transactionEntity = $transactionsTable->newEntity();
            
      $transactionEntity->transaction_type_id = $this->transactionTypeId;
      $transactionEntity->memo = $this->getMemo();
      $transactionEntity->transaction_state_id = 1;
      
      // find out next transaction nr
      $lastTransaction = $transactionsTable
                          ->find('all', ['contain' => false])
                          ->select(['nr', 'tx_hash'])
                          ->order(['nr' => 'DESC'])
                          ->limit(1)
                          ->epilog('FOR UPDATE') // lock indexes from updates in other sessions
                          ;
      if($lastTransaction->count() >= 1) {
        $transactionEntity->nr = $lastTransaction->first()->nr + 1;
      } else {
        $transactionEntity->nr = 1;
      }                       

      if ($transactionsTable->save($transactionEntity)) {
          // reload entity to get received date filled from mysql
        $transactionEntity = $transactionsTable->get($transactionEntity->id);
        // success
        $this->mTransactionID = $transactionEntity->id;
        if(!$this->mSpecificTransaction->save($transactionEntity->id, $firstPublic, $transactionEntity->received)) {
          $this->addErrors($this->mSpecificTransaction->getErrors());
          return false;
        }  
      } else {
        $this->addError('TransactionBody::save', 'error saving transaction with: ' . json_encode($transactionEntity->getError()));
        return false;
      }
      $previousTxHash = null;
      $previousTxState = 0;
      if($transactionEntity->nr > 1) {
        try {
          $previousTransaction = $transactionsTable
                  ->find('all', ['contain' => false])
                  ->select(['tx_hash', 'transaction_state_id'])
                  ->where(['nr' => $transactionEntity->nr - 1])
                  ->first();
          /*$previousTransaction = $transactionsTable->get($this->mTransactionID - 1, [
              'contain' => false, 
              'fields' => ['tx_hash']
          ]);*/
        } catch(Cake\Datasource\Exception\RecordNotFoundException $ex) {
          $this->addError('TransactionBody::save', 'previous transaction (with id ' . ($this->mTransactionID-1) . ' not found');
          return false;
        }
        if(!$previousTransaction) {
          // shouldn't occur
          $this->addError('TransactionBody::save', 'previous transaction (with id ' . ($this->mTransactionID-1) . ' not found');
          return false;
        }
        $previousTxHash = $previousTransaction->tx_hash;
        $previousTxState = $previousTransaction->transaction_state_id;
      }
      try {
        //$transactionEntity->received = $transactionsTable->get($transactionEntity->id, ['contain' => false, 'fields' => ['received']])->received;
        $transactionEntity->received = $transactionsTable
                ->find('all', ['contain' => false])
                ->where(['id' => $transactionEntity->id])
                ->select(['received'])->first()->received;
      } catch(Cake\Datasource\Exception\RecordNotFoundException $ex) {
        $this->addError('TransactionBody::save', 'current transaction (with id ' . ($transactionEntity->id) . ' not found');
        $this->addError('exception: ', $ex->getMessage());
        return false;
      }
      
      // calculate tx hash
      // previous tx hash + id + received + sigMap as string
      // Sodium use for the generichash function BLAKE2b today (11.11.2019), mabye change in the future
      $state = \Sodium\crypto_generichash_init();
      //echo "prev hash: $previousTxHash\n";
      if($previousTxHash != null) {
        \Sodium\crypto_generichash_update($state, stream_get_contents($previousTxHash));
      }
      //echo "id: " . $transactionEntity->id . "\n";
      \Sodium\crypto_generichash_update($state, strval($transactionEntity->nr));
      //echo "received: " . $transactionEntity->received;
      \Sodium\crypto_generichash_update($state, $transactionEntity->received->i18nFormat('yyyy-MM-dd HH:mm:ss'));
      \Sodium\crypto_generichash_update($state, $sigMap->serializeToString());
      $transactionEntity->tx_hash = \Sodium\crypto_generichash_final($state);
      $transactionEntity->transaction_state_id = 2;
      if($previousTxState == 3 && $blockchainType == 'mysql') {
        $transactionEntity->transaction_state_id = 3;
      }
      if ($transactionsTable->save($transactionEntity)) {
        return true;
      }
      $this->addError('TransactionBody::save', 'error saving transaction with: ' . json_encode($transactionEntity->getError()));
        return false;
  }
  
  public function getTransactionID() {
    return $this->mTransactionID;
  }
  
  public function getTransactionTypeId() {
    return $this->transactionTypeId;
  }
  
  static public function fromEntity($memo, $transaction) 
  {
    $protoBody = new \Proto\Gradido\TransactionBody();
    $protoBody->setMemo($memo);
    
    //$created->setSeconds($var);
    //$protoBody->setCreated($created);
    if(count($transaction->transaction_creations) == 1) {
      //echo "is creation<br>";
      $protoBody->setCreation(TransactionCreation::fromEntity($transaction->transaction_creations[0])->getProto());
    }
    else if(count($transaction->transaction_send_coins) == 1) {
      //echo "is transfer";
      $protoBody->setTransfer(TransactionTransfer::fromEntity($transaction->transaction_send_coins)->getProto());
    } else {
      return ['invalid transaction type or count'];
    }
    
    return $protoBody;
  }
  
  static public function build($memo, $specificTransaction) 
  {
    $protoBody = new \Proto\Gradido\TransactionBody();
    $protoBody->setMemo($memo);
    
    if(is_a($specificTransaction, 'TransactionCreation')) {
      $protoBody->setCreation($specificTransaction->getProto());
    } else if(is_a($specificTransaction, 'TransactionTransfer')) {
      $protoBody->setTransfer($specificTransaction->getProto());
    } else {
      return ['invalid tarnsaction type'];
    }
    return $protoBody;
    
  }
  
}
