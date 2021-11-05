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
        
        $sender = new \Proto\Gradido\TransferAmount();
        $sender->setAmount($amount);
        
        if(strlen($receiver_public_hex) != 64) {
          return ['state' => 'error', 'msg' => 'invalid receiver pubkey'];
        }
        if(strlen($sender_public_hex) != 64) {
          return ['state' => 'error', 'msg' => 'invalid sender pubkey'];
        }
        $receiverPubKeyBin = hex2bin($receiver_public_hex);
        
        $senderPubKeyBin = hex2bin($sender_public_hex);
        $sender->setPubkey($senderPubKeyBin);
        //var_dump($requestData);

        $creationDate = new \Proto\Gradido\TimestampSeconds();
        $creationDate->setSeconds(time());

        $transactionBody = new \Proto\Gradido\TransactionBody();
        $transactionBody->setMemo($memo);
        $transactionBody->setCreated($creationDate);

        $transfer = new \Proto\Gradido\GradidoTransfer();
        $local_transfer = new \Proto\Gradido\LocalTransfer();
        $local_transfer->setReceiver($receiverPubKeyBin);
        $local_transfer->setSender($sender);
        $transfer->setLocal($local_transfer);
        $transactionBody->setTransfer($transfer);
        return ['state' => 'success', 'transactionBody' => $transactionBody];
    }
    
    public function validate($sigPairs) {
        //$this->addError('TransactionTransfer::validate', 'not implemented yet');
        //return false;
        //$time = microtime(true);
        static $functionName = 'TransactionTransfer::validate';
        
        $sigPubHexs = [];
        foreach($sigPairs as $sigPair) 
        {
            $pubkey = $sigPair->getPubKey();
            $pubkey_hex = bin2hex($pubkey);
            //$hash = TransactionCreation::DRMakeStringHash($pubkey);
            $hash = $pubkey_hex;
            if(!isset($sigPubHexs[$hash])) {
              $sigPubHexs[$hash] = [$pubkey_hex];
            } else {
              array_push($sigPubHexs[$hash], $pubkey_hex);
            }
            //array_push($sigPubHexs, $pubkey);    
        }
      
        $stateUsersTable = TableRegistry::getTableLocator()->get('state_users');
        $local_transfer = $this->protoTransactionTransfer->getLocal();
        $sender = $local_transfer->getSender();
        $senderPublic = $sender->getPubkey();
        $senderPublicHex = bin2hex($senderPublic);
        if(strlen($senderPublicHex) != 64) {
            $this->addError($functionName, 'invalid sender public key');
            return false;
        }
        // check if signature exist for sender
        //$hash = TransactionCreation::DRMakeStringHash($senderPublicHex);
        $hash = $senderPublicHex;
        if(!isset($sigPubHexs[$hash]) || in_array($senderPublicHex, $sigPubHexs[$hash]) === FALSE) {
          $this->addError($functionName, 'missing signature for sender');
          return false;
        }
        // check if sender has enough Gradido
        $amount = $sender->getAmount();
        $user = $stateUsersTable
                  ->find('all')
                  ->select(['id'])
                  ->where(['public_key' => $senderPublic])
                  ->contain(['StateBalances' => ['fields' => ['amount', 'state_user_id']]])->first();
        if(!$user) {
          $this->addError($functionName, 'couldn\'t find sender in db' );
          return false;
        }
        //var_dump($user);
        if(intval($user->state_balances[0]->amount) < intval($amount)) {
          $this->addError($functionName, 'sender hasn\t enough GDD');
          return false;
        }
      
        $receiver_public_key = $local_transfer->getReceiver();
        if(strlen($receiver_public_key) != 32) {
          $this->addError($functionName, 'invalid receiver public key');
          return false;
        }
        // check if receiver exist
        $receiver_user = $stateUsersTable->find('all')->select(['id'])->where(['public_key' => $receiver_public_key])->first();
        if(!$receiver_user) {
            $this->addError($functionName, 'couldn\'t find receiver in db' );
            return false;
        }
        if($amount < 0) {
            $this->addError($functionName, 'negative amount not supported');
            return false;
        }
        return true;
    }
    
    public function save($transaction_id, $firstPublic, $received) {
      
      static $functionName = 'TransactionCreation::save';
      $local_transfer = $this->protoTransactionTransfer->getLocal();
      
      $senderAmount = $local_transfer->getSender();
      $receiver = $local_transfer->getReceiver();
      
      $transactionTransferTable = TableRegistry::getTableLocator()->get('TransactionSendCoins');
      
      $senderUserId = $this->getStateUserId($senderAmount->getPubkey());
      $receiverUserId = $this->getStateUserId($receiver);
      
      if($senderUserId === NULL || $receiverUserId === NULL) {
        return false;
      }
      
      $finalSenderBalance = $this->updateStateBalance($senderUserId, -$senderAmount->getAmount(), $received);
      if(false === $finalSenderBalance) {
        return false;
      }
      if(false === $this->updateStateBalance($receiverUserId, $senderAmount->getAmount(), $received)) {
        return false;
      }
      
      $transactionTransferEntity = $transactionTransferTable->newEntity();
      $transactionTransferEntity->transaction_id = $transaction_id;
      $transactionTransferEntity->state_user_id  = $senderUserId;
      $transactionTransferEntity->sender_public_key = $senderAmount->getPubkey();
      $transactionTransferEntity->receiver_public_key = $receiver;
      $transactionTransferEntity->receiver_user_id = $receiverUserId;
      $transactionTransferEntity->amount = $senderAmount->getAmount();
      $transactionTransferEntity->sender_final_balance = $finalSenderBalance;
      
      if(!$transactionTransferTable->save($transactionTransferEntity)) {
        $this->addError($functionName, 'error saving transactionSendCoins with errors: ' . json_encode($transactionTransferEntity->getErrors()));
        return false;
      }
      
      if(!$this->addStateUserTransaction($senderUserId, $transaction_id, 2, -$senderAmount->getAmount(), $received)) {
          return false;
      }
      if(!$this->addStateUserTransaction($receiverUserId, $transaction_id, 2, $senderAmount->getAmount(), $received)) {
          return false;
      }
      
      //$this->addError('TransactionTransfer::save', 'not implemented yet');
      //return false;
      return true;
    }
    
    public function sendNotificationEmail($memo)
    {
      // send notification email
       $disable_email = Configure::read('disableEmail', false);  
       if($disable_email) return true;
        
      $local_transfer = $this->protoTransactionTransfer->getLocal();
      $sender = $local_transfer->getSender();
      $senderAmount = $sender->getAmount();
      $senderUser = $this->getStateUserFromPublickey($sender->getPubkey());
      $receiverUser = $this->getStateUserFromPublickey($local_transfer->getReceiver());
      
      $serverAdminEmail = Configure::read('ServerAdminEmail');

      try {
        $email = new Email();
        $emailViewBuilder = $email->viewBuilder();
        $emailViewBuilder->setTemplate('notificationTransfer')
                         ->setVars(['receiverUser' => $receiverUser,
                                    'senderUser' => $senderUser,
                                    'gdd_cent' => $senderAmount, 
                                    'memo' => $memo]);
        $receiverNames = $receiverUser->getNames();
        if($receiverNames == '' || $receiverUser->email == '') {
            $this->addError('TransactionCreation::sendNotificationEmail', 'to email is empty for user: ' . $receiverUser->id);
            return false;
          }
        $noReplyEmail = Configure::read('noReplyEmail');
        $email->setFrom([$noReplyEmail => 'Gradido (nicht antworten)'])
              ->setTo([$receiverUser->email => $receiverUser->getNames()])
              ->setSubject(__('Gradidos erhalten'))
              ->send();
      } catch(Exception $e) {
        //$this->addError('TransactionTransfer::sendNotificationEmail', 'error sending notification email: ' . $e->getMessage());
          $this->addWarning('TransactionTransfer::sendNotificationEmail', 'error sending notification email: ' . $e->getMessage());
        return false;
      }
      return true;
    }
    
    public function getSenderUser()
    {
        $local_transfer = $this->protoTransactionTransfer->getLocal();
        return $this->getStateUserFromPublickey($local_transfer->getSender()->getPubkey());
    }
    
    public function getReceiverUser()
    {
        $local_transfer = $this->protoTransactionTransfer->getLocal();
        return $this->getStateUserFromPublickey($local_transfer->getReceiver());
    }
    
    public function getAmount()
    {
        $local_transfer = $this->protoTransactionTransfer->getLocal();
        $sender = $local_transfer->getSender();
        return $sender->getAmount();
    }
    
    static public function fromEntity($transactionTransferEntity)
    {
      $protoTransfer = new \Proto\Gradido\GradidoTransfer();
      
      $stateUsersTable = TableRegistry::getTableLocator()->get('state_users');
      
      
      return new TransactionTransfer($protoTransfer);
    }
}

