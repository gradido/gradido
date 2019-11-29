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
<ul class="nav ml-auto">
  <?php if($errorCount > 0) : ?>
  <li class="nav-item">
     <?= $this->Html->link(
             '<i class="mdi mdi-alert-outline grd-alert-color mdi-1x"></i>'
           . '<span class="notification-indicator notification-indicator-warning notification-indicator-ripple"></span>',
             ['controller' => 'StateErrors', 'action' => 'ShowForUser'],
             ['class' => 'nav-link', 'escape' => false, 'title' => "($errorCount) " . __('Fehler')]) ?>
  </li>
  <?php endif; ?>
  <?php if($transactionPendings > 0) : ?>
  <li class="nav-item">
    <a class="nav-link" title="<?= "($transactionPendings) " . __('Transaktionen sind noch zu unterzeichnen')?>" href="<?= Router::url('./', true) ?>account/checkTransactions">
      <i class="mdi mdi-signature-freehand mdi-1x"></i>
      <!--(<?= $transactionPendings ?>)-->
      <span class="notification-indicator notification-indicator-primary notification-indicator-ripple"></span>
    </a>
  </li>
  <?php endif; ?>
</ul>