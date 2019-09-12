<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateRelationshipType $stateRelationshipType
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Form->postLink(
                __('Delete'),
                ['action' => 'delete', $stateRelationshipType->id],
                ['confirm' => __('Are you sure you want to delete # {0}?', $stateRelationshipType->id)]
            )
        ?></li>
        <li><?= $this->Html->link(__('List State Relationship Types'), ['action' => 'index']) ?></li>
    </ul>
</nav>
<div class="stateRelationshipTypes form large-9 medium-8 columns content">
    <?= $this->Form->create($stateRelationshipType) ?>
    <fieldset>
        <legend><?= __('Edit State Relationship Type') ?></legend>
        <?php
            echo $this->Form->control('name');
            echo $this->Form->control('text');
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
