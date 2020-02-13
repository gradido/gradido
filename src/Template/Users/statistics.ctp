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
$percentColor = 'text-secondary';
if($users->count() > 0 && $newUsersLastMonth->count()) {
  $newUserPercent = round((1 - ($users->count() / $newUsersLastMonth->count())) * 100.0, 2);
  if($newUserPercent > 0 ) {
    $percentColor = 'text-primary';
  } else if($newUserPercent < 0) {
    $percentColor = 'text-warning';
  }
}
?>
<div class="row">
  <div class="col-md-5 order-md-0">
    <div class="row">
      <div class="col-6 equel-grid">
        <div class="grid d-flex flex-column align-items-center justify-content-center">
          <div class="grid-body text-center">
            <div class="profile-img img-rounded bg-inverse-primary no-avatar component-flat mx-auto mb-4"><i class="mdi mdi-account-group mdi-2x"></i></div>
            <h2 class="font-weight-medium"><span class="animated-count"><?= $users->count()?></span></h2>
            <small class="text-gray d-block mt-3"><?= __('Alle Anmeldungen'); ?><br>&nbsp;</small>
            <small class="font-weight-medium <?= $percentColor; ?>">
              <span class="animated-count" >&nbsp;</span>
            </small>
          </div>
        </div>
      </div>
      <div class="col-6 equel-grid">
        <div class="grid d-flex flex-column align-items-center justify-content-center">
          <div class="grid-body text-center">
            <div class="profile-img img-rounded bg-inverse-warning no-avatar component-flat mx-auto mb-4"><i class="mdi mdi-account-multiple-plus mdi-2x"></i></div>
            <h2 class="font-weight-medium"><span class="animated-count"><?= $newUsersThisMonth->count() ?></span></h2>
            <small class="text-gray d-block mt-3"><?= __('Anmeldungen diesen Monat'); ?></small>
            <small class="font-weight-medium <?= $percentColor; ?>">
              <?php if($newUserPercent < 0) : ?>
                <i class="mdi mdi-menu-down"></i>
              <?php elseif($newUserPercent > 0) : ?>
                <i class="mdi mdi-menu-up"></i>
              <?php endif; ?>
              <span class="animated-count" title="<?= __('Anmeldungen im Vergleich zum letzten Monat, 0% = gleiche Anzahl') ?>"><?= $newUserPercent ?></span>%
            </small>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<?= $this->Html->script(['core', 'vendor.addons']); ?>