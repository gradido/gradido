<?php

namespace Model\Transactions;

//use App\Model\Transactions\TransactionBase;

use Cake\ORM\TableRegistry;
use Cake\Core\Configure;
use Cake\Mailer\Email;
use Cake\I18n\FrozenDate;


class TransactionCreation extends TransactionBase {
  
    private $protoTransactionCreation;
    private $transactionCreationsTable;
    private $receiver_pubkey_hex;
    
    public function __construct($protoTransactionCreation) {
      $this->protoTransactionCreation = $protoTransactionCreation;
      $this->transactionCreationsTable = TableRegistry::getTableLocator()->get('transaction_creations');
      $this->receiver_pubkey_hex = bin2hex($this->getReceiverPublic());
    }
    
    public function getProto() {
      return $this->protoTransactionCreation;
    }
    
    static public function build($amount, $memo, $receiver_public_hex, $ident_hash, $targetDate = null) 
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
        //echo "target date: ";
        //var_dump($targetDate);
        //die('die');
        if($targetDate) {
          $targetDateTimestamp = new \Model\Messages\Gradido\TimestampSeconds();
          $targetDateTimestamp->setSeconds($targetDate->getTimestamp());
          //var_dump($targetDateTimestamp); die('target');
          $transaction->setTargetDate($targetDateTimestamp);
        }
        
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
      
      //////////  old validation not more than 3k GDD for 3 Month  ///////////////
      /*$existingCreations = $this->transactionCreationsTable
              ->find('all')
              ->select(['amount', 'state_user_id', 'target_date'])
              ->contain(['StateUsers' => ['fields' => ['StateUsers.public_key']]])
              ->where(['target_date' => NULL]);
      //$targetDate = $this->protoTransactionCreation->getTargetDate();
      //echo "choose existing transactions<br>";
      //$existingCreations->where([$q->func()->extract('YEAR_MONTH', 'target_date') . ' LIKE ' . $q->func()->extract('YEAR_MONTH', $targetDate)]);
      //        ->where(['EXTRACT(YEAR_MONTH FROM target_date) LIKE EXTRACT(YEAR_MONTH FROM']);
      // uncomment because ident hash didn't work at the moment
              //->where(['ident_hash' => $identHashBin]);
      //$existingCreations->select(['amount_sum' => $existingCreations->func()->sum('amount')]);
      
      $existingCreations->matching('Transactions', function ($q) {
        
          return $q->where(
                  ['OR' => 
                      ['EXTRACT(YEAR_MONTH FROM Transactions.received) LIKE EXTRACT(YEAR_MONTH FROM NOW())',
                       'EXTRACT(YEAR_MONTH FROM DATE_ADD(Transactions.received, INTERVAL 2 MONTH)) LIKE EXTRACT(YEAR_MONTH FROM NOW())']
                  ])->select('received');
         
      
      });
      //debug($existingCreations);
      //echo "after choose existing transactions<br>";
      $newSum = $this->getAmount();
      //var_dump($existingCreations->toArray());
      foreach($existingCreations as $creation) {
        $keyHex = bin2hex(stream_get_contents($creation->state_user->public_key));
        //echo "\ncompare \n$keyHex\nwith: \n". $this->receiver_pubkey_hex."\n";
        if($keyHex == $this->receiver_pubkey_hex) {
          $newSum += $creation->amount;
        }
      }
      
      
      if($newSum > 30000000) {
        $this->addError('TransactionCreation::validate', 'Creation more than 1.000 GDD per Month (3 Month) not allowed');
        return false;
      }//*/
      
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
    
    public function save($transaction_id, $firstPublic) 
    {
      
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
      $transactionCreationEntity->ident_hash = $this->getIdentHash();
      $transactionCreationEntity->target_date = $this->protoTransactionCreation->getTargetDate()->getSeconds();
      
      if(!$this->transactionCreationsTable->save($transactionCreationEntity)) {
        $this->addError('TransactionCreation::save', 'error saving transactionCreation with errors: ' . json_encode($transactionCreationEntity->getErrors()));
        return false;
      }
      
      // update state balance
      if(false === $this->updateStateBalance($receiverUserId, $this->getAmount(), $transactionCreationEntity->target_date)) {
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
          $this->addError('TransactionCreation::sendNotificationEmail', 'error sending notification email: ' . $e->getMessage());
          return false;
        }
      return true;
    }
 
    static public function fromEntity($transactionCreationEntity)
    {
      $protoCreation = new \Model\Messages\Gradido\TransactionCreation();
      
      //var_dump($transactionCreationEntity);
      $stateUsersTable = TableRegistry::getTableLocator()->get('state_users');
      //return new TransactionCreation($protoCreation);
      $userId = $transactionCreationEntity->state_user_id;
      
      
      $stateUser = $stateUsersTable->get($userId);
      
      
      $receiverAmount = new \Model\Messages\Gradido\ReceiverAmount();
      $receiverAmount->setEd25519ReceiverPubkey(stream_get_contents($stateUser->public_key));
      
      $receiverAmount->setAmount($transactionCreationEntity->amount);
      
      $protoCreation->setReceiverAmount($receiverAmount);
      
      //echo "receiver amount: check<br>";
      //$identHashBytes = stream_get_contents($transactionCreationEntity->ident_hash);
      
      // intval
      //$protoCreation->setIdentHash(intval($identHashBytes));
      $protoCreation->setIdentHash(self::DRMakeStringHash($stateUser->email));
      return new TransactionCreation($protoCreation);
    }
}
