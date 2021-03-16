<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\ServerUser $serverUser
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('List Server Users'), ['action' => 'index']) ?></li>
    </ul>
</nav>
<div class="serverUsers form large-9 medium-8 columns content">
    <?= $this->Form->create($serverUser) ?>
    <fieldset>
        <legend><?= __('Add Server User') ?></legend>
        <?php
            echo $this->Form->control('username');
            echo $this->Form->control('password');
            echo $this->Form->control('email');
            echo $this->Form->control('role');
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
