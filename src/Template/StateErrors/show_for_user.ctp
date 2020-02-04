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
<div class="grd_container_small">
  <table>
    <thead>
      <tr><th>Transaktion Typ</th><th>Datum</th><th>Fehler</th><th>Aktionen</th></tr>
    </thead>
    <tbody>
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
      <tr>
        <td title="<?= $type->text ?>"><?= $type->name ?></td>
        <td><?= $error->created ?></td>
        <td><?= $errorMessage ?></td>
        <td><?= $this->Html->link(__('Delete'), ['action' => 'deleteForUser', $error->id], ['class' => 'grd-form-bn grd-form-bn-discard']) ?></td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>
