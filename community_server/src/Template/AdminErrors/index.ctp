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
<div class="content-list">
    <div class="content-list-table">
        <div class="row">
            <div class="cell cell-dense header-cell centered c1"><?= $this->Paginator->sort('id') ?></div>
            <div class="cell cell-dense header-cell c1"><?= $this->Paginator->sort('state_user_id') ?></div>
            <div class="cell cell-dense header-cell c4"><?= $this->Paginator->sort('controller') ?></div>
            <div class="cell cell-dense header-cell c2"><?= $this->Paginator->sort('action') ?></div>
            <div class="cell cell-dense header-cell c2"><?= $this->Paginator->sort('state') ?></div>
            <div class="cell cell-dense header-cell c0"><?= $this->Paginator->sort('msg') ?></div>
            <div class="cell cell-dense header-cell c3"><?= $this->Paginator->sort('details') ?></div>
            <div class="cell cell-dense header-cell c3"><?= $this->Paginator->sort('created') ?></div>
            <div class="cell cell-dense header-cell c3"><?= __('Actions') ?></div>
        </div>
        <?php foreach ($adminErrors as $adminError): ?>
        <div class="row">
            <div class="cell cell-dense centered c1"><?= $this->Number->format($adminError->id) ?></div>
            <div class="cell cell-dense c1"><?= $adminError->has('state_user') ? $this->Html->link($adminError->state_user->id, ['controller' => 'StateUsers', 'action' => 'view', $adminError->state_user->id]) : '' ?></div>
            <div class="cell cell-dense c4"><?= h($adminError->controller) ?></div>
            <div class="cell cell-dense c2"><?= h($adminError->action) ?></div>
            <div class="cell cell-dense c2"><?= h($adminError->state) ?></div>
            <div class="cell cell-dense c0"><?= h($adminError->msg) ?></div>
            <div class="cell cell-dense c3"><?= h($adminError->details) ?></div>
            <div class="cell cell-dense c3"><?= h($adminError->created) ?></div>
            <div class="cell cell-dense c3">
                <?= $this->Html->link(__('View'), ['action' => 'view', $adminError->id]) ?>
                &nbsp;
                <?= $this->Html->link(__('Edit'), ['action' => 'edit', $adminError->id]) ?>
                &nbsp;
                <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $adminError->id], ['confirm' => __('Are you sure you want to delete # {0}?', $adminError->id)]) ?>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
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
