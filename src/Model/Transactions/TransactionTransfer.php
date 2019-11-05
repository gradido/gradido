<?php

namespace Model\Transactions;

//use App\Model\Transactions\TransactionBase;

class TransactionTransfer extends TransactionBase {
    private $protoTransactionTransfer;
    
    public function __construct($protoTransactionTransfer) {
      $this->protoTransactionTransfer = $protoTransactionTransfer;
    }
    
    public function validate($sigPairs) {
      return true;
    }
    
    public function save($transaction_id, $firstPublic) {
      return true;
    }
}

