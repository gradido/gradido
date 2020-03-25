<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\Transaction $transaction
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit Transaction'), ['action' => 'edit', $transaction->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete Transaction'), ['action' => 'delete', $transaction->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transaction->id)]) ?> </li>
        <li><?= $this->Html->link(__('List Transactions'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction'), ['action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List State Groups'), ['controller' => 'StateGroups', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State Group'), ['controller' => 'StateGroups', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Types'), ['controller' => 'TransactionTypes', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Type'), ['controller' => 'TransactionTypes', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List State Created'), ['controller' => 'StateCreated', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State Created'), ['controller' => 'StateCreated', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Creations'), ['controller' => 'TransactionCreations', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Creation'), ['controller' => 'TransactionCreations', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Group Addaddress'), ['controller' => 'TransactionGroupAddaddress', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Group Addaddres'), ['controller' => 'TransactionGroupAddaddress', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Group Allowtrades'), ['controller' => 'TransactionGroupAllowtrades', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Group Allowtrade'), ['controller' => 'TransactionGroupAllowtrades', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Group Creates'), ['controller' => 'TransactionGroupCreates', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Group Create'), ['controller' => 'TransactionGroupCreates', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Send Coins'), ['controller' => 'TransactionSendCoins', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Send Coin'), ['controller' => 'TransactionSendCoins', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Signatures'), ['controller' => 'TransactionSignatures', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Signature'), ['controller' => 'TransactionSignatures', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="transactions view large-9 medium-8 columns content">
    <h3><?= h($transaction->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('State Group') ?></th>
            <td><?= $transaction->has('state_group') ? $this->Html->link($transaction->state_group->name, ['controller' => 'StateGroups', 'action' => 'view', $transaction->state_group->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Transaction Type') ?></th>
            <td><?= $transaction->has('transaction_type') ? $this->Html->link($transaction->transaction_type->name, ['controller' => 'TransactionTypes', 'action' => 'view', $transaction->transaction_type->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($transaction->id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Received') ?></th>
            <td><?= h($transaction->received) ?></td>
        </tr>
    </table>
    <div class="related">
        <h4><?= __('Related State Created') ?></h4>
        <?php if (!empty($transaction->state_created)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('Transaction Id') ?></th>
                <th scope="col"><?= __('Month') ?></th>
                <th scope="col"><?= __('Year') ?></th>
                <th scope="col"><?= __('State User Id') ?></th>
                <th scope="col"><?= __('Created') ?></th>
                <th scope="col"><?= __('Short Ident Hash') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($transaction->state_created as $stateCreated): ?>
            <tr>
                <td><?= h($stateCreated->id) ?></td>
                <td><?= h($stateCreated->transaction_id) ?></td>
                <td><?= h($stateCreated->month) ?></td>
                <td><?= h($stateCreated->year) ?></td>
                <td><?= h($stateCreated->state_user_id) ?></td>
                <td><?= h($stateCreated->created) ?></td>
                <td><?= h($stateCreated->short_ident_hash) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'StateCreated', 'action' => 'view', $stateCreated->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'StateCreated', 'action' => 'edit', $stateCreated->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'StateCreated', 'action' => 'delete', $stateCreated->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateCreated->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
    <div class="related">
        <h4><?= __('Related Transaction Creations') ?></h4>
        <?php if (!empty($transaction->transaction_creations)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('Transaction Id') ?></th>
                <th scope="col"><?= __('State User Id') ?></th>
                <th scope="col"><?= __('Amount') ?></th>
                <th scope="col"><?= __('Ident Hash') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($transaction->transaction_creations as $transactionCreations): ?>
            <tr>
                <td><?= h($transactionCreations->id) ?></td>
                <td><?= h($transactionCreations->transaction_id) ?></td>
                <td><?= h($transactionCreations->state_user_id) ?></td>
                <td><?= h($transactionCreations->amount) ?></td>
                <td><?= h($transactionCreations->ident_hash) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'TransactionCreations', 'action' => 'view', $transactionCreations->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'TransactionCreations', 'action' => 'edit', $transactionCreations->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'TransactionCreations', 'action' => 'delete', $transactionCreations->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionCreations->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
    <div class="related">
        <h4><?= __('Related Transaction Group Addaddress') ?></h4>
        <?php if (!empty($transaction->transaction_group_addaddress)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('Transaction Id') ?></th>
                <th scope="col"><?= __('Address Type Id') ?></th>
                <th scope="col"><?= __('Public Key') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($transaction->transaction_group_addaddress as $transactionGroupAddaddress): ?>
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
    <div class="related">
        <h4><?= __('Related Transaction Group Allowtrades') ?></h4>
        <?php if (!empty($transaction->transaction_group_allowtrades)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('Transaction Id') ?></th>
                <th scope="col"><?= __('Group Id') ?></th>
                <th scope="col"><?= __('Allow') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($transaction->transaction_group_allowtrades as $transactionGroupAllowtrades): ?>
            <tr>
                <td><?= h($transactionGroupAllowtrades->id) ?></td>
                <td><?= h($transactionGroupAllowtrades->transaction_id) ?></td>
                <td><?= h($transactionGroupAllowtrades->group_id) ?></td>
                <td><?= h($transactionGroupAllowtrades->allow) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'TransactionGroupAllowtrades', 'action' => 'view', $transactionGroupAllowtrades->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'TransactionGroupAllowtrades', 'action' => 'edit', $transactionGroupAllowtrades->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'TransactionGroupAllowtrades', 'action' => 'delete', $transactionGroupAllowtrades->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionGroupAllowtrades->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
    <div class="related">
        <h4><?= __('Related Transaction Group Creates') ?></h4>
        <?php if (!empty($transaction->transaction_group_creates)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('Transaction Id') ?></th>
                <th scope="col"><?= __('Group Public Key') ?></th>
                <th scope="col"><?= __('State Group Id') ?></th>
                <th scope="col"><?= __('Name') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($transaction->transaction_group_creates as $transactionGroupCreates): ?>
            <tr>
                <td><?= h($transactionGroupCreates->id) ?></td>
                <td><?= h($transactionGroupCreates->transaction_id) ?></td>
                <td><?= h($transactionGroupCreates->group_public_key) ?></td>
                <td><?= h($transactionGroupCreates->state_group_id) ?></td>
                <td><?= h($transactionGroupCreates->name) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'TransactionGroupCreates', 'action' => 'view', $transactionGroupCreates->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'TransactionGroupCreates', 'action' => 'edit', $transactionGroupCreates->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'TransactionGroupCreates', 'action' => 'delete', $transactionGroupCreates->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionGroupCreates->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
    <div class="related">
        <h4><?= __('Related Transaction Send Coins') ?></h4>
        <?php if (!empty($transaction->transaction_send_coins)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('Transaction Id') ?></th>
                <th scope="col"><?= __('State User Id') ?></th>
                <th scope="col"><?= __('Receiver Public Key') ?></th>
                <th scope="col"><?= __('Receiver User Id') ?></th>
                <th scope="col"><?= __('Amount') ?></th>
                <th scope="col"><?= __('Sender Final Balance') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($transaction->transaction_send_coins as $transactionReceiveCoins): ?>
            <tr>
                <td><?= h($transactionReceiveCoins->id) ?></td>
                <td><?= h($transactionReceiveCoins->transaction_id) ?></td>
                <td><?= h($transactionReceiveCoins->state_user_id) ?></td>
                <td><?= h($transactionReceiveCoins->receiver_public_key) ?></td>
                <td><?= h($transactionReceiveCoins->receiver_user_id) ?></td>
                <td><?= h($transactionReceiveCoins->amount) ?></td>
                <td><?= h($transactionReceiveCoins->sender_final_balance) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'TransactionSendCoins', 'action' => 'view', $transactionReceiveCoins->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'TransactionSendCoins', 'action' => 'edit', $transactionReceiveCoins->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'TransactionSendCoins', 'action' => 'delete', $transactionReceiveCoins->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionReceiveCoins->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
    <div class="related">
        <h4><?= __('Related Transaction Signatures') ?></h4>
        <?php if (!empty($transaction->transaction_signatures)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('Transaction Id') ?></th>
                <th scope="col"><?= __('Signature') ?></th>
                <th scope="col"><?= __('Pubkey') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($transaction->transaction_signatures as $transactionSignatures): ?>
            <tr>
                <td><?= h($transactionSignatures->id) ?></td>
                <td><?= h($transactionSignatures->transaction_id) ?></td>
                <td><?= h($transactionSignatures->signature) ?></td>
                <td><?= h($transactionSignatures->pubkey) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'TransactionSignatures', 'action' => 'view', $transactionSignatures->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'TransactionSignatures', 'action' => 'edit', $transactionSignatures->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'TransactionSignatures', 'action' => 'delete', $transactionSignatures->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionSignatures->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
</div>
