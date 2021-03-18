<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateBalance $stateBalance
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Form->postLink(
                __('Delete'),
                ['action' => 'delete', $stateBalance->id],
                ['confirm' => __('Are you sure you want to delete # {0}?', $stateBalance->id)]
            )
        ?></li>
        <li><?= $this->Html->link(__('List State Balances'), ['action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="stateBalances form large-9 medium-8 columns content">
    <?= $this->Form->create($stateBalance) ?>
    edit
    <fieldset>
        <legend><?= __('Edit State Balance') ?></legend>
        <?php
            echo $this->Form->control('state_user_id', ['options' => $stateUsers]);
            echo $this->Form->control('amount');
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
