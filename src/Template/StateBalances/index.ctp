<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateBalance[]|\Cake\Collection\CollectionInterface $stateBalances
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New State Balance'), ['action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="stateBalances index large-9 medium-8 columns content">
    <h3><?= __('State Balances') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('state_user_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('modified') ?></th>
                <th scope="col"><?= $this->Paginator->sort('amount') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($stateBalances as $stateBalance): ?>
            <tr>
                <td><?= $this->Number->format($stateBalance->id) ?></td>
                <td><?= $stateBalance->has('state_user') ? $this->Html->link($stateBalance->state_user->id, ['controller' => 'StateUsers', 'action' => 'view', $stateBalance->state_user->id]) : '' ?></td>
                <td><?= h($stateBalance->modified) ?></td>
                <td><?= $this->Number->format($stateBalance->amount) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $stateBalance->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $stateBalance->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $stateBalance->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateBalance->id)]) ?>
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
