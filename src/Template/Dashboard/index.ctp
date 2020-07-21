<?php
use Cake\Routing\Router;
/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

if(isset($user)) {
  //var_dump($user);
}
$this->assign(
  'title',
  __('Willkommen') . ', ' . $user['first_name'] . '&nbsp;' . $user['last_name'] . '!'
);
$this->assign(
  'header',
  '<h1>'.__('Willkommen') . ', ' . $user['first_name'] . '&nbsp;' . $user['last_name'] . '!</h1>'
);
?>
<?php if(isset($requestTime)) : ?>
<span><?= round($requestTime * 1000.0) ?> ms</span>
<?php endif; ?>
<div class="content-region">
  <h3>Gradido ...</h3>
  <div class="content-collection">
    <div class="content-item action-button">
      <i class="material-icons-outlined">account_balance_wallet</i>
      <?= $this->Html->link(
              __('Kontoübersicht'),
              ['controller' => 'StateBalances', 'action' => 'overview'],
              ['class' => 'action-button-link']
          );?>
    </div>
    <div class="content-item action-button">
      <i class="material-icons-outlined">account_balance</i>
      <?= $this->Html->link(
              __('Überweisung'),
              ['controller' => 'TransactionSendCoins', 'action' => 'create'],
              ['class' => 'action-button-link']
          ); ?>
    </div>
  </div>
</div>
<!--
  <h3>Account ...</h3>
  <a class="action-button" href="./account/user_delete"><?= __("löschen"); ?></a>
-->
<?php if($serverUser != null || $user['role'] == 'admin') : ?>
<div class="content-region">
  <h2><?= __('Adminbereich'); ?></h2>
  <h3>Gradido ...</h3>
  <div class="content-collection">
    <div class="content-item action-button">
      <i class="material-icons-outlined">redeem</i>
      <!-- insights / redeem -->
      <?= $this->Html->link(
              __('schöpfen'),
              ['controller' => 'TransactionCreations', 'action' => 'createMulti'],
              ['class' => 'action-button-link']
          );?>
    </div>
  </div>
</div>
<div class="content-region">
  <h3>Statistik</h3>
  <div class="content-collection">
    <div class="content-item info-item">
      <i class="material-icons-outlined">cached</i>
      <?= $this->Html->link(
              __('Anmeldungen'),
              ['controller' => 'Users', 'action' => 'statistics'],
              ['class' => 'info-item-link']
        );?>
    </div>
    <?php if($serverUser != null) : ?>
    <div class="content-item info-item">
      <i class="material-icons-outlined">error_outline</i>
      <?= $this->Html->link(
              __('Fehler') . ' (' . $adminErrorCount . ')',
              ['controller' => 'AdminErrors'], ['class' => 'info-item-link']);
      ?>
    </div>
    <?php endif; ?>
  </div>
</div>
<?php endif; ?>
<?php if($user['role'] == 'admin') : ?>
<div class="content-region">
  <h3>Benutzer ...</h3>
  <div class="content-collection">
    <div class="content-item action-button">
      <i class="material-icons-outlined">search</i>
      <?= $this->Html->link(
              __('suchen'),
              ['controller' => 'StateUsers', 'action' => 'search'],
              ['class' => 'info-item-link']
              ); ?>
    </div>
    <div class="content-item action-button">
      <i class="material-icons-outlined">how_to_reg</i>
      <a href="<?= Router::url('./', true) ?>account/adminRegister" class="info-item-link">
        <?= __("hinzufügen") ?>
      </a>
    </div>
    <div class="content-item action-button">
      <i class="material-icons-outlined">enhanced_encryption</i>
      <a href="<?= Router::url('./', true) ?>account/adminUserPasswordReset" class="info-item-link">
        <?= __("hat sein Passwort und Passphrase vergessen") ?>
      </a>
    </div>
  </div>
</div>
<?php endif; ?>
