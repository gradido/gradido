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
