<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\Transaction[]|\Cake\Collection\CollectionInterface $transactions
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Groups'), ['controller' => 'StateGroups', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State Group'), ['controller' => 'StateGroups', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Types'), ['controller' => 'TransactionTypes', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Type'), ['controller' => 'TransactionTypes', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Created'), ['controller' => 'StateCreated', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State Created'), ['controller' => 'StateCreated', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Creations'), ['controller' => 'TransactionCreations', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Creation'), ['controller' => 'TransactionCreations', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Group Addaddress'), ['controller' => 'TransactionGroupAddaddress', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Group Addaddres'), ['controller' => 'TransactionGroupAddaddress', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Group Allowtrades'), ['controller' => 'TransactionGroupAllowtrades', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Group Allowtrade'), ['controller' => 'TransactionGroupAllowtrades', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Group Creates'), ['controller' => 'TransactionGroupCreates', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Group Create'), ['controller' => 'TransactionGroupCreates', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Send Coins'), ['controller' => 'TransactionSendCoins', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Send Coin'), ['controller' => 'TransactionSendCoins', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Signatures'), ['controller' => 'TransactionSignatures', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Signature'), ['controller' => 'TransactionSignatures', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="content-list transactions">
    <div class="content-list-table transactions">
        <div class="row">
            <div class="cell header-cell"><?= $this->Paginator->sort('id') ?></div>
            <div class="cell header-cell"><?= $this->Paginator->sort('memo') ?></div>
            <div class="cell header-cell"><?= $this->Paginator->sort('transaction_type_id') ?></div>
            <div class="cell header-cell"><?= $this->Paginator->sort('received') ?></div>
        </div>
        <?php foreach ($transactions as $transaction): ?>
            <div class="row">
                <div class="cell"><?= $this->Number->format($transaction->id) ?></div>
                <div class="cell"><?= h($transaction->memo) ?></div>
                <div class="cell"><?= $transaction->has('transaction_type') ? $this->Html->link(__($transaction->transaction_type->name), ['controller' => 'TransactionTypes', 'action' => 'view', $transaction->transaction_type->id]) : '' ?></div>
                <div class="cell"><?= h($transaction->received) ?></div>
            </div>
        <?php endforeach; ?>
    </div>
    <div>
        <ul class="nav-horizontal pagination">
            <?= $this->Paginator->first('<< ' . __('first')) ?>
            <?= $this->Paginator->prev('< ' . __('previous')) ?>
            <?= $this->Paginator->numbers() ?>
            <?= $this->Paginator->next(__('next') . ' >') ?>
            <?= $this->Paginator->last(__('last') . ' >>') ?>
        </ul>
        <p><?= $this->Paginator->counter(['format' => __('Page {{page}} of {{pages}}, showing {{current}} record(s) out of {{count}} total')]) ?></p>
    </div>
</div>
