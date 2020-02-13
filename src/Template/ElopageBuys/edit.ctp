<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\ElopageBuy $elopageBuy
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Form->postLink(
                __('Delete'),
                ['action' => 'delete', $elopageBuy->id],
                ['confirm' => __('Are you sure you want to delete # {0}?', $elopageBuy->id)]
            )
        ?></li>
        <li><?= $this->Html->link(__('List Elopage Buys'), ['action' => 'index']) ?></li>
    </ul>
</nav>
<div class="elopageBuys form large-9 medium-8 columns content">
    <?= $this->Form->create($elopageBuy) ?>
    <fieldset>
        <legend><?= __('Edit Elopage Buy') ?></legend>
        <?php
            echo $this->Form->control('elopage_user_id');
            echo $this->Form->control('affiliate_program_id');
            echo $this->Form->control('publisher_id');
            echo $this->Form->control('order_id');
            echo $this->Form->control('product_id');
            echo $this->Form->control('product_price');
            echo $this->Form->control('payer_email');
            echo $this->Form->control('publisher_email');
            echo $this->Form->control('payed');
            echo $this->Form->control('success_date');
            echo $this->Form->control('event');
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
