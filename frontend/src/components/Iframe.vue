<template>
  <div class="iframe-components">
    <container class="ml-3 w-100 h-100 position-absolute">
      <p class="m-3 text-danger">Die Webseite von Gradido erreichst du unter: <a href="https//:gradido.net" target="_blank">https:gradido.net</a>. Sie wird hier nur eingebunden und ist kein bestandteil der Wallet </p>
      <iframe :src="url" width="100%" height="100%" frameborder="0"></iframe>
    </container>
  </div>
</template>
<script>
export default {
  name: 'Iframe',
  props: {
    url: {
      type: String,
      required: true,
    },
  },
}
</script>
