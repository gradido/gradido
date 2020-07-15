<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$this->assign('title', __('Profil ändern'));
// In a View class
$this->loadHelper('Form', [
    'templates' => 'horizontal_form',
]);
?>
<div class="action-form">
  <div class="form-body">
    <?= $this->Form->create($profileForm, ['enctype' => 'multipart/form-data']) ?>
      <?= $this->Form->control('first_name', ['label' => __('Vorname'), 'placeholder' => 'Vorname', 'value' => $user['first_name']]) ?>
      <?= $this->Form->control('last_name', ['label' => __('Nachname'), 'placeholder' => 'Nachname', 'value' => $user['last_name']]) ?>
      <?= $this->Form->control('profile_img', ['type' => 'file', 'accept' => 'image/*', 'label' => __('Profilbild')]) ?>
      <?= $this->Form->control('profile_desc', ['label' => __('Beschreibung'), 'rows' => 4, 'placeholder' => 'Beschreibung', 'value' => $communityProfile['profile_desc']]) ?>
      <?= $this->Form->button(__('Daten speichern'), ['name' => 'submit', 'class' => 'form-button']) ?>
    <?= $this->Form->end() ?>
  </div>
</div>
<?php // adding scripts vendor and core from ripple ui for validation effect ?>
<?= $this->Html->script(['core', 'vendor.addons']); ?>
<script type="text/javascript">
  (function ($) {
    'use strict';
    $('textarea').maxlength({
        alwaysShow: true,
        warningClass: "badge badge-warning",
        limitReachedClass: "badge badge-error"
    });
})(jQuery);
</script>
