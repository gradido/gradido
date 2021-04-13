<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$this->assign('title', __('Überweisung'));
// In a View class
$this->loadHelper('Form', [
    'templates' => 'horizontal_form',
]);
?>
<div class="action-form">
  <p class="form-header">Überweisen</p>
  <div class="form-body">
    <?= $this->Form->create($transferForm) ?>
      <?= $this->Form->control('email', ['label' => __('Empfänger'), 'placeholder' => 'E-Mail']) ?>
      <?= $this->Form->control('group', ['label' => __('Community Alias'), 'options' => $groups, 'default' => $user['group_alias']]) ?>
      <?= $this->Form->control('memo', ['label' => __('Verwendungszweck'), 'rows' => 3]) ?>
      <?= $this->Form->control('amount', ['label' => __('Betrag in GDD')]) ?>
      <?= $this->Form->button(__('Transaktion abschließen'), ['name' => 'next', 'class' => 'form-button']) ?>
      <!--<?= $this->Form->button(__('Weitere Transaktion erstellen'), ['name' => 'add', 'class' => 'form-button']) ?>-->
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
