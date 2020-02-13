<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\ElopageBuy $elopageBuy
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit Elopage Buy'), ['action' => 'edit', $elopageBuy->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete Elopage Buy'), ['action' => 'delete', $elopageBuy->id], ['confirm' => __('Are you sure you want to delete # {0}?', $elopageBuy->id)]) ?> </li>
        <li><?= $this->Html->link(__('List Elopage Buys'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Elopage Buy'), ['action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="elopageBuys view large-9 medium-8 columns content">
    <h3><?= h($elopageBuy->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Payer Email') ?></th>
            <td><?= h($elopageBuy->payer_email) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Publisher Email') ?></th>
            <td><?= h($elopageBuy->publisher_email) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Event') ?></th>
            <td><?= h($elopageBuy->event) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($elopageBuy->id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Elopage User Id') ?></th>
            <td><?= $this->Number->format($elopageBuy->elopage_user_id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Affiliate Program Id') ?></th>
            <td><?= $this->Number->format($elopageBuy->affiliate_program_id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Publisher Id') ?></th>
            <td><?= $this->Number->format($elopageBuy->publisher_id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Order Id') ?></th>
            <td><?= $this->Number->format($elopageBuy->order_id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Product Id') ?></th>
            <td><?= $this->Number->format($elopageBuy->product_id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Product Price') ?></th>
            <td><?= $this->Number->format($elopageBuy->product_price) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Success Date') ?></th>
            <td><?= h($elopageBuy->success_date) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Payed') ?></th>
            <td><?= $elopageBuy->payed ? __('Yes') : __('No'); ?></td>
        </tr>
    </table>
</div>
