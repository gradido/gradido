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
  <p class="content-list-title">Überweisungen</p>
  <div class="content-list-table">
    <div class="row">
      <div class="cell header-cell c4"><?= __('Absender') . ' / ' . ('Empfänger') ?></div>
      <div class="cell header-cell c0"><?= __('Verwendungszweck') ?></div>
      <div class="cell header-cell c4"><?= __('Datum') ?></div>
      <div class="cell header-cell c3"><?= __('Betrag') ?></div>
      <div class="cell header-cell c2" title="<?= __('Transaktions Nr.') ?>"><?= __('Nr') ?></div>
    </div>
    <?php foreach($transactions as $transaction):
      $send = $transaction['type'] == 'send';
      $balance = $transaction['balance'];
      $memoShort = $transaction['memo'];
      if(strlen($memoShort) > 30) {
        $memoShort = substr($memoShort, 0, 30) . '...';
      }
      $cellColorClass = 'success-color';
      if($send) {
        $balance = -$balance;
        $cellColorClass = 'alert-color';
      } else if($transaction['type'] == 'creation') {
        $cellColorClass = 'orange-color';
      }
    ?>
      <div class="row">
        <div class="cell c4">
          <?= $this->Html->image('50x50.png', ['class' => 'profile-img', 'alt' => 'profile image']) ?>
          <div>
            <?php if(isset($transaction['email']) && $transaction['email'] != ''): ?>
            <a href="mailto:<?= $transaction['email'] ?>" title="<?= $transaction['email'] ?>">
              <small class="tx-email"><?= $transaction['name'] ?></small>
            </a>
            <?php else : ?>
            <small class="tx-email"><?= $transaction['name'] ?></small>
            <?php endif; ?>
            <!-- noch ungeklärt - icon ist nicht aligned -->
            <div class="cell-icon <?= $cellColorClass ?>">
              <?php if($transaction['type'] == 'creation') : ?>
              <i class="material-icons-outlined orange-color">redeem</i>
              <!-- insights / redeem -->
                <?= __('Geschöpft')?>
              <?php elseif($transaction['type'] == 'send') : ?>
              <i class="material-icons-outlined">arrow_back</i>
                <?= __('Gesendet') ?>
              <?php elseif($transaction['type'] == 'receive') : ?>
              <i class="material-icons-outlined">arrow_forward</i>
                <?= __('Empfangen') ?>
              <?php endif; ?>
            </div>
          </div>
        </div>
        <div class="cell c0" data-toggle="tooltip" data-placement="bottom" title="<?= $transaction['memo'] ?>">
        <?php if(strlen($transaction['memo']) > 30): ?>
          <?= substr($memoShort, 0, 30) . '...' ?>
        <?php else : ?>
          <?= $transaction['memo'] ?>
        <?php endif;?>
        </div>
        <div class="cell c4"><?= $transaction['date']->nice() ?></div>
        <div class="cell c3"><?= $this->element('printGradido', ['number' => $balance]) ?></div>
        <div class="cell c2">
          <?= $transaction['transaction_id'] ?>
        </div>
      </div>
    <?php endforeach; ?>
  </div>
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