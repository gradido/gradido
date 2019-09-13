<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\ServerUser[]|\Cake\Collection\CollectionInterface $serverUsers
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New Server User'), ['action' => 'add']) ?></li>
    </ul>
</nav>
<div class="serverUsers index large-9 medium-8 columns content">
    <h3><?= __('Server Users') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('username') ?></th>
                <th scope="col"><?= $this->Paginator->sort('password') ?></th>
                <th scope="col"><?= $this->Paginator->sort('email') ?></th>
                <th scope="col"><?= $this->Paginator->sort('role') ?></th>
                <th scope="col"><?= $this->Paginator->sort('activated') ?></th>
                <th scope="col"><?= $this->Paginator->sort('last_login') ?></th>
                <th scope="col"><?= $this->Paginator->sort('created') ?></th>
                <th scope="col"><?= $this->Paginator->sort('modified') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($serverUsers as $serverUser): ?>
            <tr>
                <td><?= $this->Number->format($serverUser->id) ?></td>
                <td><?= h($serverUser->username) ?></td>
                <td><?= h($serverUser->password) ?></td>
                <td><?= h($serverUser->email) ?></td>
                <td><?= h($serverUser->role) ?></td>
                <td><?= h($serverUser->activated) ?></td>
                <td><?= h($serverUser->last_login) ?></td>
                <td><?= h($serverUser->created) ?></td>
                <td><?= h($serverUser->modified) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $serverUser->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $serverUser->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $serverUser->id], ['confirm' => __('Are you sure you want to delete # {0}?', $serverUser->id)]) ?>
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
