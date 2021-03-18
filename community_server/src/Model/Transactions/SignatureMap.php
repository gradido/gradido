<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace Model\Transactions;

//use Model\Messages\Gradido\Transaction;
//use Model\Messages\Gradido\TransactionBody;


class SignatureMap {
  
    private $mProtoSigMap = null;
   
  
    public function __construct($protoSigMap) 
    {
        $this->mProtoSigMap = $protoSigMap;
    }
    
    public function getProto() {
      return $this->mProtoSigMap;
    }
    
    static public function fromEntity($transactionSignatures) 
    {
      
      $protoSigMap = new \Model\Messages\Gradido\SignatureMap();
      $sigPairs = $protoSigMap->getSigPair();
      //echo "sigPairs: "; var_dump($sigPairs); echo "<br>";
      //return null;
      foreach($transactionSignatures as $signature) {  
        $sigPair = new \Model\Messages\Gradido\SignaturePair();
        $sigPair->setPubKey(stream_get_contents($signature->pubkey));
        $sigPair->setEd25519(stream_get_contents($signature->signature));
        
        $sigPairs[] = $sigPair;
        //array_push($sigPairs, $sigPair);
      }
      return new SignatureMap($protoSigMap);
    }
    
    static public function build($bodyBytes, array $keys) 
    {
      $protoSigMap = new \Model\Messages\Gradido\SignatureMap();
      $sigPairs = $protoSigMap->getSigPair();
      //echo "sigPairs: "; var_dump($sigPairs); echo "<br>";
      //return null;
      
      // sign with keys
      foreach($keys as $key) {
        $sigPair = new \Model\Messages\Gradido\SignaturePair();
        $sigPair->setPubKey(hex2bin($key['pub']));
        $sigPair->setEd25519(sodium_crypto_sign_detached($bodyBytes, hex2bin($key['priv'])));

        $sigPairs[] = $sigPair;
      }
      //array_push($sigPairs, $sigPair);
      
      return new SignatureMap($protoSigMap);
    }
    
    
}