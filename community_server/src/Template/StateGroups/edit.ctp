<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateGroup $stateGroup
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Form->postLink(
                __('Delete'),
                ['action' => 'delete', $stateGroup->id],
                ['confirm' => __('Are you sure you want to delete # {0}?', $stateGroup->id)]
            )
        ?></li>
        <li><?= $this->Html->link(__('List State Groups'), ['action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('List State Group Addresses'), ['controller' => 'StateGroupAddresses', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State Group Address'), ['controller' => 'StateGroupAddresses', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Group Creates'), ['controller' => 'TransactionGroupCreates', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Group Create'), ['controller' => 'TransactionGroupCreates', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="stateGroups form large-9 medium-8 columns content">
    <?= $this->Form->create($stateGroup) ?>
    <fieldset>
        <legend><?= __('Edit State Group') ?></legend>
        <?php
            echo $this->Form->control('name');
            echo $this->Form->control('user_count');
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
