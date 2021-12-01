<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionState $transactionState
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit Transaction State'), ['action' => 'edit', $transactionState->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete Transaction State'), ['action' => 'delete', $transactionState->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionState->id)]) ?> </li>
        <li><?= $this->Html->link(__('List Transaction States'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction State'), ['action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="transactionStates view large-9 medium-8 columns content">
    <h3><?= h($transactionState->name) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Name') ?></th>
            <td><?= h($transactionState->name) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Text') ?></th>
            <td><?= h($transactionState->text) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($transactionState->id) ?></td>
        </tr>
    </table>
    <div class="related">
        <h4><?= __('Related Transactions') ?></h4>
        <?php if (!empty($transactionState->transactions)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('State Group Id') ?></th>
                <th scope="col"><?= __('Transaction Type Id') ?></th>
                <th scope="col"><?= __('Tx Hash') ?></th>
                <th scope="col"><?= __('Memo') ?></th>
                <th scope="col"><?= __('Received') ?></th>
                <th scope="col"><?= __('Blockchain Type Id') ?></th>
                <th scope="col"><?= __('Transaction State Id') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($transactionState->transactions as $transactions): ?>
            <tr>
                <td><?= h($transactions->id) ?></td>
                <td><?= h($transactions->state_group_id) ?></td>
                <td><?= h($transactions->transaction_type_id) ?></td>
                <td><?= h($transactions->tx_hash) ?></td>
                <td><?= h($transactions->memo) ?></td>
                <td><?= h($transactions->received) ?></td>
                <td><?= h($transactions->blockchain_type_id) ?></td>
                <td><?= h($transactions->transaction_state_id) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'Transactions', 'action' => 'view', $transactions->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'Transactions', 'action' => 'edit', $transactions->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'Transactions', 'action' => 'delete', $transactions->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactions->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
</div>
