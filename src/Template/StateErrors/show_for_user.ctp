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
  <div class="content-list-table error-list">
    <span class="header-cell">Transaktion Typ</span>
    <span class="header-cell">Datum</span>
    <span class="header-cell">Fehler</span>
    <span class="header-cell">Aktionen</span>
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
    <span title="<?= $type->text ?>"><?= $type->name ?></span>
    <span><?= $error->created ?></span>
    <span><?= $errorMessage ?></span>
    <span><?= $this->Html->link(__('Delete'), ['action' => 'deleteForUser', $error->id], ['class' => 'grd-form-bn grd-form-bn-discard']) ?></span>
    <?php endforeach; ?>
  </div>
</div>
