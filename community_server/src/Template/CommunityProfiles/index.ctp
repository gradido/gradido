<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\CommunityProfile[]|\Cake\Collection\CollectionInterface $communityProfiles
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New Community Profile'), ['action' => 'add']) ?></li>
    </ul>
</nav>
<div class="communityProfiles index large-9 medium-8 columns content">
    <h3><?= __('Community Profiles') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('state_user_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('profile_desc') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($communityProfiles as $communityProfile): ?>
            <tr>
                <td><?= $this->Number->format($communityProfile->id) ?></td>
                <td><?= $this->Number->format($communityProfile->state_user_id) ?></td>
                <td><?= h($communityProfile->profile_desc) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $communityProfile->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $communityProfile->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $communityProfile->id], ['confirm' => __('Are you sure you want to delete # {0}?', $communityProfile->id)]) ?>
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
