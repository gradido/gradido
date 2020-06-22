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
  <p class="form-header">Benutzer suchen</p>
  <div class="form-body">
    <?= $this->Form->create($searchForm, []) ?>
        <?= $this->Form->control('search', ['label' => __('Suchbegriff'), 'class' => 'form-control', 'id' => 'inlineFormInputGroup', 'placeholder' => __('Vorname/Nachname/E-Mail')]) ?>
    <?= $this->Form->button('<i class="material-icons-outlined">search</i>&nbsp;' . __('Suchen'), ['class' => 'form-button']) ?>
    <?= $this->Form->hidden('order_row', ['id' => 'input-order-row']) ?>
  </div>
</div>
<div class="default-container">
  <div id="gradido-mithril-user-search"></div>
</div>
<?php // adding scripts vendor and core from ripple ui for popup/tooltip ?>
<script type="text/javascript">
  <?php if(isset($finalUserEntrys)) : ?>
    g_users = <?= json_encode($finalUserEntrys); ?>;
  <?php else: ?>
    g_users = [];
  <?php endif; ?>
    csfr_token = '<?= $csfr_token ?>';

</script>
<?= $this->Html->script('userSearch') ?>
<!-- npm run build im mithril client! -->
<!-- keybase://team/gradido/gradido_mithril_user_search -->

