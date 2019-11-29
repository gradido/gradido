<?php
$class = 'alert-primary';
if (!empty($params['class'])) {
    $class .= ' ' . $params['class'];
}
if (!isset($params['escape']) || $params['escape'] !== false) {
    $message = h($message);
}
?>
<!--<div class="<?= h($class) ?>" onclick="this.classList.add('hidden');"><?= $message ?></div>-->
<div class="alert <?= h($class) ?>" onclick="this.classList.add('hidden')" role="alert">
  <?= $message ?>
</div>
