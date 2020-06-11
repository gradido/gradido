<?php
$class = '';
if (!empty($params['class'])) {
    $class .= ' ' . $params['class'];
}
if (!isset($params['escape']) || $params['escape'] !== false) {
    $message = h($message);
}
?>
<!--<div class="<?= h($class) ?>" onclick="this.classList.add('hidden');"><?= $message ?></div>-->
<div class="alert <?= h($class) ?>" role="alert">
  <?= $message ?>
</div>
