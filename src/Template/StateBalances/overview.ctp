<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
$this->assign('title', __('Kontoübersicht'));
//var_dump($transactions);
?>
<div class="row">
  <div class="col-md-8 equel-grid">
    <div class="grid">
      <div class="grid-body py-3">
        <h3><?= __('Aktueller Kontostand: ') ?></h3>
        <h2><?= $this->element('printGradido', ['number' => $balance]) ?></h2>
      </div>
    </div>
  </div>
</div>
<div class="row">
  <div class="col-md-10 equel-grid">
    <div class="grid">
      <div class="grid-body py-3">
        <p class="card-title ml-n1">Überweisungen</p>
      </div>
      <div class="table-responsive">
        <table class="table table-hover table-sm">
          <thead>
            <tr class="solid-header">
              <th colspan="2" class="pl-4"><?= __('Absender') . ' / ' . ('Empfänger') ?></th>
              <th><?= __('Transaktions Nr.') ?></th>
              <th><?= __('Datum') ?></th>
              <th><?= __('Betrag') ?></th>
            </tr>
          </thead>
          <tbody>
            <?php foreach($transactions as $transaction):  ?>
            <tr>
              <td class="pr-0 pl-4">
                <?= $this->Html->image('50x50.png', ['class' => 'profile-img img-sm', 'alt' => 'profile image']) ?>
              </td>
              <td class="pl-md-0">
                <?php if(isset($transaction['email']) && $transaction['email'] != ''): ?>
                <a href="mailto:<?= $transaction['email'] ?>" title="<?= $transaction['email'] ?>">
                  <small class="text-black font-weight-medium d-block"><?= $transaction['name'] ?></small>
                </a>
                <?php else : ?>
                <small class="text-black font-weight-medium d-block"><?= $transaction['name'] ?></small>
                <?php endif; ?>
                <span>
                  <?php if($transaction['type'] == 'creation') : ?>
                  <i class="mdi mdi-creation grd-orange-color"></i>&nbsp;<?= __('Geschöpft')?>
                  <?php elseif($transaction['type'] == 'send') : ?>
                  <i class="mdi mdi-arrow-right-bold"></i>&nbsp;<?= __('Gesendet') ?>
                  <?php elseif($transaction['type'] == 'receive') : ?>
                  <i class="mdi mdi-arrow-left-bold"></i>&nbsp;<?= __('Empfangen') ?>
                  <?php endif; ?>
                </span>
              </td>
              <td>
                <small><?= $transaction['transaction_id'] ?></small>
              </td>
              <td> <?= $transaction['date']->nice() ?> </td>
              <td><?= $this->element('printGradido', ['number' => $transaction['balance']]) ?></td>
            </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
      <!--<a class="border-top px-3 py-2 d-block text-gray" href="#"><small class="font-weight-medium"><i class="mdi mdi-chevron-down mr-2"></i>View All Order History</small></a>-->
    </div>
  </div>
</div>