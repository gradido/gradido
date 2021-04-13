<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\BlockchainType $blockchainType
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Form->postLink(
                __('Delete'),
                ['action' => 'delete', $blockchainType->id],
                ['confirm' => __('Are you sure you want to delete # {0}?', $blockchainType->id)]
            )
        ?></li>
        <li><?= $this->Html->link(__('List Blockchain Types'), ['action' => 'index']) ?></li>
    </ul>
</nav>
<div class="blockchainTypes form large-9 medium-8 columns content">
    <?= $this->Form->create($blockchainType) ?>
    <fieldset>
        <legend><?= __('Edit Blockchain Type') ?></legend>
        <?php
            echo $this->Form->control('name');
            echo $this->Form->control('text');
            echo $this->Form->control('symbol');
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
