<template>
  <div class="memo-row">
    <BRow>
      <BCol cols="5">
        <div class="text-end">{{ $t('form.memo') }}</div>
      </BCol>
      <BCol cols="7">
        <div class="gdd-transaction-list-message" v-html="displayData" />
      </BCol>
    </BRow>
  </div>
</template>
<script>
export default {
  name: 'MemoRow',
  props: {
    memo: {
      type: String,
      required: true,
    },
  },
  computed: {
    displayData() {
      return this.formatLinks(this.memo)
    },
  },
  methods: {
    formatLinks(text) {
      const urlPattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim
      const emailPattern = /(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b)/g

      // Replace URLs with clickable links
      text = text.replace(
        urlPattern,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
      )

      // Replace email addresses with mailto links
      text = text.replace(emailPattern, '<a href="mailto:$1">$1</a>')

      return text
    },
  },
}
</script>
