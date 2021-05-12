<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$body['balance'] = $this->element('centToFloat', ['cent' => $body['balance'], 'precision' => 4]);
$body['decay'] = $this->element('centToFloat', ['cent' => $body['decay'], 'precision' => 4]);
?><?= json_encode($body) ?>