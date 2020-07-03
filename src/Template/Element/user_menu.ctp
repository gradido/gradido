<?php
/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
use Model\Navigation\NaviEntry;
$session = $this->getRequest()->getSession();
$user = $session->read('StateUser');
$this->set('user', $user);
$navi = [];
array_push($navi, new NaviEntry(__('Startseite'), 'home', 'Dashboard', 'index'));
array_push($navi, new NaviEntry(__('Startseite'), 'home', 'Dashboard', 'index'));
?>
<span class="user-name">
    <?=$user['first_name'].' '.$user['last_name']?>
</span>
<i class="material-icons-outlined user-icon">account_circle</i>
<div id="user-menu-id" class="nav-vertical user-menu">
    <ul>
        <?php foreach($navi as $n) echo $n; ?>
    </ul>
</div>