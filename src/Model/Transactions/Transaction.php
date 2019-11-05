<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace Model\Transactions;

//use Model\Messages\Gradido\Transaction;
//use Model\Messages\Gradido\TransactionBody;

class Transaction extends TransactionBase {
  
    private $mProtoTransaction = null;
    private $mProtoTransactionBody = null;
    private $errors = [];
  
    public function __construct($base64Data) {
        $transactionBin = base64_decode($base64Data);
        if($transactionBin == FALSE) {
          //$this->addError('base64 decode failed');
          $this->addError(['data' => $base64Data, 'bin' => $transactionBin, 'msg' => 'base64 decode error']);
        } else {
          $this->mProtoTransaction = new \Model\Messages\Gradido\Transaction();
          $this->mProtoTransaction->mergeFromString($transactionBin);
          
          $this->mProtoTransactionBody = new \Model\Messages\Gradido\TransactionBody();
          $this->mProtoTransactionBody->mergeFromString($this->mProtoTransaction->getBodyBytes());
          
          $data = $this->mProtoTransactionBody->getData();
          var_dump($data);
        }
    }
    
    public function validate() {
        $sigPairs = $this->mProtoTransaction->getSigMap()->getSigPair();
        $bodyBytes = $this->mProtoTransaction->getBodyBytes();
        
        // check signature(s)
        foreach($sigPairs as $sigPair) {
          $pubkey = $sigPair->getPubKey();
          $signature = $sigPair->getEd25519();
          if (!\Sodium\crypto_sign_verify_detached($signature, $bodyBytes, $pubkey)) {
              $this->addError('signature for key ' . bin2hex($pubkey) . ' isn\'t valid ' );
              return false;
          } 
        }
        
        return true;
    }
    
    public function getErrors() {
      return $this->errors;
    }
    
    public function hasErrors() {
       return count($this->errors) > 0;
    }
            
    
    private function addError($message) {
      array_push($this->errors, $message);
    }
}