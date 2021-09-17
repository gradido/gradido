<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$body['balance'] = $this->element('centToFloat', ['cent' => $body['balance'], 'precision' => 4]);
$body['decay'] = $this->element('centToFloat', ['cent' => $body['decay'], 'precision' => 4]);
$body['gdtSum'] = $this->element('centToFloat', ['cent' => $body['gdtSum'], 'precision' => 2]);

foreach($body['transactions'] as $i => $transaction) {
    $useCeil = false;
    if(!isset($transaction['type'])) {
        $body = ['state' => 'error', 'msg' => 'transaction without type found', 'details' => $transaction];
    } else {
        if($transaction['type'] == 'decay') {
            $useCeil = true;
        }
        $body['transactions'][$i]['balance'] = $this->element('centToFloat', ['cent' => $transaction['balance'], 'precision' => 4, 'useCeil' => $useCeil]);
        if(isset($transaction['creation_amount'])) {
            $body['transactions'][$i]['creation_amount'] = $this->element('centToFloat', ['cent' => $transaction['creation_amount'], 'precision' => 4]);
        }
        if(isset($transaction['decay'])) {
            $body['transactions'][$i]['decay']['balance'] = $this->element('centToFloat', ['cent' => $transaction['decay']['balance'], 'precision' => 4]);
        }
    }
}

?><?= json_encode($body) ?>