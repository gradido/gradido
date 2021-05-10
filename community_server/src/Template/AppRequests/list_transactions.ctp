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
    $body['transactions'][$i]['balance'] = $this->element('centToFloat', ['cent' => $transaction['balance'], 'precision' => 4]);
    if(isset($transaction['creation_amount'])) {
        $body['transactions'][$i]['creation_amount'] = $this->element('centToFloat', ['cent' => $transaction['creation_amount'], 'precision' => 4]);
    }
}

?><?= json_encode($body) ?>