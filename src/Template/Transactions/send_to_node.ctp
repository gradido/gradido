<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
$this->assign('title', __('Transaktionen an Gradido-Node senden'));
?>
<style type="text/css">
  .time-used {
    color:grey;
    font-size:smaller;
  }
  
  .progress-state.grd-error {
    border:none;
  }
</style>

<p>
<?php if($transactionIds[0] == 1) : ?>
Bisher keine Transaktionen eingereicht
<?php else: ?>
Letzte eingereichte Transaktion <?= gTransactionIds[0] - 1 ?>
<?php endif; ?>
</p>
<ul class="grd-no-style" id="put-progress">
  <?php foreach($transactionIds as $i => $id) : ?>
    <li>
      <b><?= $id ?></b>:
      <span class="progress-state">
        <?php if($i == 0): ?>
          <i>Wird verarbeitet</i>
        <?php else: ?>
          in Warteschlange
        <?php endif; ?>
      </span>
    <?php endforeach; ?>
    </li>
</ul>
<?=  $this->Html->script(['core']); ?>
<script type="text/javascript">
  var gTransactionIds = <?= json_encode($transactionIds); ?>;
  var csfr_token = '<?= $csfr_token ?>';
  
  function round_to_precision(x, precision) {
    var h = Math.pow(10, precision);
    return Math.round(x * h) / h;
  }
  
  function putTransaction(index) {
    if(gTransactionIds[index] === undefined) {
      return;
    }
    console.log("index: %d", index);
    var progressState = $('#put-progress .progress-state').eq(index);
    progressState.html('<i>Wird verarbeitet</i>');
    
    $.ajax({
        url: 'ajaxPutTransactionToGradidoNode',
        type: 'post',
        data: {
            transaction_id: gTransactionIds[index]
        },
        headers: {'X-CSRF-Token': csfr_token},
        dataType: 'json',
        success: function (data) {
          if(data.result.state === 'success') {
            progressState.addClass('grd-success').html('Erfolgreich eingereicht');
            setTimeout(function() { putTransaction(index+1);}, 1000);
          } else {
            $('#put-progress .progress-state').map(function(_index, dom) {
              if(_index <= index) return;
              $(dom).html('Abgebrochen');
            });
            progressState.addClass('grd-error').html('Fehler beim einreichen');
          }
          var timeString = round_to_precision(data.timeUsed * 1000.0, 4) + ' ms';
          var nodeTime = data.result.timeUsed;
          progressState.append('&nbsp;').append('<span class="time-used">' + timeString + ' (node: ' + nodeTime + ')</span>');
        }
    });
  }
  
  $(function() {
    //console.log("on DOM ready");
    putTransaction(0);
    //.grd-success 
    // $( "ul li:nth-child(2)" )
  })
</script>
