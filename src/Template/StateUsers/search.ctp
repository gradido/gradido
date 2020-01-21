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
<style type="text/css">
 .tippy-tooltip[data-animation=fade][data-state=hidden]{opacity:0}.tippy-iOS{cursor:pointer!important;-webkit-tap-highlight-color:transparent}.tippy-popper{pointer-events:none;max-width:calc(100vw - 10px);transition-timing-function:cubic-bezier(.165,.84,.44,1);transition-property:transform}.tippy-tooltip{position:relative;color:#fff;border-radius:4px;font-size:14px;line-height:1.4;background-color:#333;transition-property:visibility,opacity,transform;outline:0}.tippy-tooltip[data-placement^=top]>.tippy-arrow{border-width:8px 8px 0;border-top-color:#333;margin:0 3px;transform-origin:50% 0;bottom:-7px}.tippy-tooltip[data-placement^=bottom]>.tippy-arrow{border-width:0 8px 8px;border-bottom-color:#333;margin:0 3px;transform-origin:50% 7px;top:-7px}.tippy-tooltip[data-placement^=left]>.tippy-arrow{border-width:8px 0 8px 8px;border-left-color:#333;margin:3px 0;transform-origin:0 50%;right:-7px}.tippy-tooltip[data-placement^=right]>.tippy-arrow{border-width:8px 8px 8px 0;border-right-color:#333;margin:3px 0;transform-origin:7px 50%;left:-7px}.tippy-tooltip[data-interactive][data-state=visible]{pointer-events:auto}.tippy-tooltip[data-inertia][data-state=visible]{transition-timing-function:cubic-bezier(.54,1.5,.38,1.11)}.tippy-arrow{position:absolute;border-color:transparent;border-style:solid}.tippy-content{padding:5px 9px}
  
 .tippy-popper {
   ax-width: calc(100vw - 10px);
   
 }
.tippy-tooltip {
  color:#101010;
  background-color:#f9fafb;
  border-radius: 0;
  font-size:12px;
}

.tippy-content b {
  color:#047006;
}

.tippy-content ul {
  list-style-type:none;
  padding-left:4px;
  
}

.tippy-content .mdi {
  font-size: 16px;
}

.tippy-content .grid-header {
  padding: 5px 10px;
  margin-bottom:5px;
}



</style>
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
              <?= $this->Form->hidden('order_row', ['id' => 'input-order-row']) ?>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<div class="row">
  <div class="col-md-11 equel-grid">
    <div class="grid">
      <div id="gradido-mithril-user-search"></div>
    </div>
  </div>
</div>
<?php // adding scripts vendor and core from ripple ui for popup/tooltip ?>
<script type="text/javascript">
  <?php if(isset($finalUserEntrys)) : ?>
    g_users = <?= json_encode($finalUserEntrys); ?>;
  <?php endif; ?>
</script>
<?= $this->Html->script('userSearch.min') ?>