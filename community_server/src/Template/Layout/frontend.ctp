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
$GLOBALS["self"] = $this;

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
    <?= $this->Html->css(['main.css']) ?>
    <?= $this->Html->script(['basic']) ?>
    <?= $this->fetch('meta') ?>
    <?= $this->fetch('css') ?>
    <?= $this->fetch('script') ?>
</head>
<body>
  <div class="layout">
    <div class="header-notify">
      <?= $this->element('navi_notify'); ?>
    </div>
    <div class="header-user">
      <?= $this->element('user_menu'); ?>
    </div>
    <div>
      <i id="nav-action-mobile" class="material-icons-outlined nav-main-button mobile">menu</i>
    </div>
    <picture class="logo mobile">
      <source srcset="/img/logo_half.webp" type="image/webp">
      <source srcset="/img/logo_half.png" type="image/png">
      <img src="/img/logo_half.png" class="logo" alt="Logo">
    </picture>
    <div class="sidebar1 nav-menu initial">
    <!-- TODO save last sidebar state so that it remains unchanged, on reload! -->
      <a href="/">
        <picture class="logo big visible">
          <source srcset="/img/logo_schrift_half.webp" type="image/webp">
          <source srcset="/img/logo_schrift_half.png" type="image/png">
          <img src="/img/logo_schrift_half.png" class="logo big visible" alt="Logo">
        </picture>
        <picture class="logo small">
          <source srcset="/img/logo_half.webp" type="image/webp">
          <source srcset="/img/logo_half.png" type="image/png">
          <img src="/img/logo_half.png" class="logo small" alt="Logo">
        </picture>
      </a>
      <div>
        <i id="nav-action" class="material-icons-outlined nav-main-button">menu</i>
      </div>
      <div class="nav-vertical">
        <ul>
        <?= $this->element('navi'); ?>
        </ul>
      </div>
    </div>
    <div class="nav-content">
      <div class="flash-messages" onclick="this.classList.add('hidden')">
        <?= $this->Flash->render() ?>
      </div>
      <?= $this->element('navi_center'); ?>
    </div>
    <div class="content">
      <?php if ($this->fetch('header')): ?>
      <div class="content-container info-container">
        <?= $this->fetch('header') ?>
      </div>
      <?php endif;?>
      <div class="content-container main-container">
        <?= $this->fetch('content') ?>
      </div>
    </div>
    <div class="footer">
      <ul class="nav-horizontal">
        <li><a href="https://gradido.net/de/datenschutz/" target="_blank"><?= __("Datenschutzerklärung") ?></a></li>
        <li><a href="https://gradido.net/de/impressum/" target="_blank"><?= __("Impressum") ?></a></li>
      </ul>
    </div>
    <div class="nav-bottom">
      <p>Copyright © 2020 Gradido</p>
    </div>
    <div class="bottomleft">
      <?php if(isset($timeUsed)) : ?>
        <?=round($timeUsed * 1000.0, 4)?> ms
      <?php endif; ?>
    </div>
    <div class="bottomright">
      <p><?= __("Community Server in Entwicklung") ?></p>
      <p>Alpha 0.20.06.03</p>
    </div>
  </div>
</body>
</html>