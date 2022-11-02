<template>
  <div class="mt-2">
    <span v-for="({ type, text }, index) in linkifiedMessage" :key="index">
      <b-link v-if="type === 'link'" :href="text" target="_blank">{{ text }}</b-link>
      <span v-else>{{ text }}</span>
    </span>
  </div>
</template>

<script>
const LINK_REGEX_PATTERN =
  /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*))/i

export default {
  name: 'LinkifyMessage',
  props: {
    message: {
      type: String,
      required: true,
    },
  },
  computed: {
    linkifiedMessage() {
      const linkified = []
      let string = this.message
      let match
      while ((match = string.match(LINK_REGEX_PATTERN))) {
        if (match.index > 0)
          linkified.push({ type: 'text', text: string.substring(0, match.index) })
        linkified.push({ type: 'link', text: match[0] })
        string = string.substring(match.index + match[0].length)
      }
      if (string.length > 0) linkified.push({ type: 'text', text: string })
      return linkified
    },
  },
}
</script>
