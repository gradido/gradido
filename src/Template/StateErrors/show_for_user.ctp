<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$this->assign('title', __('Fehlermeldungen'));
//var_dump($transactionTypes);
/*foreach($transactionTypes as $i => $t) {
  echo "$i => ";
  var_dump($t);
  echo "<br>";
}*/
?>
<div class="content-list">
  <p class="content-list-title">Fehler</p>
  <div class="content-list-table">
    <div class="row">
      <div class="cell header-cell c2">Transaktion Typ</div>
      <div class="cell header-cell c2">Datum</div>
      <div class="cell header-cell c0">Fehler</div>
      <div class="cell header-cell c1">Aktionen</div>
    </div>
    <?php foreach($errors as $error) :
      $type = $transactionTypes[$error->transaction_type_id-1];
      $errorMessage = "";
      $errorArray = json_decode($error->message_json, true);
      if(isset($errorArray['details']) && is_array($errorArray['details'])) {
        foreach($errorArray['details'][0] as $function => $errorString) {
          $errorMessage = '<b>' . $function . '</b><br> ' . $errorString;
        }
      } else {
        $errorMessage = $error->message_json;
      }
    ?>
    <div class="row">
      <div class="cell c3" title="<?= $type->text ?>"><?= $type->name ?></div>
      <div class="cell c3"><?= $error->created ?></div>
      <div class="cell c0"><?= $errorMessage ?></div>
      <div class="cell c2">
        <?= $this->Html->link(
          __('Delete'),
          ['action' => 'deleteForUser', $error->id],
          ['class' => 'form-button button-cancel']
          ) ?></div>
    </div>
    <?php endforeach; ?>
  </div>
</div>
