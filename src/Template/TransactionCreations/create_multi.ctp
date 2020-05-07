<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
/*$address_options = [];//__('Selbst eingeben:')];
foreach($receiverProposal as $i => $receiver) {
  //var_dump($receiver);
  array_push($address_options, [
      'text' => $receiver['name'],
      'value' => $i+1,
      'title' => $receiver['key']
  ]);
}*/
$this->assign('title', __('Schöpfungstransaktion'));

use Cake\I18n\FrozenTime;

?>
<style type="text/css">
  input[type='checkbox'] {
    width:25px;
  }
  
  .grd_big_checkbox {
    border:1px dotted black;
    padding:4px;
    margin-bottom:5px;
  }
  
  .grd_margin-bottom_50 {
    margin-bottom:50px;
  }
  
  .grd_margin-bottom_100 {
    margin-bottom:100px;
  }
  
  .grd_margin-bottom_120 {
    margin-bottom:120px;
  }
  
  .grd_smaller {
    font-size:smaller;
    color:blue;
  }
  
  .color-orange {
    color:#6400d9;
  }
  
  .flowing-bottom {
    position:fixed;
    bottom:0px;
    padding-left:20px;
    padding-right:20px;
    padding-top:10px;
    padding-bottom:10px;
    background-color:rgba(255,255,255,0.5);
  }
  
</style>
<div class="grd_container_small grd_margin-bottom_120">
  
  <button type="button" onclick="checkAll()" >Alle auswählen</button>
  <button type="button" onclick="uncheckAll()">Alle abwählen</button>
  <div style="margin-bottom:5px"></div>
  <?= $this->Form->create($creationForm) ?>
  <?php if($transactionExecutingCount > 0) : ?>
    <div id="transaction-execute-display"></div>
  <?php endif; ?>
  <fieldset>
    <?= $this->Form->control('memo'); ?>
    <?= $this->Form->control('amount', ['required' => false]); ?>
    <?php 
      $firstDayLastMonth = new FrozenTime(); 
      $firstDayLastMonth = $firstDayLastMonth->day(1)->subMonth(1);
    ?>
    <?= $this->Form->control('target_date', ['value' => $firstDayLastMonth]); ?>
    <?php foreach($possibleReceiver as $possibleReceiver) :
      $disable = null;
      if($activeUser['id'] == $possibleReceiver['id'] || $possibleReceiver['amount'] > 30000000) {
        //$disable = 'disabled';
      }
      ?>
    <div class="grd_big_checkbox">
      <?php if(isset($possibleReceiver['pending'])) : ?>
        <?= $this->Form->hidden('user_pending[' . $possibleReceiver['id'] . ']', ['value' => $possibleReceiver['pending']] ) ?>
      <?php endif; ?>
      <?= $this->Form->checkbox('user[' .$possibleReceiver['id'] . ']',  ['value' => $possibleReceiver['id'], 'hiddenField' => false, $disable]); ?>
      <?php if($disable != null) : ?>
        <span style="color:grey" title="Du kannst leider nicht für dich selbst schöpfen.">
      <?php endif; ?>
          <a style="color:black;text-decoration: none;" target="_blank" href="/state-users/view/<?= $possibleReceiver['id'] ?>">
      <?= $possibleReceiver['name'] ?>   
        <?php if($possibleReceiver['email'] != '') : ?>
          &lt;<?= $possibleReceiver['email'] ?>&gt;
        <?php endif; ?></a><br>
        <div class="input number grd-padding-top-bottom-5">
          <?= $this->Form->text('user_amount[' . $possibleReceiver['id'] . ']', ['placeholder' => __('Für benutzerdefinierten Betrag'), 'class' => 'user_amount', 'type' => 'number', 'step' => '0.01', $disable]); ?> GDD
        </div>
        <div class="input date grd-padding-top-bottom-5">
          <?= $this->Form->date('user_target_date[' . $possibleReceiver['id'] . ']', ['value' => $firstDayLastMonth]) ?>
        </div>
        <?php if(isset($possibleReceiver['pending'])) : ?>
        <span class="grd_smaller color-orange">
          Bereits als Transaktion angelegt: <?= $this->element('printGradido', ['number' => $possibleReceiver['pending']]);?>
        </span>
        <br>
        <?php endif; ?>
        <?php if($possibleReceiver['amount'] != 0) : ?>
          <span class="grd_smaller">
            In diesen und den letzten 2 Monaten bereits geschöpft (alte Berechnung): <?= $this->element('printGradido', ['number' => $possibleReceiver['amount']]);?>
          </span>
        <?php endif; ?>
        <?php if($possibleReceiver['amount2'] > 0) : ?>
          <span class="grd_smaller">
            Im letzten Monat geschöpft (neue Berechnung): <?= $this->element('printGradido', ['number' => $possibleReceiver['amount2']]) ?>
          </span>
        <?php endif; ?>
        <?php if($disable != null) : ?>
          </span>
        <?php endif; ?>
          <br>
    </div>
    <?php endforeach; ?>
    <!--<?= $this->Form->control('receiver_pubkey_hex', []) ?>-->
  </fieldset>
  <div class="flowing-bottom">
    <?php if($countUsers > $limit) : 
    ?><p><?= $countUsers ?> Benutzer insgesamt</p>
    <p>Seiten: 
      <?php for($i = 0; $i < ceil($countUsers/$limit); $i++) {
          if($i > 0) echo ', ';     
          if($i != $page) {
            echo $this->Html->link($i, ['action' => 'create_multi', $i]);
          } else {
            echo $i;
          }
      } 
      ?>
    </p><?php endif ?>
    <?= $this->Form->button(__('Transaktion(en) abschließen'), ['name' => 'next', 'class' => 'grd-form-bn grd-form-bn-succeed  grd_clickable grd-width-200']) ?>
    <?= $this->Form->button(__('Weitere Transaktion erstellen'), ['name' => 'add', 'class' => 'grd-form-bn grd_clickable  grd-width-200']) ?>
  </div>
  <?= $this->Form->end() ?>
