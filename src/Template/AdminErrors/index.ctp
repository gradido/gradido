<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\AdminError[]|\Cake\Collection\CollectionInterface $adminErrors
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New Admin Error'), ['action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="adminErrors index large-9 medium-8 columns content">
    <h3><?= __('Admin Errors') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('state_user_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('controller') ?></th>
                <th scope="col"><?= $this->Paginator->sort('action') ?></th>
                <th scope="col"><?= $this->Paginator->sort('state') ?></th>
                <th scope="col"><?= $this->Paginator->sort('msg') ?></th>
                <th scope="col"><?= $this->Paginator->sort('details') ?></th>
                <th scope="col"><?= $this->Paginator->sort('created') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($adminErrors as $adminError): ?>
            <tr>
                <td><?= $this->Number->format($adminError->id) ?></td>
                <td><?= $adminError->has('state_user') ? $this->Html->link($adminError->state_user->id, ['controller' => 'StateUsers', 'action' => 'view', $adminError->state_user->id]) : '' ?></td>
                <td><?= h($adminError->controller) ?></td>
                <td><?= h($adminError->action) ?></td>
                <td><?= h($adminError->state) ?></td>
                <td><?= h($adminError->msg) ?></td>
                <td><?= h($adminError->details) ?></td>
                <td><?= h($adminError->created) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $adminError->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $adminError->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $adminError->id], ['confirm' => __('Are you sure you want to delete # {0}?', $adminError->id)]) ?>
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
