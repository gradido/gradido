<?php
if (!isset($params['escape']) || $params['escape'] !== false) {
    $message = h($message);
}
?>
<!--<div class="message error" onclick="this.classList.add('hidden');"><?= $message ?></div>-->
<div class="alert alert-danger" role="alert" onclick="this.classList.add('hidden');">
  <i class="mdi mdi-alert-outline alert-color mdi-2x"></i> <?= $message ?>
</div>