</div>
<?= $this->Html->script('basic'); ?>
<script type="text/javascript">
  function checkAll()
  {
    var inputs = document.getElementsByTagName("input");
    for(var i = 0; i < inputs.length; i++) {
      if(inputs[i].type == "checkbox") {
          inputs[i].checked = true; 
      }  
    } 
  }
  
  function uncheckAll()
  {
    var inputs = document.getElementsByTagName("input");
    for(var i = 0; i < inputs.length; i++) {
      if(inputs[i].type == "checkbox") {
          inputs[i].checked = false; 
      }  
    }
  }
  
(function(document, window, domIsReady, undefined) {
   domIsReady(function() {
      var userAmountInputs = document.getElementsByClassName("user_amount");
      for(var i in userAmountInputs) {
        var input = userAmountInputs[i];
        //console.log("input: %o", input);
        if(input.parentNode != undefined) {
          //var checkbox = input.parentNode.previousElementSibling.previousElementSibling.previousElementSibling;
          //console.log("checkbox: %o?", checkbox);
          input.onfocus = function(e) {
            var checkbox = e.target.parentNode.previousElementSibling.previousElementSibling.previousElementSibling;
            checkbox.checked = true;
            //console.log("onFocus checkbox: %o", checkbox);
          }
        }
      }
   });
})(document, window, domIsReady);

  // 
  
</script>
<?php if($transactionExecutingCount > 0) : ?>
<script type="text/javascript">
  //function getJson(basisUrl, method, successFunction, errorFunction, timeoutFunction)
  g_transactionExecutionCount = <?= $transactionExecutingCount ?>;
  g_updateExecutionDisplayInterval = null;
  
  function updateTransactionExecutingDisplay(count) {
    var display = document.getElementById('transaction-execute-display');
    if(count > 0) {
      display.innerHTML = count + " ";
      if(count == 1) {
        display.innerHTML += "<?= __('Laufende Transaktion') ?>";
      } else {
        display.innerHTML += "<?= __('Laufende Transaktionen') ?>";
      }
    } else {
      display.innerHTML =  '<?= __('Alle Transaktionen abgeschlossen!') ?> <button class="grd-form-bn grd_clickable" onclick="location.reload()">Seite neuladen</button>';
    }
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
             //location.reload();
             updateTransactionExecutingDisplay(g_transactionExecutionCount);
           }
           if(newCount == 0) {
             clearInterval(g_updateExecutionDisplayInterval);
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
      //setTimeout(checkTransactionExecuting, 100);
      g_updateExecutionDisplayInterval = setInterval(checkTransactionExecuting, 100);
   });
})(document, window, domIsReady);
</script>
<?php endif; ?>