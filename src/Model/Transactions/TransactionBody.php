<?php

namespace Model\Transactions;

use Cake\ORM\TableRegistry;

class TransactionBody extends TransactionBase {
  private $mProtoTransactionBody = null;
  private $mSpecificTransaction = null;
  private $mTransactionID = 0;
  
  public function __construct($bodyBytes) {
    $this->mProtoTransactionBody = new \Model\Messages\Gradido\TransactionBody();
    $this->mProtoTransactionBody->mergeFromString($bodyBytes);
    switch($this->mProtoTransactionBody->getData()) {
      case 'creation' : $this->mSpecificTransaction = new TransactionCreation($this->mProtoTransactionBody->getCreation()); break;
      case 'transfer' : $this->mSpecificTransaction = new TransactionTransfer($this->mProtoTransactionBody->getTransfer()); break;
    }
  }
  
  public function validate($sigPairs) {
    if(!$this->mSpecificTransaction->validate($sigPairs)) {
      $this->addErrors($this->mSpecificTransaction->getErrors());
      return false;
    }
    return true;
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
  
  public function save($firstPublic) {
      $transactionsTable = TableRegistry::getTableLocator()->get('transactions');
      $transactionEntity = $transactionsTable->newEntity();
      
      // transaction type id
      $transactionTypesTable = TableRegistry::getTableLocator()->get('transaction_types');
      
      $typeName = $this->getTransactionTypeName();
      $transactionType = $transactionTypesTable->find('all')->where(['name' => $typeName])->select(['id'])->first();
      if($transactionType == NULL) {
        $this->addError('TransactionBody::save', 'zero type id for type: ' . $typeName);
        return false;
      }
      $transactionEntity->transaction_type_id = $transactionType->id;
      $transactionEntity->memo = $this->getMemo();
      
      if ($transactionsTable->save($transactionEntity)) {
        // success
        $this->mTransactionID = $transactionEntity->id;
        if(!$this->mSpecificTransaction->save($transactionEntity->id, $firstPublic)) {
          $this->addErrors($this->mSpecificTransaction->getErrors());
          return false;
        }  
      } else {
        $this->addError('TransactionBody::save', 'error saving transaction with: ' . json_encode($transactionEntity->getError()));
        return false;
      }
      return true;
  }
  
  public function getTransactionID() {
    return $this->mTransactionID;
  }
  
  
}
