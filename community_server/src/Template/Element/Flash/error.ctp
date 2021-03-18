<?php
if (!isset($params['escape']) || $params['escape'] !== false) {
    $message = h($message);
}
?>
<!--<div class="message error" onclick="this.classList.add('hidden');"><?= $message ?></div>-->
<div class="alert alert-error" role="alert">
  <i class="material-icons-outlined">report_problem</i>
  <span><?= $message ?></span>
</div>