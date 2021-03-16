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
$this->loadHelper('Form', [
    'templates' => 'horizontal_form',
]);

use Cake\I18n\FrozenTime;

?>
<div class="action-form">
  <p class="form-header">Schöpfen</p>
  <div class="form-body">
  <?= $this->Form->create($creationForm) ?>
    <?php if($transactionExecutingCount > 0) : ?>
      <div id="transaction-execute-display"></div>
    <?php endif; ?>
    <div class="form-full-width">
      <div class="grid-row justify-end">
        <?= $this->Form->control('searchText', ['label' => __('Suche'), 'placeholder' => 'Email/Name']); ?>
        <?= $this->Form->button(__('Suchen'), ['name' => 'searchButton', 'class' => 'form-button']) ?>
      </div>
    </div>
    <?= $this->Form->control('memo', ['label' => __('Memo'), 'placeholder' => 'Memo']); ?>
    <?= $this->Form->control('amount', ['label' => __('Betrag in GDD'), 'required' => false]); ?>
    <?php
      $firstDayLastMonth = new FrozenTime();
      $firstDayLastMonth = $firstDayLastMonth->day(1)->subMonth(1);
    ?>
    <!--<div class="form-full-width">
      <div>
        <?= $this->Form->control('target_date', ['label' => __('Zieldatum'), 'value' => $firstDayLastMonth]); ?>
      </div>
    </div>--> <!-- onchange: change all dates accordingly.... nice to have -->
    <div class="form-full-width">
      <div>
        <button type="button" class="form-button" onclick="checkAll()" >Alle auswählen</button>
        <button type="button" class="form-button" onclick="uncheckAll()">Alle abwählen</button>
      </div>
    </div>
    <?php foreach($possibleReceivers as $possibleReceiver) :
      $disable = null;
      if($activeUser['id'] == $possibleReceiver['id'] || $possibleReceiver['amount'] > 30000000) {
        //$disable = 'disabled';
      }
      ?>
      <div class="form-full-width">
        <?php if(isset($possibleReceiver['pending'])) : ?>
          <?= $this->Form->hidden('user_pending[' . $possibleReceiver['id'] . ']', ['value' => $possibleReceiver['pending']] ) ?>
        <?php endif; ?>
        <div class="form-row">
          <div class="cell cell-dense c1">
            <?= $this->Form->checkbox('user[' .$possibleReceiver['id'] . ']',  ['value' => $possibleReceiver['id'], 'hiddenField' => false, $disable]); ?>
          </div>
          <div class="cell cell-dense c0">
            <?php if($disable != null) : ?>
            <span title="Du kannst leider nicht für dich selbst schöpfen."></span>
            <?php endif; ?>
            <a target="_blank" href="/state-users/view/<?= $possibleReceiver['id'] ?>">
              <?= $possibleReceiver['name'] ?>
              <?php if($possibleReceiver['email'] != '') : ?>
                &lt;<?= $possibleReceiver['email'] ?>&gt;
              <?php endif; ?>
            </a>
          </div>
          <div class="cell cell-dense c6">
            <?= $this->Form->text('user_amount[' . $possibleReceiver['id'] . ']', ['placeholder' => __('Für benutzerdefinierten Betrag'), 'class' => 'user_amount', 'type' => 'number', 'step' => '0.01', $disable]); ?> GDD
          </div>
          <div class="cell cell-dense c5">
            <?= $this->Form->date('user_target_date[' . $possibleReceiver['id'] . ']', ['value' => $firstDayLastMonth]) ?>
          </div>
        </div>
        <div class="grid-row">
        <?php if(isset($possibleReceiver['pending'])) : ?>
          <span class="note-smaller orange-color">
            Bereits als Transaktion angelegt: <?= $this->element('printGradido', ['number' => $possibleReceiver['pending']]);?>
          </span>
        <?php endif; ?>
        <?php if($possibleReceiver['amount'] != 0) : ?>
          <span class="note-smaller blue-color">
            In diesen und den letzten 2 Monaten bereits geschöpft (alte Berechnung): <?= $this->element('printGradido', ['number' => $possibleReceiver['amount']]);?>
          </span>
        <?php endif; ?>
        <?php if($possibleReceiver['amount2'] > 0) : ?>
          <span class="note-smaller blue-color">
            Im letzten Monat geschöpft (neue Berechnung): <?= $this->element('printGradido', ['number' => $possibleReceiver['amount2']]) ?>
          </span>
        <?php endif; ?>
        </div>
    </div>
  <?php endforeach; ?>
  <!--<?= $this->Form->control('receiver_pubkey_hex', []) ?>-->
  <div class="form-full-width">
    <?php if($countUsers > $limit) : ?>
      <p><?= $countUsers ?> Benutzer insgesamt</p>
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
      </p>
    <?php endif ?>
  </div>
  <div class="form-full-width">
    <div>
      <?= $this->Form->button(__('Transaktion(en) abschließen'), ['name' => 'next', 'class' => 'form-button' ]) ?>
      <?= $this->Form->button(__('Weitere Transaktion erstellen'), ['name' => 'add', 'class' => 'form-button']) ?>
    </div>
  </div>
  <?= $this->Form->end() ?>
  </div>
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
      display.innerHTML =  '<?= __('Alle Transaktionen abgeschlossen!') ?> <button class="form-button" onclick="location.reload()">Seite neuladen</button>';
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