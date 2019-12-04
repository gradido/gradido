<?php

namespace Model\Transactions;

//use App\Model\Transactions\TransactionBase;

class TransactionTransfer extends TransactionBase {
    private $protoTransactionTransfer;
    private $receiver_pubkey_hex;
    private $sender_pubkey_hex;
    
    public function __construct($protoTransactionTransfer) {
      $this->protoTransactionTransfer = $protoTransactionTransfer;
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
      $this->addError('TransactionTransfer::validate', 'not implemented yet');
      return false;
      //return true;
    }
    
    public function save($transaction_id, $firstPublic) {
      $this->addError('TransactionTransfer::save', 'not implemented yet');
      return false;
      //return true;
    }
}

