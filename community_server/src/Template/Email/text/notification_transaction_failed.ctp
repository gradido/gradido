<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
$this->assign('title', __('Gradido Transaktion fehlgeschlagen'));

$transaction_body = $transaction->getTransactionBody();
$specific_transaction = $transaction_body->getSpecificTransaction();
$transaction_type_name = $transaction_body->getTransactionTypeName();
              
?><?= __('Hallo') ?> <?= $user->first_name ?> <?= $user->last_name ?>, 
 
<?= __('Deine letzte Transaktion ist leider fehlgeschlagen.') ?>


<?php if($reason != 'parse') : 
      if($transaction_type_name === 'creation') : ?><?= __('Du wolltest {0} für {1} schöpfen.', 
            $this->element('printGradido', ['number' => $specific_transaction->getAmount(), 'raw' => true]),
            $specific_transaction->getReceiverUser()->getEmailWithName()) ?>

<?= __('Das Zieldatum war: ') . $specific_transaction->getTargetDate()->format('d.m.Y') ?>
<?php elseif($transaction_type_name === 'transfer'): ?>
<?= __('Du wolltest {0} an {1} senden.',
            $this->element('printGradido', ['number' => $specific_transaction->getAmount(), 'raw' => true]),
            $specific_transaction->getReceiverUser()->getEmailWithName()) ?>
<?php endif; endif; ?>


<?= __('Das ist schief gelaufen: ') ?>

<?php switch($reason) {
    case 'save': echo __('Fehler beim speichern in der Datenbank. Bitte versuche es später erneut'); break;
    case 'parse': echo __('Fehler beim parsen der Transaktion. Bitte versuche es später erneut'); break;
    case 'validate': 
        $errors = $transaction->getErrors();
        foreach($errors as $error) {
            //echo "\t".json_encode($error);
            echo "\n\t".$error[array_keys($error)[0]]."\n";
        }
}?>


<?= __('Bitte antworte nicht auf diese E-Mail!'); ?>
 

<?= __('Mit freundlichen Grüßen'); ?> 
Gradido Community Server