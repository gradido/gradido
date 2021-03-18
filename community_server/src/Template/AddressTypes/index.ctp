<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\AddressType[]|\Cake\Collection\CollectionInterface $addressTypes
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New Address Type'), ['action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Group Addresses'), ['controller' => 'StateGroupAddresses', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State Group Address'), ['controller' => 'StateGroupAddresses', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Group Addaddress'), ['controller' => 'TransactionGroupAddaddress', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Group Addaddres'), ['controller' => 'TransactionGroupAddaddress', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="addressTypes index large-9 medium-8 columns content">
    <h3><?= __('Address Types') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('name') ?></th>
                <th scope="col"><?= $this->Paginator->sort('text') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($addressTypes as $addressType): ?>
            <tr>
                <td><?= $this->Number->format($addressType->id) ?></td>
                <td><?= h($addressType->name) ?></td>
                <td><?= h($addressType->text) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $addressType->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $addressType->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $addressType->id], ['confirm' => __('Are you sure you want to delete # {0}?', $addressType->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    <div>
        <ul class="nav-horizontal">
            <?= $this->Paginator->first('<< ' . __('first')) ?>
            <?= $this->Paginator->prev('< ' . __('previous')) ?>
            <?= $this->Paginator->numbers() ?>
            <?= $this->Paginator->next(__('next') . ' >') ?>
            <?= $this->Paginator->last(__('last') . ' >>') ?>
        </ul>
        <p><?= $this->Paginator->counter(['format' => __('Page {{page}} of {{pages}}, showing {{current}} record(s) out of {{count}} total')]) ?></p>
    </div>
</div>
