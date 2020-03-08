<?php 
use Model\Navigation\NaviEntry;
use Model\Navigation\NaviEntrySub;
use Model\Navigation\NaviEntryAbsoluteLink;
use Model\Navigation\NaviEntryExternLink;

$session = $this->getRequest()->getSession();
$transactionPendings = $session->read('Transactions.pending');
$errorCount = intval($session->read('StateUser.errorCount'));
$balance = $session->read('StateUser.balance');
//echo "balance: $balance<br>";
if(!isset($balance)) {
  $balance = 0;
}



$navi = [];
/*if($errorCount > 0) {
  $errorNaviEntry = new NaviEntry(__('Fehler '). "($errorCount)", 'mdi-alert-outline', 'StateErrors', 'showForUser');
  $errorNaviEntry->setBGColor('bg-inverse-danger')
                 ->setIconColor('grd-alert-color');
  array_push($navi, $errorNaviEntry);
}*/
$balanceNaviEntry = new NaviEntry(
        __('Kontoübersicht') . ' (' . $this->element('printGradido', ['number' => $balance]) . ')',
        //__('Kontoübersicht'),
        'mdi-wallet-outline', 'StateBalances', 'overview'
);
if($balance < 0 ) {
  //$balanceNaviEntry->setIconColor('grd-alert-color');
} else if($balance > 0) {
  //$balanceNaviEntry->setIconColor('grd-success-color');
}
array_push($navi, $balanceNaviEntry);
array_push($navi, new NaviEntry(__('Startseite'), 'mdi-gauge', 'Dashboard', 'index'));
array_push($navi, new NaviEntry(__('Überweisung'), 'mdi-bank-transfer-out', 'TransactionSendCoins', 'create'));
array_push($navi, new NaviEntryExternLink(__('Mitgliederbereich'), 'mdi-account-switch', 'https://elopage.com/s/gradido/sign_in'));

if(intval($transactionPendings) > 0) {
/*  array_push($navi, new NaviEntryAbsoluteLink(
            __("Transaktionen unterzeichnen") . '&nbsp;(' . intval($transactionPendings) . ')',
            'mdi-signature-freehand', 'account/checkTransactions'
         ));*/
} else {
  array_push($navi, new NaviEntryAbsoluteLink(__('Abmelden'), 'mdi-logout', 'account/logout'));
}

    
?>
<ul class="navigation-menu">
  <?php foreach($navi as $n) echo $n; ?>
</ul>