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
$gdtSumFromEmails = 0;
foreach($gdtSumPerEmail as $email => $gdt) {
  $gdtSumFromEmails += $gdt;
}
?>
<div class="row">
  <div class="col-md-8 equel-grid">
    <div class="grid">
      <div class="grid-body py-3">
        <h3><?= __('Zur Verfügung: ') ?></h3>
        <?php if($gdtSum > 0) : ?>
          <h2><?= $this->element('printGDT', ['number' => $gdtSumFromEmails]) ?></h2>
        <?php endif; ?>
        <?php if($moreEntrysAsShown) : ?>
          <span><?= __('Nur die letzten 100 Einträge werden angezeigt!'); ?></span>
        <?php endif; ?>
      </div>
    </div>
  </div>
</div>
<?php if(isset($ownEntries) && count($ownEntries) > 0) :?>
<div class="row">
  <div class="col-md-12 equel-grid">
    <div class="grid">
      <div class="grid-body py-3">
        <p class="card-title ml-n1"><?= __('Eigene Einzahlungen') ?></p>
      </div>
      <div class="table-responsive">
        <table class="table table-hover table-sm">
          <thead>
            <tr class="solid-header">
              <th class="pl-4"><?= __('Euro') ?></th>
              <th><?= __('Factor')?></th>
              <th><?= __('GDT') ?></th>
              <th><?= __('Datum') ?></th>
              <th><?= __('Kommentar') ?></th>
              <th><?= __('E-Mail') ?></th>
            </tr>
          </thead>
          <tbody>
            <?php foreach($ownEntries as $entry) : ?>
            <tr>
              <td>
                  <?= $this->element('printEuro', ['number' => $entry['amount']]); ?>
                  <?php if($entry['amount2']) echo ' + ' . $this->element('printEuro', ['number' => $entry['amount2']]) ?>
              </td>
              <td>
                <?= $this->Number->format($entry['factor']) ?> 
                <?php if($entry['factor2'] != '1') : ?> x 
                  <?= $this->Number->format($entry['factor2']) ?>
                <?php endif; ?>
              </td>
              <td><?= $this->element('printGDT', ['number' => $entry['gdt']]) ?></td>
              <td><?= new FrozenTime($entry['date']) ?></td>
              <td><?= h($entry['comment']) ?></td>
              <td><?= $entry['email'] ?></td>
            </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
<?php endif; ?>
<?php if(isset($connectEntries) && count($connectEntries) > 0) : ?>
<div class="row">
  <div class="col-md-12 equel-grid">
    <div class="grid">
      <div class="grid-body py-3">
        <p class="card-title ml-n1"><?= __('Einzahlungen anderer (Publisherprogramm)') ?></p>
      </div>
      <div class="table-responsive">
        <table class="table table-hover table-sm">
          <thead>
            <tr class="solid-header">
              <!--<th class="pl-4"><?= __('Einzahlender') ?></th>-->
              <th class="pl-4"><?= __('Euro') ?></th>
              <th><?= __('Factor') ?></th>
              <th><?= __('GDT')?></th>
              <th><?= __('Datum') ?></th>
              <th><?= __('E-Mail') ?></th>
            </tr>
          </thead>
          <tbody>
            <?php foreach($connectEntries as $entry) : 
              $elopageTransaction = $entry['connect']['elopage_transaction'];
              $gdtEntry = $entry['connect']['gdt_entry'];
              ?>
             <!-- <tr><td colspan="5">
                    <?= $elopageTransaction['email'] ?>
                      <?php foreach($entry['publishersPath'] as $c => $publisher) : ?>
                         -> 
                        <?= publisherLink($publisher, $this) ?>
                        
                        
                      <?php endforeach; ?>
                  </td>
              </tr>-->
              <tr>
                <!--<td><?= h($elopageTransaction['email']) ?></td>-->
                <td><?= new FrozenTime($gdtEntry['date']) ?></td>
                <td>
                    <?= $this->element('printEuro', ['number' => $gdtEntry['amount']]) ?>
                    <?php if($gdtEntry['amount2']) echo ' + ' . $this->element('printEuro', ['number' => $gdtEntry['amount2']]) ?>
                </td>
                <td>
                  <?= $this->Number->format($gdtEntry['factor']) ?> 
                  <?php if($gdtEntry['factor2'] != '1') : ?> x 
                    <?= $this->Number->format($gdtEntry['factor2']) ?>
                  <?php endif; ?>
                </td>
                <td><?= $this->element('printGDT', ['number' => $gdtEntry['gdt']]) ?></td>
                <td data-tippy-content="<?= $elopageTransaction['email'] ?>
                      <?php foreach($entry['publishersPath'] as $c => $publisher) : ?>
                         -><br>
                        <?= publisherLink($publisher, $this) ?>
                         <?php if($publisher['email'] == $user['email']) break ?>
                      <?php endforeach; ?>"><?= $elopageTransaction['email'] ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
<?php endif; ?>
<?= $this->Html->css(['gdt.css']) ?>
<?= $this->Html->script(['basic', 'popper.min', 'tippy-bundle.umd.min']) ?>
<script type="text/javascript">
  domIsReady(function() {
    tippy('[data-tippy-content]', {
      placement: 'top-start',
      allowHTML: true,
    });
  });
</script>