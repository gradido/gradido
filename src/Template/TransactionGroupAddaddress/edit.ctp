<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionGroupAddaddres $transactionGroupAddaddres
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Form->postLink(
                __('Delete'),
                ['action' => 'delete', $transactionGroupAddaddres->id],
                ['confirm' => __('Are you sure you want to delete # {0}?', $transactionGroupAddaddres->id)]
            )
        ?></li>
        <li><?= $this->Html->link(__('List Transaction Group Addaddress'), ['action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Address Types'), ['controller' => 'AddressTypes', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Address Type'), ['controller' => 'AddressTypes', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="transactionGroupAddaddress form large-9 medium-8 columns content">
    <?= $this->Form->create($transactionGroupAddaddres) ?>
    <fieldset>
        <legend><?= __('Edit Transaction Group Addaddres') ?></legend>
        <?php
            echo $this->Form->control('transaction_id', ['options' => $transactions]);
            echo $this->Form->control('address_type_id', ['options' => $addressTypes]);
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
