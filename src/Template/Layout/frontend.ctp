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
if(!isset($balance)) {
  $balance = 0;
}
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
    <?= $this->Html->css('main.css') ?>
    <?= $this->Html->script('fa-all.min.js') ?>
    <?= $this->fetch('meta') ?>
    <?= $this->fetch('css') ?>
    <?= $this->fetch('script') ?>
</head>
<body>
  <div class="layout">
    <div class="header">
      <?= $this->Html->image(
        'logo_schrift.png',
        ['alt' => 'Gradido'],
        ['class' => 'logo']
      )
      ?>
      <h1><?= $this->fetch('title') ?></h1>
      <nav class="nav-top nav-horizontal">
        <ul>
          <li>Mein Profil XXX</li>
        </ul>
      </nav>
    </div>
    <div class="sidebar1">
      <div>
        <div class="sidebar1-header">
            Navigation
        </div>
        <div class="nav-vertical">
          <ul>
            <?php if($errorCount > 0) : ?>
              <li>
                <?= $this->Html->Link(
                    __('Fehler '). "($errorCount)",
                    ['controller' => 'StateErrors',
                    'action' => 'showForUser'],
                    ['class' => 'grd-nav-bn grd-nav-bn-discard']) ?>
              </li>
              <?php endif; ?>
              <?php if(isset($balance)) : ?>
                <li><i class="fa fa-list nav-icon"></i>
                  <?= $this->Html->link(
                    $this->element('printGradido', ['number' => $balance]),
                      ['controller' => 'StateBalances', 'action' => 'overview'],
                      ['class' => 'grd-nav-bn', 'escape' => false])
                    ?>
                </li>
              <?php endif; ?>
                <li><i class="fa fa-home nav-icon"></i>
                  <?= $this->Html->link(
                    __('Startseite'),
                    ['controller' => 'Dashboard', 'action' => 'index'],
                    ['class' => 'grd-nav-bn'])?>
                </li>
                <li><i class="fa fa-user-friends nav-icon"></i>
                  <a href="https://elopage.com/s/gradido/sign_in" target="_blank" class="grd-nav-bn">
                    <?= __("Mitgliederbereich") ?>
                  </a>
              </li>
              <?php if(intval($transactionPendings) > 0) : ?>
                <li>
                  <a href="<?= Router::url('./', true) ?>account/checkTransactions" class="grd-nav-bn">
                    <?= __("Transaktionen unterzeichnen") . '&nbsp;(' . intval($transactionPendings) . ')'?>
                  </a>
                </li>
              <?php else: ?>
                <li><i class="fa fa-sign-out-alt nav-icon"></i>
                  <a href="<?= Router::url('./', true) ?>account/logout" class="grd-nav-bn"><?= __("Logout"); ?></a>
                </li>
              <?php endif; ?>
          </ul>
        </div>
      </div>
    </div>
    <div class="content">
      <div class="flash-messages"><?= $this->Flash->render() ?></div>
      <?= $this->fetch('content') ?>
    </div>
    <div class="sidebar2">
      <p><?= __("Community Server in Entwicklung") ?></p>
      <p>Alpha 0.21.KW21.05</p>
    </div>
    <div class="bottomleft">
      <?php if(isset($timeUsed)) : ?>
        <p>
          <?=round($timeUsed * 1000.0, 4)?> ms
        </p>
      <?php endif; ?>
    </div>
    <div class="nav-bottom">
      <small class="">Copyright © 2020 Gradido</small>
    </div>
    <div class="footer nav-horizontal">
      <ul>
        <li><a href="https://gradido.net/de/datenschutz/" target="_blank"><?= __("Datenschutzerklärung") ?></a></li>
        <li><a href="https://gradido.net/de/impressum/" target="_blank"><?= __("Impressum") ?></a></li>
      </ul>
    </div>
  </div>
</body>
</html>
