<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
$this->assign('title', __('Gradido Überweisung'));
$receiverNames = $receiverUser->first_name . ' ' . $receiverUser->last_name;
$senderNames = $senderUser->first_name . ' ' . $senderUser->last_name;
$senderNamesEmail = $senderUser->getEmailWithName();
?><?= __('Hallo') ?> <?= $receiverNames ?>, 
 
<?= __('Du hast soeben {0} von {1} erhalten.', $this->element('printGradido', ['number' => $gdd_cent, 'raw' => true]), $senderNamesEmail) ?> 
<?= __('{0} schreibt:', $senderNames) ?> 
 
<?= $memo ?> 
 
<?= __('Bitte antworte nicht auf diese E-Mail!'); ?> 
<?= __('Wenn Du ') . $senderNames . __(' per E-Mail  antworten willst, schreibe stattdessen an die Adresse: '); ?>

<?= $senderUser->email ?>

 
<?= __('Mit freundlichen Grüßen'); ?> 
Gradido Community Server