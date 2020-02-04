<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
$this->assign('title', __('Gradido Überweisung'));
$receiverNames = $receiverUser->first_name . ' ' . $receiverUser->last_name;
$senderNames = $senderUser->first_name . ' ' . $senderUser->last_name;
?><?= __('Hallo') ?> <?= $receiverNames ?>, 
 
<?= __('Du hast soeben {0} von {1} erhalten.', $this->element('printGradido', ['number' => $gdd_cent, 'raw' => true]), $senderNames) ?> 
<?= __('{0} schreibt:', $senderNames) ?> 
 
<?= $memo ?> 
 
<?= __('Du kannst {0} eine Nachricht schreiben, indem du auf diese E-Mail antwortest', $senderNames); ?> 
 
<?= __('Mit freundlichen Grüßen'); ?> 
Gradido Community Server