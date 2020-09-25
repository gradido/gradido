<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$this->assign('title', __('Benutzer suchen'));
// In a View class
$this->loadHelper('Form', [
    'templates' => 'horizontal_form',
]);
?>
<div class="action-form">
  <p class="form-header">Benutzer suchen</p>
  <div class="form-body">
    <?= $this->Form->create($searchForm, []) ?>
        <?= $this->Form->control('search', ['label' => __('Suchbegriff'), 'class' => 'form-control', 'id' => 'inlineFormInputGroup', 'placeholder' => __('Vorname/Nachname/E-Mail')]) ?>
    <?= $this->Form->button('<i class="material-icons-outlined">search</i>&nbsp;' . __('Suchen'), ['class' => 'form-button']) ?>
    <?= $this->Form->hidden('order_row', ['id' => 'input-order-row']) ?>
  </div>
</div>
<div class="default-container">
  <h3><?= __('State Users') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col" width="25%"><?= $this->Paginator->sort('first_name') ?></th>
                <th scope="col" width="25%"><?= $this->Paginator->sort('last_name') ?></th>
                <th scope="col"><?= $this->Paginator->sort('email') ?></th>
                <th scope="col" width="25%" style="padding-left: 10px;"><?= __('Role') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php 
            if(!empty($finalUserEntrys))
            {
            foreach ($finalUserEntrys as $stateUser): ?>
            <tr>
                <td><?= $stateUser['first_name'] ?></td>
                <td><?= $stateUser['last_name'] ?></td>
                <td><?= $stateUser['email'] ?></td>
                <td style="padding-left: 10px;"><?= $stateUser['role_name'] ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('Assign Role'), ['action' => 'assignRole', $stateUser['pubkeyhex']]) ?>
                </td>
            </tr>
            <?php endforeach; }?>
        </tbody>
    </table>
</div>
