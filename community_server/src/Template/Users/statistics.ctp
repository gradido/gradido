<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$this->assign('title', __('Benutzer Statistiken'));

//mdi mdi-account-multiple-plus
//$newUserPercent = (1 - (b / a)) * 100
$newUserPercent = 0;
$percentColor = 'info';
if($users->count() > 0 && $newUsersLastMonth->count()) {
  $newUserPercent = round((1 - ($users->count() / $newUsersLastMonth->count())) * 100.0, 2);
  if($newUserPercent > 0 ) {
    $percentColor = 'success';
  } else if($newUserPercent <= 0) {
    $percentColor = 'alert';
  }
}

$userColor = 'info';
if($users->count() > 0) {
  if($users->count() > 0 ) {
    $userColor = 'success';
  } else if($users->count() <= 0) {
    $userColor = 'alert';
  }
}
?>
<div class="block-container">
  <div class="content-block">
    <div class="block-img <?= $userColor ?>-icon">
      <i class="material-icons-outlined">people</i>
    </div>
    <h1><?= $users->count()?></h1>
    <small class="small-font"><?= __('Alle Anmeldungen'); ?><br>&nbsp;</small>
    <small class="font-weight-medium <?= $userColor; ?>-color">
      <span>&nbsp;</span>
    </small>
  </div>
  <div class="content-block">
    <div class="block-img <?= $percentColor ?>-icon">
      <i class="material-icons-outlined">group_add</i>
    </div>
    <h1><?= $newUsersThisMonth->count() ?></h1>
    <small class="small-font"><?= __('Anmeldungen diesen Monat'); ?><br>&nbsp;</small>
    <small class="font-weight-medium <?= $percentColor; ?>-color">
      <?php if($newUserPercent < 0) : ?>
        <i class="material-icons-outlined">arrow_drop_down</i>
      <?php elseif($newUserPercent > 0) : ?>
        <i class="material-icons-outlined">arrow_drop_up</i>
      <?php endif; ?>
      <span title="<?= __('Anmeldungen im Vergleich zum letzten Monat, 0% = gleiche Anzahl') ?>"><?= $newUserPercent ?></span>%
    </small>
  </div>
</div>
<div class="content-list">
  <p class="content-list-title"><?= __('Letzte Anmeldungen'); ?></p>
  <div class="content-list-table">
    <div class="row">
      <div class="cell header-cell c4"><?= __('Name')?></div>
      <div class="cell header-cell c0"><?= __('E-Mail') ?></div>
      <div class="cell header-cell c4"><?= __('Erstellt') ?></div>
    </div>
    <?php foreach($lastUsers as $user) : ?>
    <div class="row">
      <div class="cell c4"><?= $user->first_name . ' ' . $user->last_name ?></div>
      <div class="cell c0"><?= $user->email ?></div>
      <div class="cell c4"><?= $user->created ?></div>
    </div>
    <?php endforeach; ?>
    <?php //var_dump($lastUsers->toArray()); ?>
  </div>
</div>
<div class="content-list">
  <p class="content-list-title"><?= __('Anmeldungen detailliert'); ?></p>
  <div class="content-list-table">
    <div class="row">
      <div class="cell header-cell c4"><?= __('Jahr')?></div>
      <div class="cell header-cell c0"><?= __('Monat') ?></div>
      <div class="cell header-cell c4"><?= __('Anzahl Anmeldungen') ?></div>
    </div>
    <?php foreach($newAccountsTree as $year => $yearEntrys) : ?>
      <?php foreach($yearEntrys as $month => $monthEntrys): ?>
      <div class="row">
        <div class="cell c4"><?= $year ?></div>
        <div class="cell c0"><?= $month ?></div>
        <div class="cell c4"><?= $monthEntrys['count'] ?></div>
      </div>
      <?php endforeach; ?>
    <?php endforeach; ?>
  </div>
</div>
<?= $this->Html->script(['core', 'vendor.addons']); ?>
<?= $this->Html->script('userSearch') ?>