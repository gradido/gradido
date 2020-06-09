<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\AdminError $adminError
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('List Admin Errors'), ['action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="adminErrors form large-9 medium-8 columns content">
    <?= $this->Form->create($adminError) ?>
    <fieldset>
        <legend><?= __('Add Admin Error') ?></legend>
        <?php
            echo $this->Form->control('state_user_id', ['options' => $stateUsers]);
            echo $this->Form->control('controller');
            echo $this->Form->control('action');
            echo $this->Form->control('state');
            echo $this->Form->control('msg');
            echo $this->Form->control('details');
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
