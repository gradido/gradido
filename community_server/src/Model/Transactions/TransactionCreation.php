<?php

namespace Model\Transactions;

//use App\Model\Transactions\TransactionBase;

use Cake\Core\Configure;
use Cake\Mailer\Email;
use Cake\I18n\FrozenTime;
use Cake\I18n\FrozenDate;


class TransactionCreation extends TransactionBase {
  
    private $protoTransactionCreation;
    private $transactionCreationsTable;
    private $receiver_pubkey_hex;
    
    public function __construct($protoTransactionCreation) {
      $this->protoTransactionCreation = $protoTransactionCreation;
      $this->transactionCreationsTable = $this->getTable('transaction_creations');
      $this->receiver_pubkey_hex = bin2hex($this->getReceiverPublic());
    }
    
    public function getProto() {
      return $this->protoTransactionCreation;
    }
    
    static public function build($amount, $memo, $receiver_public_hex, $targetDate = null) 
    {    
        $receiver = new \Proto\Gradido\TransferAmount();
        $receiver->setAmount($amount);
        //$this->receiver_pubkey_hex = $receiver_public_hex;
        if(strlen($receiver_public_hex) != 64) {
          return ['state' => 'error', 'msg' => 'invalid pubkey'];
        }
        $pubKeyBin = hex2bin($receiver_public_hex);
        $receiver->setPubkey($pubKeyBin);
        //var_dump($requestData);

        $creationDate = new \Proto\Gradido\TimestampSeconds();
        $creationDate->setSeconds(time());

        $transactionBody = new \Proto\Gradido\TransactionBody();
        $transactionBody->setMemo($memo);
        $transactionBody->setCreated($creationDate);
        

        $transaction = new \Proto\Gradido\GradidoTransaction();
        $transaction->setReceiver($receiver);
        //echo "target date: ";
        //var_dump($targetDate);
        //die('die');
        if($targetDate) {
          $targetDateTimestamp = new \Proto\Gradido\TimestampSeconds();
          $targetDateTimestamp->setSeconds($targetDate->getTimestamp());
          //var_dump($targetDateTimestamp); die('target');
          $transaction->setTargetDate($targetDateTimestamp);
        }
        
        $transactionBody->setCreation($transaction);
        return ['state' => 'success', 'transactionBody' => $transactionBody];
    }
    
    
    public function getAmount() {
      return $this->protoTransactionCreation->getRecipiant()->getAmount();
    }
    
    public function getReceiverPublic() {
      return $this->protoTransactionCreation->getRecipiant()->getPubkey();
    }
    
    public function getReceiverUser() {
        return $this->getStateUserFromPublickey($this->getReceiverPublic());
    }
    public function getTargetDate() {
        return new FrozenDate($this->protoTransactionCreation->getTargetDate()->getSeconds());
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
      
      
      /////////////// new validation, not more than 1K GDD per month via target_date ///////////////////////////
      $existingCreations2 = $this->transactionCreationsTable
              ->find('all')
              ->select(['amount', 'state_user_id', 'target_date'])
              ->contain(['StateUsers' => ['fields' => ['StateUsers.public_key']]]);
      $q = $existingCreations2;
      $targetDate = $this->protoTransactionCreation->getTargetDate();
      
      $targetDateFrozen = new FrozenDate($targetDate->getSeconds());
      $targetDateMonthYearConcat = $targetDateFrozen->format('Ym');
      
      $existingCreations2->where([
                  'target_date IS NOT' => NULL,
                  'EXTRACT(YEAR_MONTH FROM target_date) LIKE ' => $targetDateMonthYearConcat,
                  ]);
      
     $newSum2 = $this->getAmount();
     $receiverEmail = '';
     foreach($existingCreations2 as $creation) {
        $keyHex = bin2hex(stream_get_contents($creation->state_user->public_key));
        //echo "\ncompare \n$keyHex\nwith: \n". $this->receiver_pubkey_hex."\n";
        if($keyHex == $this->receiver_pubkey_hex) {
          $newSum2 += $creation->amount;
          $receiverEmail = $creation->state_user->email;
        }
       //$newSum2 += $creation->amount;
     }
     
     /*if(!$existingCreations2->count()) {
        if($newSum > 30000000) {
          $this->addError('TransactionCreation::validate', 'Creation more than 1.000 GDD per Month (3 Month) not allowed');
          return false;
        }
     } else {*/
       if($newSum2 <= 0) {
           $this->addError(
                'TransactionCreation::validate',
                'Creation less than 0 GDD per Month for '. $receiverEmail .' in target_date not allowed'   
           );
       }
       if($newSum2 > 10000000) {
         $this->addError(
                 'TransactionCreation::validate',
                 'Creation more than 1.000 GDD per Month for '. $receiverEmail .' in target_date not allowed'
         );
         return false;
       //}
     }
     
      return true;
    }

