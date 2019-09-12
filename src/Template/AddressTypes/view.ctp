<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\AddressType $addressType
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit Address Type'), ['action' => 'edit', $addressType->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete Address Type'), ['action' => 'delete', $addressType->id], ['confirm' => __('Are you sure you want to delete # {0}?', $addressType->id)]) ?> </li>
        <li><?= $this->Html->link(__('List Address Types'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Address Type'), ['action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List State Group Addresses'), ['controller' => 'StateGroupAddresses', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State Group Address'), ['controller' => 'StateGroupAddresses', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Group Addaddress'), ['controller' => 'TransactionGroupAddaddress', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Group Addaddres'), ['controller' => 'TransactionGroupAddaddress', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="addressTypes view large-9 medium-8 columns content">
    <h3><?= h($addressType->name) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Name') ?></th>
            <td><?= h($addressType->name) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Text') ?></th>
            <td><?= h($addressType->text) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($addressType->id) ?></td>
        </tr>
    </table>
    <div class="related">
        <h4><?= __('Related State Group Addresses') ?></h4>
        <?php if (!empty($addressType->state_group_addresses)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('State Group Id') ?></th>
                <th scope="col"><?= __('Public Key') ?></th>
                <th scope="col"><?= __('Address Type Id') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($addressType->state_group_addresses as $stateGroupAddresses): ?>
            <tr>
                <td><?= h($stateGroupAddresses->id) ?></td>
                <td><?= h($stateGroupAddresses->state_group_id) ?></td>
                <td><?= h($stateGroupAddresses->public_key) ?></td>
                <td><?= h($stateGroupAddresses->address_type_id) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'StateGroupAddresses', 'action' => 'view', $stateGroupAddresses->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'StateGroupAddresses', 'action' => 'edit', $stateGroupAddresses->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'StateGroupAddresses', 'action' => 'delete', $stateGroupAddresses->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateGroupAddresses->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
    <div class="related">
        <h4><?= __('Related Transaction Group Addaddress') ?></h4>
        <?php if (!empty($addressType->transaction_group_addaddress)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('Transaction Id') ?></th>
                <th scope="col"><?= __('Address Type Id') ?></th>
                <th scope="col"><?= __('Public Key') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($addressType->transaction_group_addaddress as $transactionGroupAddaddress): ?>
            <tr>
                <td><?= h($transactionGroupAddaddress->id) ?></td>
                <td><?= h($transactionGroupAddaddress->transaction_id) ?></td>
                <td><?= h($transactionGroupAddaddress->address_type_id) ?></td>
                <td><?= h($transactionGroupAddaddress->public_key) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'TransactionGroupAddaddress', 'action' => 'view', $transactionGroupAddaddress->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'TransactionGroupAddaddress', 'action' => 'edit', $transactionGroupAddaddress->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'TransactionGroupAddaddress', 'action' => 'delete', $transactionGroupAddaddress->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionGroupAddaddress->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
</div>
