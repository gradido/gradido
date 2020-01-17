<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$this->assign('title', __('Benutzer suchen'));
// In a View class
$this->loadHelper('Form', [
    'templates' => 'ripple_control_group_form',
]);//*/
?>
<div class="row">
  <div class="col-md-10 equel-grid">
    <div class="grid">
      <p class="grid-header">Benutzer suchen</p>
      <div class="grid-body">
        <div class="item-wrapper">
          <div class="row mb-3">
            <div class="col-md-10 mx-auto">
              <?= $this->Form->create($searchForm, ['class' => 't-header-search-box']) ?>
                  <?= $this->Form->control('search', ['label' => false, 'class' => 'form-control', 'id' => 'inlineFormInputGroup', 'placeholder' => __('Vorname oder Nachname oder E-Mail')]) ?>
              <?= $this->Form->button('<i class="mdi mdi-magnify"></i>&nbsp;' . __('Datenbank durchsuchen'), ['class' => 'btn btn-sm btn-primary']) ?>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<div class="row">
  <div class="col-md-10 equel-grid">
    <div class="grid">
      <?php if(count($finalUserEntrys) > 0) : ?>
        <div class="grid-body py-3">
          <p class="grid-header"><?= __('Benutzer gefunden') ?></p>
        </div>
        <div class="table-responsive">
          <table class="table table-hover table-sm">
            <thead>
              <tr class="solid-header">
                <th class="pl-4">Name</th>
                <th>E-Mail</th>
                <th>Kontostand</th>
                <th>Public Key</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach($finalUserEntrys as $user) : ?>
              <tr>
                <td class="pr-0 pl-4">
                  <span class="text-black font-weight-medium d-block">
                    <?= $user['name'] ?>
                  </span>
                  <span>
                    <span class="status-indicator rounded-indicator small bg-<?= $user['indicator']['color'] ?>"></span>
                    <small><?= __($user['indicator']['name']) ?></small>
                  </span>
                </td>
                <td><?= $user['email'] ?></td>
                <td><?= $this->element('printGradido', ['number' => $user['balance']]) ?></td>
                <td title="<?= $user['pubkeyhex'] ?>"><?= substr($user['pubkeyhex'], 0, 10) . '...' ?></td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php else :  ?>
      <div class="grid-body py-3">
          <p class="grid-header"><?= __('Keine Benutzer gefunden') ?></p>
        </div>
      <?php endif; ?>
    </div>
  </div>
</div>
