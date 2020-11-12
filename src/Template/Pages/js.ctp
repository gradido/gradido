<?php $this->layout = false;?><html>
	<head>
		<title>Vue Test</title>
		<meta charset="UTF-8">
	</head>
	<body>
		<div id="gradido-vue">Wird geladen...</div>
    <script type="text/javascript">
      csfr = "<?= $this->request->getParam('_csrfToken') ?>";
      user = <?= json_encode($user); ?>;
      session = <?= $login_server_session ?>;
    </script>
	</body>
</html>