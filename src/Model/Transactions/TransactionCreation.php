<?php

namespace Model\Transactions;

//use App\Model\Transactions\TransactionBase;

use Cake\ORM\TableRegistry;

class TransactionCreation extends TransactionBase {
  
    private $protoTransactionCreation;
    private $transactionCreationsTable;
    private $receiver_pubkey_hex;
    
    public function __construct($protoTransactionCreation) {
      $this->protoTransactionCreation = $protoTransactionCreation;
      $this->transactionCreationsTable = TableRegistry::getTableLocator()->get('transaction_creations');
      $this->receiver_pubkey_hex = bin2hex($this->getReceiverPublic());
    }
    
    static public function build($amount, $memo, $receiver_public_hex, $ident_hash) 
    {    
        $receiver = new \Model\Messages\Gradido\ReceiverAmount();
        $receiver->setAmount($amount);
        //$this->receiver_pubkey_hex = $receiver_public_hex;
        if(strlen($receiver_public_hex) != 64) {
          return ['state' => 'error', 'msg' => 'invalid pubkey'];
        }
        $pubKeyBin = hex2bin($receiver_public_hex);
        $receiver->setEd25519ReceiverPubkey($pubKeyBin);
        //var_dump($requestData);

        $creationDate = new \Model\Messages\Gradido\TimestampSeconds();
        $creationDate->setSeconds(time());

        $transactionBody = new \Model\Messages\Gradido\TransactionBody();
        $transactionBody->setMemo($memo);
        $transactionBody->setCreated($creationDate);

        $transaction = new \Model\Messages\Gradido\TransactionCreation();
        $transaction->setReceiverAmount($receiver);
        $transaction->setIdentHash($ident_hash);
        $transactionBody->setCreation($transaction);
        return ['state' => 'success', 'transactionBody' => $transactionBody];
    }
    
    static protected function DRHashRotateLeft( $hash, $rotateBy )
    {
      return ($hash<<$rotateBy)|($hash>>(32-$rotateBy));
    }

    static public function DRMakeStringHash($str) 
    {
      $ret = 0;

      if( $str )
      {
        for ($i=0; $i < strlen($str); $i++)
        {
          $ret = TransactionCreation::DRHashRotateLeft($ret, 7) + ord($str{$i});
        }
      }
      return $ret;
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
      // ident hash isn't collision ressistent, it is for speed up search
      $identHashBin = pack('a32', $this->getIdentHash());
      
      $existingCreations = $this->transactionCreationsTable
              ->find('all')
              ->select(['amount', 'state_user_id'])
              ->contain(['StateUsers' => ['fields' => ['StateUsers.public_key']]])
              ->where(['ident_hash' => $identHashBin]);
      //$existingCreations->select(['amount_sum' => $existingCreations->func()->sum('amount')]);
      $existingCreations->select(['amount', 'state_user_id']);
      $existingCreations->matching('Transactions', function ($q) {
          return $q->where(['EXTRACT(YEAR_MONTH FROM Transactions.received) LIKE EXTRACT(YEAR_MONTH FROM NOW())']);
      });
      //debug($existingCreations);
      $newSum = $this->getAmount();
      //var_dump($existingCreations->toArray());
      foreach($existingCreations as $creation) {
        $keyHex = bin2hex(stream_get_contents($creation->state_user->public_key));
        //echo "\ncompare \n$keyHex\nwith: \n". $this->receiver_pubkey_hex."\n";
        if($keyHex == $this->receiver_pubkey_hex) {
          $newSum += $creation->amount;
        }
      }
      if($newSum > 10000000) {
        $this->addError('TransactionCreation::validate', 'Creation more than 1000 gr per Month not allowed');
        return false;
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
