<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
use Cake\I18n\FrozenTime;


function publisherLink($publisher, $the) {
  /*if(is_a($publisher, 'App\Model\Entity\Publisher')) {
    return $the->Html->link(h($publisher->email), ['controller' => 'GdtEntries', 'action' => 'viewPerEmail', $publisher->email], ['title' => $publisher->getNames()]);
  } else {
    return $the->Html->link(h($publisher), ['controller' => 'GdtEntries', 'action' => 'viewPerEmail', $publisher]);
  }*/
  if(is_array($publisher)) {
    return h($publisher['email']);
  }
  else {
    return h($publisher);
  }
  //return json_encode($publisher);
}

$this->assign('title', __('GDT Kontoübersicht'));

$header = '<h3>' . __('Zur Verfügung: ') . '</h3>';
if($gdtSum > 0){
  $header .= '<h2>'.$this->element('printGDT', ['number' => $gdtSum]).'</h2>';
}
$this->assign('header', $header);
?>
<?php if(isset($ownEntries) && count($ownEntries) > 0) :?>
<div class="content-list">
  <p class="content-list-title"><?= __('Eigene Einzahlungen') ?></p>
  <div class="content-list-table">
    <div class="row">
      <div class="cell header-cell c3"><?= __('E-Mail') ?></div>
      <div class="cell header-cell c3"><?= __('Datum') ?></div>
      <div class="cell header-cell c0"><?= __('Kommentar') ?></div>
      <div class="cell header-cell c3"><?= __('Euro') ?></div>
      <div class="cell header-cell c2"><?= __('Factor')?></div>
      <div class="cell header-cell c3"><?= __('GDT') ?></div>
    </div>
    <?php foreach($ownEntries as $entry) : ?>
    <div class="row">
      <div class="cell c3"><?= $entry['email'] ?></div>
      <div class="cell c3"><?= new FrozenTime($entry['date']) ?></div>
      <div class="cell c0"><?= h($entry['comment']) ?></div>
      <div class="cell c3">
        <?= $this->element('printEuro', ['number' => $entry['amount']]); ?>
        <?php if($entry['amount2']) echo ' + ' . $this->element('printEuro', ['number' => $entry['amount2']]) ?>
      </div>
      <div class="cell c2">
      <?= $this->Number->format($entry['factor']) ?>
      <?php if($entry['factor2'] != '1') : ?> x
        <?= $this->Number->format($entry['factor2']) ?>
      <?php endif; ?>
      </div>
      <div class="cell c3"><?= $this->element('printGDT', ['number' => $entry['gdt']]) ?></div>
    </div>
    <?php endforeach; ?>
  </div>
</div>
<?php endif; ?>
<?php if(isset($connectEntries) && count($connectEntries) > 0) : ?>
<div class="content-list">
  <p class="content-list-title"><?= __('Einzahlungen anderer (Publisherprogramm)') ?></p>
  <div class="content-list-table">
    <div class="row">
      <div class="cell header-cell c0"><?= __('Einzahlender') ?></div>
      <div class="cell header-cell c3"><?= __('Datum') ?></div>
      <div class="cell header-cell c3"><?= __('Euro') ?></div>
      <div class="cell header-cell c2"><?= __('Factor')?></div>
      <div class="cell header-cell c3"><?= __('GDT') ?></div>
    </div>
    <?php foreach($connectEntries as $entry) :
      $elopageTransaction = $entry['connect']['elopage_transaction'];
      $gdtEntry = $entry['connect']['gdt_entry'];
    ?>
    <div class="row">
      <div class="cell c0">
        <?= $elopageTransaction['email'] ?>
        <?php foreach($entry['publishersPath'] as $c => $publisher) : ?>
           ->
          <?= publisherLink($publisher, $this) ?>
        <?php endforeach; ?>
      </div>
      <!--<div class="cell c0"><?= h($elopageTransaction['email']) ?></div>-->
      <div class="cell c3"><?= new FrozenTime($gdtEntry['date']) ?></div>
      <div class="cell c3">
          <?= $this->element('printEuro', ['number' => $gdtEntry['amount']]) ?>
          <?php if($gdtEntry['amount2']) echo ' + ' . $this->element('printEuro', ['number' => $gdtEntry['amount2']]) ?>
      </div>
      <div class="cell c2">
        <?= $this->Number->format($gdtEntry['factor']) ?>
        <?php if($gdtEntry['factor2'] != '1') : ?> x
          <?= $this->Number->format($gdtEntry['factor2']) ?>
        <?php endif; ?>
      </div>
      <div class="cell c3"><?= $this->element('printGDT', ['number' => $gdtEntry['gdt']]) ?></div>
    </div>
    <?php endforeach; ?>
  </div>
</div>
<?php endif; ?>
<?= $this->Html->css(['gdt.css']) ?>