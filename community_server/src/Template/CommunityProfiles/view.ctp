<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\CommunityProfile $communityProfile
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit Community Profile'), ['action' => 'edit', $communityProfile->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete Community Profile'), ['action' => 'delete', $communityProfile->id], ['confirm' => __('Are you sure you want to delete # {0}?', $communityProfile->id)]) ?> </li>
        <li><?= $this->Html->link(__('List Community Profiles'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Community Profile'), ['action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="communityProfiles view large-9 medium-8 columns content">
    <h3><?= h($communityProfile->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Profile Desc') ?></th>
            <td><?= h($communityProfile->profile_desc) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($communityProfile->id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('State User Id') ?></th>
            <td><?= $this->Number->format($communityProfile->state_user_id) ?></td>
        </tr>
    </table>
</div>
