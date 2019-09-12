<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateGroupAddress $stateGroupAddress
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('List State Group Addresses'), ['action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('List State Groups'), ['controller' => 'StateGroups', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State Group'), ['controller' => 'StateGroups', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Address Types'), ['controller' => 'AddressTypes', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Address Type'), ['controller' => 'AddressTypes', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="stateGroupAddresses form large-9 medium-8 columns content">
    <?= $this->Form->create($stateGroupAddress) ?>
    <fieldset>
        <legend><?= __('Add State Group Address') ?></legend>
        <?php
            echo $this->Form->control('state_group_id', ['options' => $stateGroups]);
            echo $this->Form->control('address_type_id', ['options' => $addressTypes]);
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
