<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionState $transactionState
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Form->postLink(
                __('Delete'),
                ['action' => 'delete', $transactionState->id],
                ['confirm' => __('Are you sure you want to delete # {0}?', $transactionState->id)]
            )
        ?></li>
        <li><?= $this->Html->link(__('List Transaction States'), ['action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="transactionStates form large-9 medium-8 columns content">
    <?= $this->Form->create($transactionState) ?>
    <fieldset>
        <legend><?= __('Edit Transaction State') ?></legend>
        <?php
            echo $this->Form->control('name');
            echo $this->Form->control('text');
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
