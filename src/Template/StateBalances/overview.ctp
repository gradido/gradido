<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
$this->assign('title', __('Kontoübersicht'));

$header = '<h1>' . __('Aktueller Kontostand: ') . '</h1>' .
  '<h1>' . $this->element('printGradido', ['number' => $balance]) . '</h1>';
if($gdtSum > 0) {
  $header .= '<h1>'.$this->Html->link(
    $this->element('printGDT', ['number' => $gdtSum]),
    ['action' => 'overview_gdt'],
    ['escape' => false]
  ).'</h1>';
}
$this->assign('header', $header);
//var_dump($transactions);
?>
<?php if($transactionExecutingCount > 0) : ?>
<div id="transaction-execute-display" class="">

</div>
<?php endif; ?>
<div class="content-list">
  <p class="content-list-name">Überweisungen</p>
  <table class="content-list-table">
    <thead>
      <tr class="content-list-table-header">
        <th colspan="2"><?= __('Absender') . ' / ' . ('Empfänger') ?></th>
        <th><?= __('Verwendungszweck') ?></th>
        <th><?= __('Datum') ?></th>
        <th><?= __('Betrag') ?></th>
        <th title="<?= __('Transaktions Nr.') ?>"><?= __('Nr') ?></th>
      </tr>
    </thead>
    <tbody>
      <?php foreach($transactions as $transaction):
        $send = $transaction['type'] == 'send';
        $balance = $transaction['balance'];
        $memoShort = $transaction['memo'];
        if(strlen($memoShort) > 30) {
          $memoShort = substr($memoShort, 0, 30) . '...';
        }
        $cellColorClass = 'grd-success-color';
        if($send) {
          $balance = -$balance;
          $cellColorClass = 'grd-alert-color';
        } else if($transaction['type'] == 'creation') {
          $cellColorClass = 'grd-orange-color';
        }
      ?>
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
          <span class=" <?= $cellColorClass ?>">
            <?php if($transaction['type'] == 'creation') : ?>
            <i class="mdi mdi-creation grd-orange-color"></i>&nbsp;<?= __('Geschöpft')?>
            <?php elseif($transaction['type'] == 'send') : ?>
            <i class="mdi mdi-arrow-right-bold"></i>&nbsp;<?= __('Gesendet') ?>
            <?php elseif($transaction['type'] == 'receive') : ?>
            <i class="mdi mdi-arrow-left-bold"></i>&nbsp;<?= __('Empfangen') ?>
            <?php endif; ?>
          </span>
        </td>
        <td><span data-toggle="tooltip" data-placement="bottom" title="<?= $transaction['memo'] ?>">
          <?php if(strlen($transaction['memo']) > 30): ?>
            <?= substr($memoShort, 0, 30) . '...' ?>
          <?php else : ?>
            <?= $transaction['memo'] ?>
          <?php endif;?>
          </span>
        </td>
        <td> <?= $transaction['date']->nice() ?> </td>
        <td><?= $this->element('printGradido', ['number' => $balance]) ?></td>
        <td>
          <small><?= $transaction['transaction_id'] ?></small>
        </td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>
<!--<a class="border-top px-3 py-2 d-block text-gray" href="#"><small class="font-weight-medium"><i class="mdi mdi-chevron-down mr-2"></i>View All Order History</small></a>-->
<!--?= $this->Html->css(['gdt.css']) ?-->
<?php if($transactionExecutingCount > 0) : ?>
<script type="text/javascript">
  //function getJson(basisUrl, method, successFunction, errorFunction, timeoutFunction)
  g_transactionExecutionCount = <?= $transactionExecutingCount ?>;

  function updateTransactionExecutingDisplay(count) {
    var display = document.getElementById('transaction-execute-display');
    display.innerHTML = count + " ";
    if(count == 1) {
      display.innerHTML += "<?= __('Laufende Transaktion') ?>";
    } else {
      display.innerHTML += "<?= __('Laufende Transaktionen') ?>";
    }
    display.innerHTML += '&nbsp;<div class="spinner-border text-light spinner-border-sm" role="status"><span class="sr-only">Loading...</span></div>';
  }

  function checkTransactionExecuting() {
    getJson('<?= $this->Url->build(["controller" => "JsonRequestHandler"]);?>', 'getRunningUserTasks',
      // success
      function(json) {
        if(json.state === 'success') {
           var newCount = 0;
           if(json.data.runningTasks["sign transaction"] != undefined) {
             newCount = json.data.runningTasks["sign transaction"];
           }
           if(newCount != g_transactionExecutionCount) {
             g_transactionExecutionCount = newCount;
             location.reload();
             //updateTransactionExecutingDisplay(g_transactionExecutionCount);
           }
        }
      },
      // error
      function(e) {
      },
      // timeout
      function(e) {
      }
    )
  }

  (function(document, window, domIsReady, undefined) {
   domIsReady(function() {
      updateTransactionExecutingDisplay(g_transactionExecutionCount);
      setTimeout(checkTransactionExecuting, 100);
      //setInterval(checkTransactionExecuting, 100);
   });
})(document, window, domIsReady);
</script>
<?php endif; ?>