<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
$this->assign('title', __('Gradido Schöpfung'));
?><?= __('Hallo') ?> <?= $user->first_name ?> <?= $user->last_name ?>, 
 
<?= __('Für dich wurden soeben {0} geschöpft.', $this->element('printGradido', ['number' => $gdd_cent, 'raw' => true])) ?> 
Gradido Akademie schreibt: 
 
<?= $memo ?> 
 
<?= __('Bitte antworte nicht auf diese E-Mail!'); ?> 
 
<?= __('Mit freundlichen Grüßen'); ?> 
Gradido Community Server