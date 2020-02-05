<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\Transaction[]|\Cake\Collection\CollectionInterface $transactions
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
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
<div class="transactions index large-9 medium-8 columns content">
    <h3><?= __('Transactions') ?></h3>
    <table cellpadding="0" cellspacing="0" style="table-layout: auto">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('memo') ?></th>
                <th scope="col"><?= $this->Paginator->sort('transaction_type_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('received') ?></th>
                
            </tr>
        </thead>
        <tbody>
            <?php foreach ($transactions as $transaction): ?>
            <tr>
                <td><?= $this->Number->format($transaction->id) ?></td>
                <td><?= h($transaction->memo) ?></td>
                <td><?= $transaction->has('transaction_type') ? $this->Html->link(__($transaction->transaction_type->name), ['controller' => 'TransactionTypes', 'action' => 'view', $transaction->transaction_type->id]) : '' ?></td>
                <td><?= h($transaction->received) ?></td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    <div class="paginator">
        <ul class="pagination">
            <?= $this->Paginator->first('<< ' . __('first')) ?>
            <?= $this->Paginator->prev('< ' . __('previous')) ?>
            <?= $this->Paginator->numbers() ?>
            <?= $this->Paginator->next(__('next') . ' >') ?>
            <?= $this->Paginator->last(__('last') . ' >>') ?>
        </ul>
        <p><?= $this->Paginator->counter(['format' => __('Page {{page}} of {{pages}}, showing {{current}} record(s) out of {{count}} total')]) ?></p>
    </div>
</div>
