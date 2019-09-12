<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateUser[]|\Cake\Collection\CollectionInterface $stateUsers
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New State User'), ['action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Groups'), ['controller' => 'StateGroups', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State Group'), ['controller' => 'StateGroups', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Balances'), ['controller' => 'StateBalances', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State Balance'), ['controller' => 'StateBalances', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Created'), ['controller' => 'StateCreated', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State Created'), ['controller' => 'StateCreated', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Creations'), ['controller' => 'TransactionCreations', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Creation'), ['controller' => 'TransactionCreations', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Send Coins'), ['controller' => 'TransactionSendCoins', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Send Coin'), ['controller' => 'TransactionSendCoins', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="stateUsers index large-9 medium-8 columns content">
    <h3><?= __('State Users') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('index_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('state_group_id') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($stateUsers as $stateUser): ?>
            <tr>
                <td><?= $this->Number->format($stateUser->id) ?></td>
                <td><?= $this->Number->format($stateUser->index_id) ?></td>
                <td><?= $stateUser->has('state_group') ? $this->Html->link($stateUser->state_group->name, ['controller' => 'StateGroups', 'action' => 'view', $stateUser->state_group->id]) : '' ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $stateUser->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $stateUser->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $stateUser->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateUser->id)]) ?>
                </td>
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
