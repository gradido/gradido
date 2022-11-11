<template>
  <div class="mt-2">
    <span v-for="({ type, text }, index) in parsedMessage" :key="index">
      <b-link v-if="type === 'link'" :href="text" target="_blank">{{ text }}</b-link>
      <span v-else-if="type === 'date'">
        {{ $d(new Date(text), 'short') }}
        <br />
      </span>
      <span v-else-if="type === 'amount'">
        <br />
        {{ text | GDD }}
      </span>
      <span v-else>{{ text }}</span>
    </span>
  </div>
</template>

<script>
const LINK_REGEX_PATTERN =
  /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*))/i

export default {
  name: 'ParseMessage',
  props: {
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      reuired: true,
    },
  },
  computed: {
    parsedMessage() {
      let string = this.message
      const linkified = []
      let amount
      if (this.type === 'HISTORY') {
        const split = string.split(/\n\s*---\n\s*/)
        string = split[1]
        linkified.push({ type: 'date', text: split[0].trim() })
        amount = split[2].trim()
      }
      let match
      while ((match = string.match(LINK_REGEX_PATTERN))) {
        if (match.index > 0)
          linkified.push({ type: 'text', text: string.substring(0, match.index) })
        linkified.push({ type: 'link', text: match[0] })
        string = string.substring(match.index + match[0].length)
      }
      if (string.length > 0) linkified.push({ type: 'text', text: string })
      if (amount) linkified.push({ type: 'amount', text: amount })
      return linkified
    },
  },
}
</script>
