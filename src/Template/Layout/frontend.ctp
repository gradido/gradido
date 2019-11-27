<?php
use Cake\Routing\Router;

/**
 * CakePHP(tm) : Rapid Development Framework (https://cakephp.org)
 * Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 * @link          https://cakephp.org CakePHP(tm) Project
 * @since         0.10.0
 * @license       https://opensource.org/licenses/mit-license.php MIT License
 */



$cakeDescription = 'Gradido';
$session = $this->getRequest()->getSession();
$transactionPendings = $session->read('Transactions.pending');
$errorCount = intval($session->read('StateUser.errorCount'));
$balance = $session->read('StateUser.balance');
//echo "balance: $balance<br>";
if(!isset($balance)) {
  $balance = 0;
}
//echo "balance: $balance<br>";
//echo "transactions pending: " . $transactionPendings;
?>
<!DOCTYPE html>
<html>
<head>
    <?= $this->Html->charset() ?>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>
        <?= $cakeDescription ?>:
        <?= $this->fetch('title') ?>
    </title>
    <?= $this->Html->meta('icon') ?>

    <!--<?= $this->Html->css('base.css') ?>-->
    <?= $this->Html->css('styles.css') ?>

    <?= $this->fetch('meta') ?>
    <?= $this->fetch('css') ?>
    <?= $this->fetch('script') ?>
</head>
<body>
    <div class="versionstring dev-info">
      <p class="grd_small">Community Server in Entwicklung</p>
      <p class="grd_small">Alpha 0.6.0</p>
    </div>
    <nav class="grd-left-bar expanded" data-topbar role="navigation">
        <div class="grd-left-bar-section">
            <ul class="grd-no-style">
              <?php if($errorCount > 0) : ?>
              <li>
                <?= $this->Html->Link(__('Fehler '). "($errorCount)", ['controller' => 'StateErrors', 'action' => 'showForUser'], ['class' => 'grd-nav-bn grd-nav-bn-discard']) ?>
              </li>
              <?php endif; ?>
              <?php if(isset($balance)) : ?>
                <li><?= $this->Html->link($this->element('printGradido', ['number' => $balance]), 
                        ['controller' => 'StateBalances', 'action' => 'overview'], ['class' => 'grd-nav-bn grd-nav-without-border', 'escape' => false])
                    ?>
                </li>
              <?php endif; ?>
              <li><?= $this->Html->link(__('Startseite'), ['controller' => 'Dashboard'], ['class' => 'grd-nav-bn'])?>
              <!--<li><?= $this->Html->link(__('Kontostand'), ['controller' => 'StateBalances', 'action' => 'overview'], ['class' => 'grd-nav-bn']) ?>-->
              <?php if(intval($transactionPendings) > 0) : ?>
                <li>
                  <a href="<?= Router::url('./', true) ?>account/checkTransactions" class="grd-nav-bn">
                    <?= __("Transaktionen unterzeichnen") . '&nbsp;(' . intval($transactionPendings) . ')'?>
                  </a>
                </li>
              <?php else: ?>
                 <li><a href="<?= Router::url('./', true) ?>account/logout" class="grd-nav-bn"><?= __("Logout"); ?></a></li>
              <?php endif; ?>
            </ul>
        </div>
    </nav>
    <div class="grd_container">
      <h1><?= $this->fetch('title') ?></h1>
      <div class="flash-messages"><?= $this->Flash->render() ?></div>
      <?= $this->fetch('content') ?>
    </div>
    <?php if(isset($timeUsed)) : ?>
      <div class="grd-time-used dev-info">
        <?=  round($timeUsed * 1000.0, 4) ?> ms
      </div>
    <?php endif; ?>
</body>
</html>
