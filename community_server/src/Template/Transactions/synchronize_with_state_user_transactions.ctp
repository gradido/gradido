<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

?>
<div class="transactions form large-9 medium-8 columns content">
<h1>Synchronize state_user_transactions with transactions</h1>
<p>transactions count: <?= $count1 ?></p>
<p>state_user_transaction count: <?= $count2 ?></p>
<p>Missing count: <?= count($missing_transactions); ?></p>
<p>First 10 Missing ids: </p>
<p><?php 
foreach($missing_transactions as $i => $id) {
  if($i > 10) break;
  if($i > 0) echo ', ';
  echo $id['id'];
} ?></p>

<?php if(isset($entities) && isset($results)) : ?>
<h2>Synchronize errors: </h2>
<ul>
  <?php
  $succeed = 0;
  //var_dump($results);
  if($results) :
    foreach($results as $i => $result) : 
      if(false != $result) {
        $succeed++;
        continue;
      }
      ?>
    <li>Error saving entity: <?= json_encode($entities[$i]) ?> with error: <?= json_encode($entities[$i]->getErrors()) ?></li>
    <?php endforeach;  ?>
  <?php endif; ?>
  <li><success>Succeed: <?= $succeed ?></success></li>
</ul>
<?php endif; ?>

    <?= $this->Form->create() ?>
    <?= $this->Form->button(__('Synchronize')) ?>
    <?= $this->Form->end() ?>
</div>
