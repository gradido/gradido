<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$this->assign('title', __('Willkommen'));
$this->assign(
  'header',
  '<h1>Server Dashboard, nur für Admins</h1>'
);
?>
<div class="content-region">
  <h3>Gradido ...</h3>
  <div class="content-collection">
    <div class="content-item action-button">
      <i class="material-icons-outlined">redeem</i>
      <?= $this->Html->link(
            __('viele schöpfen'),
            ['controller' => 'TransactionCreations', 'action' => 'createMulti'],
            ['class' => 'action-button-link']
        );?>
    </div>
  </div>
  <div class="content-collection">
    <div class="content-item info-item">
      <i class="material-icons-outlined">error_outline</i>
      <?= $this->Html->link(
              __('Fehler') . ' (' . $adminErrorCount . ')',
              ['controller' => 'AdminErrors'], ['class' => 'info-item-link']);
      ?>
    </div>
  </div>
</div>