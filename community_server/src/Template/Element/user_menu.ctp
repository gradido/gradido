<?php
/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
use Model\Navigation\NaviEntry;
use Model\Navigation\NaviEntryAbsoluteLink;

$session = $this->getRequest()->getSession();
$user = $session->read('StateUser');
$transactionPendings = $session->read('Transactions.pending');
$this->set('user', $user);
$navi = [];
array_push($navi, new NaviEntry(__('Mein Profil'), 'build', 'Profile', 'index'));
if(intval($transactionPendings) > 0) {
/*  array_push($navi, new NaviEntryAbsoluteLink(
            __("Transaktionen unterzeichnen") . '&nbsp;(' . intval($transactionPendings) . ')',
            'mdi-signature-freehand', 'account/checkTransactions'
         ));*/
} else {
  array_push($navi, new NaviEntryAbsoluteLink(__('Abmelden'), 'exit_to_app', 'account/logout'));
}
?>
<div class="user-menu-container">
    <span class="user-name" onclick="toggleUserMenu()"><?=$user['first_name'].' '.$user['last_name']?></span>
    <i class="material-icons-outlined user-icon" onclick="toggleUserMenu()">account_circle</i>
</div>
<div class="nav-vertical user-menu">
    <ul>
        <?php foreach($navi as $n) echo $n; ?>
    </ul>
</div>
<script type="text/javascript">
    function toggleUserMenu() {
        let a = document.getElementsByClassName("user-menu");
        if(a.length > 0) {
            let menu = a[0];
            console.log('click icon');
            menu.classList.toggle("visible");
        }
    };
</script>