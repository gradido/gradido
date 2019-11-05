<?php

namespace Model\Transactions;

//use App\Model\Transactions\TransactionBase;

use Cake\ORM\TableRegistry;

class TransactionCreation extends TransactionBase {
  
    private $protoTransactionCreation;
    private $transactionCreationsTable;
    
    public function __construct($protoTransactionCreation) {
      $this->protoTransactionCreation = $protoTransactionCreation;
      $this->transactionCreationsTable = TableRegistry::getTableLocator()->get('transaction_creations');
    }
    
    public function getAmount() {
      return $this->protoTransactionCreation->getReceiverAmount()->getAmount();
    }
    
    public function getReceiverPublic() {
      return $this->protoTransactionCreation->getReceiverAmount()->getEd25519ReceiverPubkey();
    }
    
    public function getIdentHash() {
      return $this->protoTransactionCreation->getIdentHash();
    }
    
    public function validate($sigPairs) {
      // check if receiver public is not in signature list
      $receiverPublic = $this->getReceiverPublic();
      foreach($sigPairs as $sigPair) {
        $pubkey = $sigPair->getPubKey();
        if($pubkey == $receiverPublic) {
          $this->addError('TransactionCreation::validate', 'receiver aren\'t allowed to sign creation Transaction');
          return false;
        }
      }
      
      // check if creation threshold for this month isn't reached
      $existingCreations = $this->transactionCreationsTable
              ->find('all')
              ->group('ident_hash')
              ->where(['ident_hash' => $this->getIdentHash()]);
      $existingCreations->select(['amount_sum' => $existingCreations->func()->sum('amount')]);
      debug($existingCreations);
      if($existingCreations->count() > 0) {
        var_dump($existingCreations->toArray());
      }
      return true;
    }
    
    public function save($transaction_id, $firstPublic) {
      
      $transactionCreationEntity = $this->transactionCreationsTable->newEntity();
      
      $transactionCreationEntity->transaction_id = $transaction_id;
      
      // state user id
      $state_user_id = $this->getStateUserId($firstPublic);
      if(!$state_user_id) {
        $this->addError('TransactionCreation::save', 'couldn\'t get state user id');
        return false;
      }
      $transactionCreationEntity->state_user_id = $state_user_id;
      $transactionCreationEntity->amount = $this->getAmount();
      $transactionCreationEntity->ident_hash = $this->getIdentHash();
      
      if(!$this->transactionCreationsTable->save($transactionCreationEntity)) {
        $this->addError('TransactionCreation::save', 'error saving transactionCreation with errors: ' . json_encode($transactionCreationEntity->getErrors()));
        return false;
      }
            
      return true;
    }
            
}
