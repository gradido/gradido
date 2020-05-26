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
    <?= $this->Html->css(
      [
        'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined',
        'main.css'
      ]
    ) ?>
    <?= $this->Html->script(['basic']) ?>
    <?= $this->fetch('meta') ?>
    <?= $this->fetch('css') ?>
    <?= $this->fetch('script') ?>
</head>
<body>
  <div class="layout">
    <div class="header">
      <a href="/">
        <picture class="logo">
          <source srcset="/img/logo_schrift_half.webp" type="image/webp">
          <source srcset="/img/logo_schrift_half.png" type="image/png">
          <img src="/img/logo_schrift_half.png" class="logo" alt="Logo">
        </picture>
        <!--picture class="logo-mini">
          <source srcset="/img/logo_half.webp" type="image/webp">
          <source srcset="/img/logo_half.png" type="image/png">
          <img src="/img/logo_half.png" class="logo-mini" alt="Logo">
        </picture-->
      </a>
      <h1><?= $this->fetch('title') ?></h1>
      <nav class="nav-top nav-horizontal">
        <ul>
          <li>Mein Profil</li>
        </ul>
      </nav>
    </div>
    <div class="sidebar1">
      <div>
        <div class="sidebar1-header">
            <i class="material-icons-outlined nav-main-button">menu</i>
            <i class="mdi mdi-menu"></i>
            <div class="flash-messages">
              <?= $this->Flash->render() ?>
            </div>
            <?= $this->element('navi_header'); ?>
        </div>
        <div class="nav-vertical">
          <?= $this->element('navi'); ?>
        </div>
      </div>
    </div>
    <div class="content">
      <?= $this->Html->link(__('Startseite'), ['controller' => 'Dashboard']); ?>
      <?= $this->fetch('content') ?>
    </div>
    <div class="sidebar2">
      <p><?= __("Community Server in Entwicklung") ?></p>
      <p>Alpha 0.21.KW21.05</p>
    </div>
    <div class="bottomleft">
      <?php if(isset($timeUsed)) : ?>
        <p class="grd-time-used">
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