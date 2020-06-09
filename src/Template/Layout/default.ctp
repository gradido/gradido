<?php
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
    <div class="content-default">
        <div class="content-container info-container">
            <ul class="nav-horizontal nav-top-smaller">
                <li><?= $this->html->link(__('Logout'), ['controller' => 'ServerUsers', 'action' => 'logout'])?></li>
                <li><a target="_blank" href="https://book.cakephp.org/3.0/">Documentation</a></li>
                <li><a target="_blank" href="https://api.cakephp.org/3.0/">API</a></li>
            </ul>
            <h1><a href=""><?= $this->fetch('title') ?></a></h1>
            <?= $this->Flash->render() ?>
            <?= $this->fetch('content') ?>
        </div>
        <?php if(isset($timeUsed)) : ?>
        <div class="bottomleft">
            <?=  round($timeUsed * 1000.0, 4) ?> ms
        </div>
        <?php endif;?>
    </div>
</body>
</html>
