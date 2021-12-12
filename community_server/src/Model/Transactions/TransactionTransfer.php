<?php

namespace Model\Transactions;

//use App\Model\Transactions\TransactionBase;
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

    public function getTransfer() {
        if($this->protoTransactionTransfer->hasLocal()) {
          return $this->protoTransactionTransfer->getLocal();
        } else if($this->protoTransactionTransfer->hasInbound()) {
          return $this->protoTransactionTransfer->getInbound()->getTransfer();
        } else if($this->protoTransactionTransfer->hasOutbound()) {
          return $this->protoTransactionTransfer->getOutbound()->getTransfer();
        }
        return null;      
    }
    // at the moment the community db support only one community
    // so on cross group transaction it can be either the sender or the recipiant belonging to this community
    public function isBelongSenderToCommunity() {
        if($this->protoTransactionTransfer->hasInbound()) {
          return false;
        }
        return true;
    }
    public function isBelongRecipiantToCommunity() {
        if($this->protoTransactionTransfer->hasOutbound()) {
          return false;
        }
        return true;
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
        $local_transfer->setRecipiant($receiverPubKeyBin);
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
      
        $stateUsersTable = $this->getTable('state_users');
        $local_transfer = $this->getTransfer();
        if(!$local_transfer) {
          $this->addError($functionName, "error no local transfer found!");
          return false;
        }
        $sender = $local_transfer->getSender();
        $amount = $sender->getAmount();
        if($amount < 0) {
            $this->addError($functionName, 'negative amount not supported');
            return false;
        }

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
        // only if it not a inbound cross group transaction
        if($this->isBelongSenderToCommunity()) {
            $user = $stateUsersTable
                      ->find('all')
                      ->select(['id'])
                      ->where(['public_key' => $senderPublic])
                      ->contain(['StateBalances' => ['fields' => ['amount', 'state_user_id']]])->first();
            if(!$user) {
              $this->addError($functionName, 'couldn\'t find sender in db' );
              return false;
            }
            if(intval($user->state_balances[0]->amount) < intval($amount)) {
              $this->addError($functionName, 'sender hasn\t enough GDD');
              return false;
            }
        }
      
        $receiver_public_key = $local_transfer->getRecipiant();
        if(strlen($receiver_public_key) != 32) {
          $this->addError($functionName, 'invalid receiver public key');
          return false;
        }
        if($this->isBelongRecipiantToCommunity()) {
            // check if receiver exist
            $receiver_user = $stateUsersTable->find('all')->select(['id'])->where(['public_key' => $receiver_public_key])->first();
            if(!$receiver_user) {
                $this->addError($functionName, 'couldn\'t find receiver in db' );
                return false;
            }
        }
        
        return true;
    }

    public function checkWithDb($dbTransaction)
    {
        $functionName = 'TransactionTransfer::checkWithDb';
        $transactionTransferTable = $this->getTable('TransactionSendCoins'); 
        $transactionSendCoinQuery = $transactionTransferTable->find('all')->where(['transaction_id' => $dbTransaction->id]);
        if($transactionSendCoinQuery->count() == 0) {
          $this->addError($functionName, 'no send coin transaction find for transaction id: ' . $dbTransaction->id);
          return false;
        }
        $transactionSendCoin = $transactionSendCoinQuery->first();
        if($transactionSendCoin->amount != $this->getAmount()) {
          $this->addError($functionName, 'amounts don\'t match');
          return false;
        }
        $senderPublicKeyDb = stream_get_contents($transactionSendCoin->sender_public_key);
        $local_transfer = $this->getTransfer();
        if($senderPublicKeyDb != $local_transfer->getSender()->getPubkey()) {
          $this->addError($functionName, 'sender public keys don\'t match');
          return false;
        }
        $recipiantPublicKeyDb = stream_get_contents($transactionSendCoin->receiver_public_key);
        if($recipiantPublicKeyDb != $local_transfer->getRecipiant()) {
          $this->addError($functionName, 'recipiant public keys don\t match');
          return false;
        }
        return true;

    }
    
    public function save($transaction_id, $firstPublic, $received) {
      
      static $functionName = 'TransactionTransfer::save';
      $local_transfer = $this->getTransfer();
      
      $senderAmount = $local_transfer->getSender();
      $receiver = $local_transfer->getRecipiant();
      
      $transactionTransferTable = $this->getTable('TransactionSendCoins');
      
      $senderUserId = NULL;
      $recipiantUserId = NULL;
      $finalSenderBalance = 0;
      if($this->isBelongSenderToCommunity()) {
          $senderUserId = $this->getStateUserId($senderAmount->getPubkey());
          if(NULL === $senderUserId) {
              $this->addError($functionName, 'sender user not found');
              return false;
          }
          if(!$this->updateStateBalance($senderUserId, -$senderAmount->getAmount(), $received)) {
              $this->addError($functionName, 'update state balance');
              $this->addError($functionName, 'amount: ' . $senderAmount->getAmount());
              return false;
          }
          if(!$this->addStateUserTransaction($senderUserId, $transaction_id, 2, -$senderAmount->getAmount(), $received)) {
            $this->addError($functionName, 'add state user transaction');
            return false;
        }
      }

      if($this->isBelongRecipiantToCommunity()) {
          $recipiantUserId = $this->getStateUserId($receiver);
          if(NULL === $recipiantUserId) {
            $this->addError($functionName, 'recipiant user not found');
             return false;
          }
          if(!$this->updateStateBalance($recipiantUserId, $senderAmount->getAmount(), $received)) {
            $this->addError($functionName, 'update state balance');
             return false;
          }
          if(!$this->addStateUserTransaction($recipiantUserId, $transaction_id, 2, $senderAmount->getAmount(), $received)) {
            $this->addError($functionName, 'add state user transaction');
            return false;
          }
      }
      
      $transactionTransferEntity = $transactionTransferTable->newEntity();
      $transactionTransferEntity->transaction_id = $transaction_id;
      $transactionTransferEntity->state_user_id  = $senderUserId;
      $transactionTransferEntity->sender_public_key = $senderAmount->getPubkey();
      $transactionTransferEntity->receiver_public_key = $receiver;
      $transactionTransferEntity->receiver_user_id = $recipiantUserId;
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
       $disable_email = Configure::read('disableEmail', false);  
       if($disable_email || !$this->isBelongRecipiantToCommunity()) return true;
        
      $local_transfer = $this->getTransfer();
      $sender = $local_transfer->getSender();
      $senderAmount = $sender->getAmount();
      $senderUser = $this->getStateUserFromPublickey($sender->getPubkey());
      $recipiantUser = $this->getStateUserFromPublickey($local_transfer->getRecipiant());
      
      $serverAdminEmail = Configure::read('ServerAdminEmail');

      try {
        $email = new Email();
        $emailViewBuilder = $email->viewBuilder();
        $emailViewBuilder->setTemplate('notificationTransfer')
                         ->setVars(['receiverUser' => $recipiantUser,
                                    'senderUser' => $senderUser,
                                    'senderPublicKey' => bin2hex($sender->getPubkey()),
                                    'gdd_cent' => $senderAmount, 
                                    'memo' => $memo]);
        $recipiantNames = $recipiantUser->getNames();
        if($recipiantNames == '' || $recipiantUser->email == '') {
            $this->addError('TransactionCreation::sendNotificationEmail', 'to email is empty for user: ' . $recipiantUser->id);
            return false;
          }
        $noReplyEmail = Configure::read('noReplyEmail');
        $email->setFrom([$noReplyEmail => 'Gradido (nicht antworten)'])
              ->setTo([$recipiantUser->email => $recipiantUser->getNames()])
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
        $local_transfer = $this->getTransfer();
        return $this->getStateUserFromPublickey($local_transfer->getSender()->getPubkey());
    }
    
    public function getReceiverUser()
    {
        $local_transfer = $this->getTransfer();
        return $this->getStateUserFromPublickey($local_transfer->getRecipiant());
    }
    
    public function getAmount()
    {
        $local_transfer = $this->getTransfer();
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

