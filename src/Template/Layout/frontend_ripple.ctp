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

    <?= $this->Html->css(['rippleUI/style.css', 'materialdesignicons.min.css']) ?>
    <?= $this->Html->script(['basic']) ?>
    <?= $this->fetch('meta') ?>
    <?= $this->fetch('css') ?>
    <?= $this->fetch('script') ?>
</head>
<body class="header-fixed">
    <div class="versionstring dev-info">
        <p class="grd_small"><?= __("Community Server in Entwicklung") ?></p>
        <p class="grd_small">Alpha 0.11.0</p>
    </div>
    <nav class="t-header">
      <div class="t-header-brand-wrapper">
        <a href="/">
          <picture class="logo">
            <source srcset="/img/logo_schrift_half.webp" type="image/webp">
            <source srcset="/img/logo_schrift_half.png" type="image/png"> 
            <img src="/img/logo_schrift_half.png" class="logo" alt="Logo">
          </picture>
          <picture class="logo-mini">
            <source srcset="/img/logo_half.webp" type="image/webp">
            <source srcset="/img/logo_half.png" type="image/png"> 
            <img src="/img/logo_half.png" class="logo-mini" alt="Logo">
          </picture>
        </a>
        <button class="t-header-toggler t-header-desk-toggler d-none d-lg-block">
          <svg class="logo" viewBox="0 0 200 200">
            <path class="top" d="
                M 40, 80
                C 40, 80 120, 80 140, 80
                C180, 80 180, 20  90, 80
                C 60,100  30,120  30,120
              "></path>
            <path class="middle" d="
                M 40,100
                L140,100
              "></path>
            <path class="bottom" d="
                M 40,120
                C 40,120 120,120 140,120
                C180,120 180,180  90,120
                C 60,100  30, 80  30, 80
              "></path>
          </svg>
        </button>
      </div>
      <div class="t-header-content-wrapper">
        <div class="t-header-content">
          <button class="t-header-toggler t-header-mobile-toggler d-block d-lg-none">
            <i class="mdi mdi-menu"></i>
          </button>
          <div class="flash-messages" style="margin-left:20px; margin-top:30px;">
            <?= $this->Flash->render() ?>
          </div>
          <?= $this->element('navi_header'); ?>
        </div>
      </div>
    </nav>
    <div class="page-body">
      <!-- partial:partials/_sidebar.html -->
      <div class="sidebar">
        <?= $this->element('navi'); ?>
      </div>
      <div class="page-content-wrapper">
        <div class="page-content-wrapper-inner">
          <div class="viewport-header">
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb has-arrow">
                <li class="breadcrumb-item">
                  <?= $this->Html->link(__('Startseite'), ['controller' => 'Dashboard']); ?>
                </li>
                <li class="breadcrumb-item active" aria-current="page"><?= $this->fetch('title') ?></li>
              </ol>
            </nav>
          </div>
          <div class="content-viewport">
              <?= $this->fetch('content') ?>
          </div>
          </div>
        <!-- content viewport ends -->
        <!-- partial:partials/_footer.html -->
        <footer class="footer">
          <div class="row">
            <div class="col-sm-6 text-center text-sm-right order-sm-1">
              <ul class="text-gray">
                <li><a href="#">Terms of use</a></li>
                <li><a href="#">Privacy Policy</a></li>
              </ul>
            </div>
            <div class="col-sm-6 text-center text-sm-left mt-3 mt-sm-0">
              <small class="text-muted d-block">Copyright © 2019 Gradido</small>
            </div>
          </div>
        </footer>
        <!-- partial -->
      </div>
      <!-- page content ends -->
    </div>
    <?php if(isset($timeUsed)) : ?>
      <div class="grd-time-used dev-info">
        <?=  round($timeUsed * 1000.0, 4) ?> ms
      </div>
    <?php endif; ?>
  </body>
</html>