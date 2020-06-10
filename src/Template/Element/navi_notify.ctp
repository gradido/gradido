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
<?php if($errorCount > 0) : ?>
   <?= $this->Html->link(
           '<i class="material-icons-outlined grd-alert-color">announcement</i>'
          . '<span class="notification-indicator notification-indicator-warning">ss</span>',
           ['controller' => 'StateErrors', 'action' => 'ShowForUser'],
           ['class' => 'nav-link', 'escape' => false, 'title' => "$errorCount " . __('Fehler')]) ?>
<?php endif; ?>
<?php if($transactionPendings > 0) : ?>
  <a class="nav-link" title="<?= "$transactionPendings " . __('Transaktionen sind noch zu unterzeichnen')?>" href="<?= Router::url('./', true) ?>account/checkTransactions">
    <i class="material-icons-outlined">verified_user</i>
    <!--
      fingerprint
      today
    -->
    <!--(<?= $transactionPendings ?>)-->
    <span class="notification-indicator notification-indicator-primary">ss</span>
  </a>
<?php endif; ?>
