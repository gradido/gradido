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
      <p class="grd_small">Alpha 0.4.2</p>
    </div>
    <nav class="grd-left-bar expanded" data-topbar role="navigation">
        <div class="grd-left-bar-section">
            <ul class="grd-no-style">
              <li><?= $this->Html->link(__('Startseite'), ['controller' => 'dashboard'], ['class' => 'grd-nav-bn'])?>
              
              <?php if(intval($transactionPendings) > 0) : ?>
                <li>
                  <a href="<?= Router::url('/', true) ?>account/checkTransactions" class="grd-nav-bn">
                    <?= __("Transaktionen unterzeichnen") . '&nbsp;(' . intval($transactionPendings) . ')'?>
                  </a>
                </li>
              <?php else: ?>
                 <li><a href="<?= Router::url('/', true) ?>account/logout" class="grd-nav-bn"><?= __("Logout"); ?></a></li>
              <?php endif; ?>
            </ul>
        </div>
    </nav>
    <div class="grd_container">
      <h1><?= $this->fetch('title') ?></h1>
      <div class="flash-messages"><?= $this->Flash->render() ?></div>
      <?= $this->fetch('content') ?>
    </div>
    <div class="grd-time-used dev-info">
      <?=  round($timeUsed * 1000.0, 4) ?> ms
    </div>
</body>
</html>
