<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionSignature $transactionSignature
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('List Transaction Signatures'), ['action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="transactionSignatures form large-9 medium-8 columns content">
    <?= $this->Form->create($transactionSignature) ?>
    <fieldset>
        <legend><?= __('Add Transaction Signature') ?></legend>
        <?php
            echo $this->Form->control('transaction_id', ['options' => $transactions]);
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