    public function checkWithDb($dbTransaction)
    {
       $functionName = 'TransactionCreations::checkWithDb';
       $transactionCreationsTable = $this->getTable('transactionCreations');
       $transactionCreationQuery = $transactionCreationsTable->find('all')->where(['transaction_id' => $dbTransaction->id]);
       if($transactionCreationQuery->count() == 0) {
         $this->addError($functionName, 'cannot find transaction creation for transaction id: ' . $dbTransaction->id);
         return false;
       }
       $transactionCreationDb = $transactionCreationQuery->first();
       if($this->getTargetDate() != $transactionCreationDb->target_date) {
         $this->addError($functionName, 'target dates don\'t match');
         return false;
       }
       if($this->getAmount() != $transactionCreationDb->amount) {
         $this->addError($functionName, 'amount don\'t match: ' . json_encode([
           'stored' => $transactionCreationDb->amount,
           'received' => $this->getAmount()
         ]));
         return false;
       }
       $recipientUser = $this->getReceiverUser();
       if(!$recipientUser) {
         $this->addError($functionName, 'recipient user not found with pubkey: ' . \Sodium\bin2hex(getReceiverPublic()));
         return false;
       }
       if($recipientUser->id != $transactionCreationDb->state_user_id) {
         $this->addError($functionName, 'recipient user don\' match');
         return false;
       }
       return true;
    }
    
    public function save($transaction_id, $firstPublic, $received) 
    {
      $stateBalancesTable = self::getTable('stateBalances');
      
      $transactionCreationEntity = $this->transactionCreationsTable->newEntity();
      $transactionCreationEntity->transaction_id = $transaction_id;
      
      // state user id
      //$state_user_id = $this->getStateUserId($firstPublic);
      $receiverUserId = $this->getStateUserId($this->getReceiverPublic());
      if(!$receiverUserId) {
        $this->addError('TransactionCreation::save', 'couldn\'t get state user id');
        return false;
      }
      
      $transactionCreationEntity->state_user_id = $receiverUserId;
      $transactionCreationEntity->amount = $this->getAmount();
      $transactionCreationEntity->target_date = $this->protoTransactionCreation->getTargetDate()->getSeconds();
      $target_date = new FrozenTime($transactionCreationEntity->target_date);
      
      //$decayed_balance = $stateBalancesTable->calculateDecay($this->getAmount(), $target_date, $received);
      $balance = $this->getAmount();
      
      if(!$this->transactionCreationsTable->save($transactionCreationEntity)) {
        $this->addError('TransactionCreation::save', 'error saving transactionCreation with errors: ' . json_encode($transactionCreationEntity->getErrors()));
        return false;
      }
      
      // update state balance
      $final_balance = $this->updateStateBalance($receiverUserId, $balance, $received);
      if(false === $final_balance) {
        return false;
      }
      
      // decay is a virtual field which is calculated from amount and now() - record_date
      if(!$this->addStateUserTransaction($receiverUserId, $transaction_id, 1, $balance, $received)) {
          return false;
      }
      
      return true;
    }
    
    public function sendNotificationEmail($memo) 
    {
        $disable_email = Configure::read('disableEmail', false);  
        if($disable_email) return true;
      // send notification email
        $receiverUserId = $this->getStateUserId($this->getReceiverPublic());
        $receiverUser = $this->getStateUser($receiverUserId);
        $noReplyEmail = Configure::read('noReplyEmail');
        
        try {
          $email = new Email();
          $emailViewBuilder = $email->viewBuilder();
          $emailViewBuilder->setTemplate('notificationCreation')
                           ->setVars(['user' => $receiverUser, 'gdd_cent' => $this->getAmount(), 'memo' => $memo]);
          $receiverNames = $receiverUser->getNames();
          if($receiverNames == '' || $receiverUser->email == '') {
            $this->addError('TransactionCreation::sendNotificationEmail', 'to email is empty for user: ' . $receiverUser->id);
            return false;
          }
          $email->setFrom([$noReplyEmail => 'Gradido (nicht antworten)'])
                ->setTo([$receiverUser->email => $receiverUser->getNames()])
                ->setSubject(__('Gradido Schöpfung erhalten'))
                ->send();
        } catch(Exception $e) {
//          $this->addError('TransactionCreation::sendNotificationEmail', 'error sending notification email: ' . $e->getMessage());
            $this->addWarning('TransactionCreation::sendNotificationEmail', 'error sending notification email: ' . $e->getMessage());
          return false;
        }
      return true;
    }
 
    static public function fromEntity($transactionCreationEntity)
    {
      $protoCreation = new \Proto\Gradido\GradidoCreation();
      
      //var_dump($transactionCreationEntity);
      $stateUsersTable = $this->getTable('state_users');
      //return new TransactionCreation($protoCreation);
      $userId = $transactionCreationEntity->state_user_id;
      
      
      $stateUser = $stateUsersTable->get($userId);
      
      
      $receiverAmount = new \Proto\Gradido\TransferAmount();
      $receiverAmount->setPubkey(stream_get_contents($stateUser->public_key));
      $receiverAmount->setAmount($transactionCreationEntity->amount);
      
      $protoCreation->setReceiver($receiverAmount);
      
      // TODO: add target_date
      // function currently not used, maybe can even be deleted
      
      //echo "receiver amount: check<br>";
      //$identHashBytes = stream_get_contents($transactionCreationEntity->ident_hash);
      
      // intval
      //$protoCreation->setIdentHash(intval($identHashBytes));
      //$protoCreation->setIdentHash(self::DRMakeStringHash($stateUser->email));
      return new TransactionCreation($protoCreation);
    }
}
