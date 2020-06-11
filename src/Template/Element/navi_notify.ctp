<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

use Cake\Routing\Router;

$session = $this->getRequest()->getSession();
$errorCount = intval($session->read('StateUser.errorCount'));
$transactionPendings = $session->read('Transactions.pending');

/*
class NavHeaderEntry
{
    public function __construct($icon_name, $controller, $action, $title) {
      ;
    }

    public function
}
*/
?>
<?php if($transactionPendings > 0) : ?>
  <a class="notify-link" title="<?= "$transactionPendings " . __('Transaktionen sind noch zu unterzeichnen')?>" href="<?= Router::url('./', true) ?>account/checkTransactions">
    <i class="material-icons-outlined notify">verified_user</i>
    <!--
      fingerprint
      today
    -->
    <!--(<?= $transactionPendings ?>)-->
  </a>
<?php endif; ?>
<?php if($errorCount > 0) : ?>
   <?= $this->Html->link(
           '<i class="material-icons-outlined notify notify-alert">announcement</i>',
           ['controller' => 'StateErrors', 'action' => 'ShowForUser'],
           ['class' => 'notify-link', 'escape' => false, 'title' => "$errorCount " . __('Fehler')]) ?>
<?php endif; ?>
