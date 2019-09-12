<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateGroupRelationship $stateGroupRelationship
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('List State Group Relationships'), ['action' => 'index']) ?></li>
    </ul>
</nav>
<div class="stateGroupRelationships form large-9 medium-8 columns content">
    <?= $this->Form->create($stateGroupRelationship) ?>
    <fieldset>
        <legend><?= __('Add State Group Relationship') ?></legend>
        <?php
            echo $this->Form->control('state_group1_id');
            echo $this->Form->control('state_group2_id');
            echo $this->Form->control('state_relationship_id');
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
