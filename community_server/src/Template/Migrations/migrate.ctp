<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

?><h2>Migrate DB</h2>
<p>Migrate from Version <?= $db_version ?></p>
<?php if($result['success']) : ?> 
    <h3><success>Success</success></h3>
<?php elseif : ?>
    <h3><error>Error</error></h3>
    <p><?= json_encode($result) ?></p>
<?php endif; ?>
    <p><?= $this->Html->link('Back to Dashboard', ['controller' => 'Dashboard', 'action' => 'index']) ?></p>
);
