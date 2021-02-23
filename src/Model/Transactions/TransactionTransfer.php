<?php

namespace Model\Transactions;

//use App\Model\Transactions\TransactionBase;
use Cake\ORM\TableRegistry;
use Cake\Core\Configure;
use Cake\Mailer\Email;

class TransactionTransfer extends TransactionBase {
    private $protoTransactionTransfer;
    
    public function __construct($protoTransactionTransfer) {
      $this->protoTransactionTransfer = $protoTransactionTransfer;
    }
    
    public function getProto() {
      return $this->protoTransactionTransfer;
    }
    
    static public function build($amount, $memo, $receiver_public_hex, $sender_public_hex) 
    {    
      // repeated SenderAmount senderAmounts = 1;
      // repeated ReceiverAmount receiverAmounts = 2;
        $receiver = new \Model\Messages\Gradido\ReceiverAmount();
        $sender   = new \Model\Messages\Gradido\SenderAmount();
        $receiver->setAmount($amount);
        $sender->setAmount($amount);
        
        if(strlen($receiver_public_hex) != 64) {
          return ['state' => 'error', 'msg' => 'invalid receiver pubkey'];
        }
        if(strlen($sender_public_hex) != 64) {
          return ['state' => 'error', 'msg' => 'invalid sender pubkey'];
        }
        $receiverPubKeyBin = hex2bin($receiver_public_hex);
        $receiver->setEd25519ReceiverPubkey($receiverPubKeyBin);
        
        $senderPubKeyBin = hex2bin($sender_public_hex);
        $sender->setEd25519SenderPubkey($senderPubKeyBin);
        //var_dump($requestData);

        $creationDate = new \Model\Messages\Gradido\TimestampSeconds();
        $creationDate->setSeconds(time());

        $transactionBody = new \Model\Messages\Gradido\TransactionBody();
        $transactionBody->setMemo($memo);
        $transactionBody->setCreated($creationDate);

        $transaction = new \Model\Messages\Gradido\Transfer();
        $transaction->setReceiverAmounts([$receiver]);
        $transaction->setSenderAmounts([$sender]);
        $transactionBody->setTransfer($transaction);
        return ['state' => 'success', 'transactionBody' => $transactionBody];
    }
    
    public function validate($sigPairs) {
      //$this->addError('TransactionTransfer::validate', 'not implemented yet');
      //return false;
      //$time = microtime(true);
      static $functionName = 'TransactionCreation::validate';
      /*
       * // check signature(s)
        foreach($sigPairs as $sigPair) {
          //echo 'sig Pair: '; var_dump($sigPair); echo "<br>";
          $pubkey = $sigPair->getPubKey();
          $signature = $sigPair->getEd25519();
          if (!\Sodium\crypto_sign_verify_detached($signature, $bodyBytes, $pubkey)) {
              $this->addError('Transaction::validate', 'signature for key ' . bin2hex($pubkey) . ' isn\'t valid ' );
              return false;
          } 
        }
       */
      $sigPubHexs = [];
      foreach($sigPairs as $sigPair) {
          //echo 'sig Pair: '; var_dump($sigPair); echo "<br>";
          $pubkey = bin2hex($sigPair->getPubKey());
          $hash = TransactionCreation::DRMakeStringHash($pubkey);
          if(!isset($sigPubHexs[$hash])) {
            $sigPubHexs[$hash] = [$pubkey];
          } else {
            array_push($sigPubHexs[$hash], $pubkey);
          }
          //array_push($sigPubHexs, $pubkey);    
      }
      
      $stateUsersTable = TableRegistry::getTableLocator()->get('state_users');
      $senderAmounts = $this->protoTransactionTransfer->getSenderAmounts();
      $senderSum = 0;
      $receiverSum = 0;
      
      $senderPublics = [];
      foreach($senderAmounts as $i => $senderAmount) {
        $senderPublic = $senderAmount->getEd25519SenderPubkey();
        $senderPublicHex = bin2hex($senderPublic);
        array_push($senderPublics, $senderPublic);
        
        if(strlen($senderPublicHex) != 64) {
          $this->addError($functionName, 'invalid sender public key');
          return false;
        }
        // check if signature exist for sender
        $hash = TransactionCreation::DRMakeStringHash($senderPublicHex);
        if(!isset($sigPubHexs[$hash]) || in_array($senderPublicHex, $sigPubHexs[$hash]) === FALSE) {
          $this->addError($functionName, 'missing signature for sender');
          return false;
        }
        // check if sender has enough Gradido
        $amount = $senderAmount->getAmount();
        $user = $stateUsersTable
                  ->find('all')
                  ->select(['id'])
                  ->where(['public_key' => $senderPublic])
                  ->contain(['StateBalances' => ['fields' => ['amount', 'state_user_id']]])->first();
        if(!$user) {
          $this->addError($functionName, 'couldn\'t find sender ' . $i .' in db' );
          return false;
        }
        //var_dump($user);
        if(intval($user->state_balances[0]->amount) < intval($amount)) {
          $this->addError($functionName, 'sender ' . $i . ' hasn\t enough GDD');
          return false;
        }
        $senderSum += $amount;
      }
      $uniqueSenderPublics = array_unique($senderPublics);
      if(count($senderPublics) !== count($uniqueSenderPublics)) {
        $this->addError($functionName, 'duplicate sender public key');
        return false;
      }
      
      $receiverAmounts = $this->protoTransactionTransfer->getReceiverAmounts();
      $receiverPublics = [];
      foreach($receiverAmounts as $reveiverAmount) {
        if(strlen($reveiverAmount->getEd25519ReceiverPubkey()) != 32) {
          $this->addError($functionName, 'invalid receiver public key');
          return false;
        }
        array_push($receiverPublics, $reveiverAmount->getEd25519ReceiverPubkey());
        $receiverSum += $reveiverAmount->getAmount();
      }
      $uniqueReceiverPublic = array_unique($receiverPublics);
      if(count($uniqueReceiverPublic) !== count($receiverPublics)) {
        $this->addError($functionName, 'duplicate receiver public key');
        return false;
      }
      $uniquePublics = array_unique(array_merge($receiverPublics, $senderPublics));
      if(count($uniquePublics) !== count($senderPublics) + count($receiverPublics)) {
        // means at least one sender is the same as one receiver
        $this->addError($functionName, 'duplicate public in sender and receiver');
        return false;
      }
      if($senderSum !== $receiverSum) {
        $this->addError($functionName, 'sender amount doesn\'t match receiver amount');
        return false;
      }
      //die("\n");
      return true;
    }
    
