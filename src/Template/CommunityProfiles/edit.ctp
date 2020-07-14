<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\CommunityProfile $communityProfile
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Form->postLink(
                __('Delete'),
                ['action' => 'delete', $communityProfile->id],
                ['confirm' => __('Are you sure you want to delete # {0}?', $communityProfile->id)]
            )
        ?></li>
        <li><?= $this->Html->link(__('List Community Profiles'), ['action' => 'index']) ?></li>
    </ul>
</nav>
<div class="communityProfiles form large-9 medium-8 columns content">
    <?= $this->Form->create($communityProfile) ?>
    <fieldset>
        <legend><?= __('Edit Community Profile') ?></legend>
        <?php
            echo $this->Form->control('profile_desc');
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
