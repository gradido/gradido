<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\ElopageBuy[]|\Cake\Collection\CollectionInterface $elopageBuys
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New Elopage Buy'), ['action' => 'add']) ?></li>
    </ul>
</nav>
<div class="elopageBuys index large-9 medium-8 columns content">
    <h3><?= __('Elopage Buys') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('elopage_user_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('affiliate_program_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('publisher_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('order_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('product_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('product_price') ?></th>
                <th scope="col"><?= $this->Paginator->sort('payer_email') ?></th>
                <th scope="col"><?= $this->Paginator->sort('publisher_email') ?></th>
                <th scope="col"><?= $this->Paginator->sort('payed') ?></th>
                <th scope="col"><?= $this->Paginator->sort('success_date') ?></th>
                <th scope="col"><?= $this->Paginator->sort('event') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($elopageBuys as $elopageBuy): ?>
            <tr>
                <td><?= $this->Number->format($elopageBuy->id) ?></td>
                <td><?= $this->Number->format($elopageBuy->elopage_user_id) ?></td>
                <td><?= $this->Number->format($elopageBuy->affiliate_program_id) ?></td>
                <td><?= $this->Number->format($elopageBuy->publisher_id) ?></td>
                <td><?= $this->Number->format($elopageBuy->order_id) ?></td>
                <td><?= $this->Number->format($elopageBuy->product_id) ?></td>
                <td><?= $this->Number->format($elopageBuy->product_price) ?></td>
                <td><?= h($elopageBuy->payer_email) ?></td>
                <td><?= h($elopageBuy->publisher_email) ?></td>
                <td><?= h($elopageBuy->payed) ?></td>
                <td><?= h($elopageBuy->success_date) ?></td>
                <td><?= h($elopageBuy->event) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $elopageBuy->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $elopageBuy->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $elopageBuy->id], ['confirm' => __('Are you sure you want to delete # {0}?', $elopageBuy->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    <div>
        <ul class="nav-horizontal">
            <?= $this->Paginator->first('<< ' . __('first')) ?>
            <?= $this->Paginator->prev('< ' . __('previous')) ?>
            <?= $this->Paginator->numbers() ?>
            <?= $this->Paginator->next(__('next') . ' >') ?>
            <?= $this->Paginator->last(__('last') . ' >>') ?>
        </ul>
        <p><?= $this->Paginator->counter(['format' => __('Page {{page}} of {{pages}}, showing {{current}} record(s) out of {{count}} total')]) ?></p>
    </div>
</div>
