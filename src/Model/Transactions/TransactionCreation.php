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
      
      //$identHashBin = sprintf("%0d", $this->getIdentHash());
      // padding with zero in case hash is smaller than 32 bytes, static length binary field in db
      $identHashBin = pack('a32', $this->getIdentHash());
      
      $existingCreations = $this->transactionCreationsTable
              ->find('all')
              ->group('ident_hash')
              ->where(['ident_hash' => $identHashBin]);
      $existingCreations->select(['amount_sum' => $existingCreations->func()->sum('amount')]);
      $existingCreations->matching('Transactions', function ($q) {
          return $q->where(['EXTRACT(YEAR_MONTH FROM Transactions.received) LIKE EXTRACT(YEAR_MONTH FROM NOW())']);
      });
      //debug($existingCreations);
      if($existingCreations->count() > 0) {
        //var_dump($existingCreations->toArray());
        //echo "amount sum: " . $existingCreations->first()->amount_sum . "\n"; 
        if($this->getAmount() + $existingCreations->first()->amount_sum > 10000000) {
          $this->addError('TransactionCreation::validate', 'Creation more than 1000 gr per Month not allowed');
          return false;
        }
      } 
      //die("\n");
      return true;
    }
    
    public function save($transaction_id, $firstPublic) 
    {
      
      $transactionCreationEntity = $this->transactionCreationsTable->newEntity();
      $transactionCreationEntity->transaction_id = $transaction_id;
      
      // state user id
      //$state_user_id = $this->getStateUserId($firstPublic);
      $receiverUser = $this->getStateUserId($this->getReceiverPublic());
      if(!$receiverUser) {
        $this->addError('TransactionCreation::save', 'couldn\'t get state user id');
        return false;
      }
      $transactionCreationEntity->state_user_id = $receiverUser;
      $transactionCreationEntity->amount = $this->getAmount();
      $transactionCreationEntity->ident_hash = $this->getIdentHash();
      
      if(!$this->transactionCreationsTable->save($transactionCreationEntity)) {
        $this->addError('TransactionCreation::save', 'error saving transactionCreation with errors: ' . json_encode($transactionCreationEntity->getErrors()));
        return false;
      }
      
      // update state balance
      if(!$this->updateStateBalance($receiverUser, $this->getAmount())) {
        return false;
      }
      
      return true;
    }
            
}
