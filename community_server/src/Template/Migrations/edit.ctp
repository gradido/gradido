<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\Migration $migration
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Form->postLink(
                __('Delete'),
                ['action' => 'delete', $migration->id],
                ['confirm' => __('Are you sure you want to delete # {0}?', $migration->id)]
            )
        ?></li>
        <li><?= $this->Html->link(__('List Migrations'), ['action' => 'index']) ?></li>
    </ul>
</nav>
<div class="migrations form large-9 medium-8 columns content">
    <?= $this->Form->create($migration) ?>
    <fieldset>
        <legend><?= __('Edit Migration') ?></legend>
        <?php
            echo $this->Form->control('db_version');
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
