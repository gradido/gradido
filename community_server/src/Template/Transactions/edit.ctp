<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\Transaction $transaction
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Form->postLink(
                __('Delete'),
                ['action' => 'delete', $transaction->id],
                ['confirm' => __('Are you sure you want to delete # {0}?', $transaction->id)]
            )
        ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('List State Groups'), ['controller' => 'StateGroups', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State Group'), ['controller' => 'StateGroups', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Types'), ['controller' => 'TransactionTypes', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Type'), ['controller' => 'TransactionTypes', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Created'), ['controller' => 'StateCreated', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State Created'), ['controller' => 'StateCreated', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Creations'), ['controller' => 'TransactionCreations', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Creation'), ['controller' => 'TransactionCreations', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Group Addaddress'), ['controller' => 'TransactionGroupAddaddress', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Group Addaddres'), ['controller' => 'TransactionGroupAddaddress', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Group Allowtrades'), ['controller' => 'TransactionGroupAllowtrades', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Group Allowtrade'), ['controller' => 'TransactionGroupAllowtrades', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Group Creates'), ['controller' => 'TransactionGroupCreates', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Group Create'), ['controller' => 'TransactionGroupCreates', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Send Coins'), ['controller' => 'TransactionSendCoins', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Send Coin'), ['controller' => 'TransactionSendCoins', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Signatures'), ['controller' => 'TransactionSignatures', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Signature'), ['controller' => 'TransactionSignatures', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="transactions form large-9 medium-8 columns content">
    <?= $this->Form->create($transaction) ?>
    <fieldset>
        <legend><?= __('Edit Transaction') ?></legend>
        <?php
            echo $this->Form->control('state_group_id', ['options' => $stateGroups]);
            echo $this->Form->control('transaction_type_id', ['options' => $transactionTypes]);
            echo $this->Form->control('received');
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