    public function save($transaction_id, $firstPublic, $received) {
      
      static $functionName = 'TransactionCreation::save';
      
      if(count($this->protoTransactionTransfer->getSenderAmounts()) !== 1) {
        $this->addError($functionName, 'not more than one sender currently supported');
        return false;
      }
      $senderAmount = $this->protoTransactionTransfer->getSenderAmounts()[0];
      
      if(count($this->protoTransactionTransfer->getReceiverAmounts()) !== 1) {
        $this->addError($functionName, 'not more than one receiver currently supported');
        return false;
      }
      $receiverAmount = $this->protoTransactionTransfer->getReceiverAmounts()[0];
      $transactionTransferTable = TableRegistry::getTableLocator()->get('TransactionSendCoins');
      
      $senderUserId = $this->getStateUserId($senderAmount->getEd25519SenderPubkey());
      $receiverUserId = $this->getStateUserId($receiverAmount->getEd25519ReceiverPubkey());
      
      if($senderUserId === NULL || $receiverUserId === NULL) {
        return false;
      }
      
      $finalSenderBalance = $this->updateStateBalance($senderUserId, -$senderAmount->getAmount(), $received);
      if(false === $finalSenderBalance) {
        return false;
      }
      if(false === $this->updateStateBalance($receiverUserId, $receiverAmount->getAmount(), $received)) {
        return false;
      }
      
      $transactionTransferEntity = $transactionTransferTable->newEntity();
      $transactionTransferEntity->transaction_id = $transaction_id;
      $transactionTransferEntity->state_user_id  = $senderUserId;
      $transactionTransferEntity->receiver_public_key = $receiverAmount->getEd25519ReceiverPubkey();
      $transactionTransferEntity->receiver_user_id = $receiverUserId;
      $transactionTransferEntity->amount = $senderAmount->getAmount();
      $transactionTransferEntity->sender_final_balance = $finalSenderBalance;
      
      if(!$transactionTransferTable->save($transactionTransferEntity)) {
        $this->addError($functionName, 'error saving transactionSendCoins with errors: ' . json_encode($transactionTransferEntity->getErrors()));
        return false;
      }
      
      
      
      
      //$this->addError('TransactionTransfer::save', 'not implemented yet');
      //return false;
      return true;
    }
    
    public function sendNotificationEmail($memo)
    {
      // send notification email
      
      $senderAmount = $this->protoTransactionTransfer->getSenderAmounts()[0];
      $receiverAmount = $this->protoTransactionTransfer->getReceiverAmounts()[0];
      $senderUserId = $this->getStateUserId($senderAmount->getEd25519SenderPubkey());
      $receiverUserId = $this->getStateUserId($receiverAmount->getEd25519ReceiverPubkey());
      
      $receiverUser = $this->getStateUser($receiverUserId);
      $senderUser   = $this->getStateUser($senderUserId);
      $serverAdminEmail = Configure::read('ServerAdminEmail');

      try {
        $email = new Email();
        $emailViewBuilder = $email->viewBuilder();
        $emailViewBuilder->setTemplate('notificationTransfer')
                         ->setVars(['receiverUser' => $receiverUser,
                                    'senderUser' => $senderUser,
                                    'gdd_cent' => $receiverAmount->getAmount(), 
                                    'memo' => $memo]);
        $receiverNames = $receiverUser->getNames();
        if($receiverNames == '' || $receiverUser->email == '') {
            $this->addError('TransactionCreation::sendNotificationEmail', 'to email is empty for user: ' . $receiverUser->id);
            return false;
          }
        $email->setFrom([$serverAdminEmail => $senderUser->getNames() . ' via Gradido Community'])
              ->setTo([$receiverUser->email => $receiverUser->getNames()])
              ->setReplyTo($senderUser->email)
              ->setSubject(__('Gradidos erhalten'))
              ->send();
      } catch(Exception $e) {
        $this->addError('TransactionTransfer::sendNotificationEmail', 'error sending notification email: ' . $e->getMessage());
        return false;
      }
      return true;
    }
    
    static public function fromEntity($transactionTransferEntity)
    {
      $protoTransfer = new \Model\Messages\Gradido\Transfer();
      
      $stateUsersTable = TableRegistry::getTableLocator()->get('state_users');
      
      
      return new TransactionTransfer($protoTransfer);
    }
}

