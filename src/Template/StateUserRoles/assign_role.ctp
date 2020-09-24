<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$this->assign('title', __('Assign Role'));
// In a View class
$this->loadHelper('Form', [
    'templates' => 'horizontal_form',
]);
?>
<?= $this->Html->css([
  'loginServer/style.css',
  'rippleUI/style.css',
  'materialdesignicons.min.css'  
]) ?>
<style type="text/css">
  td.actions {
    padding: 10px 30px;
  }
  td.actions p {
    white-space:normal;
    font-size:16px;
  }
  td.actions ul {
    list-style-type:decimal;
    padding-left:20px;
  }
  td.actions ul li {
    white-space:initial;
-    font-size:14px;
  }
  td.actions ul li .btn {
    margin: 0 15px;
  }
</style>
<div class="action-form">
  <p class="form-header">Assign Role</p>
  <div class="form-body">
    <?= $this->Form->create($assignRoleForm, []) ?>
        <div>User:&nbsp;&nbsp;<?= $stateUser->first_name." ".$stateUser->last_name ?></div>
        <div>Select Role:<br/><?= $this->Form->select('role_id', $roles, ['label' => __('Role'), 'class' => 'form-control', 'id' => 'inlineFormInputGroup', 'placeholder' => __('Role'), "multiple" => "multiple", "value" => $role_ids]) ?></div>
    <?= $this->Form->button('<i class="material-icons-outlined"></i>&nbsp;' . __('Assign Role'), ['class' => 'form-button']) ?>
    <?= $this->Form->hidden('public_hex', ['id' => 'input-order-row', 'value' => $public_hex]) ?>
  </div>
</div>
