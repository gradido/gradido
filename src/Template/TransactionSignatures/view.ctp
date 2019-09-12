<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionSignature $transactionSignature
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit Transaction Signature'), ['action' => 'edit', $transactionSignature->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete Transaction Signature'), ['action' => 'delete', $transactionSignature->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionSignature->id)]) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Signatures'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Signature'), ['action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="transactionSignatures view large-9 medium-8 columns content">
    <h3><?= h($transactionSignature->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Transaction') ?></th>
            <td><?= $transactionSignature->has('transaction') ? $this->Html->link($transactionSignature->transaction->id, ['controller' => 'Transactions', 'action' => 'view', $transactionSignature->transaction->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($transactionSignature->id) ?></td>
        </tr>
    </table>
</div>
