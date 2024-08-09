<template>
  <div class="gdt-amount mt-3 mt-lg-0">
    <div class="text-center">
      <BBadge
        v-if="badgeShow"
        class="position-absolute mt--2 ml--4 px-3 zindex1"
        :class="showStatus ? 'bg-gradient' : ''"
        :variant="showStatus ? '' : 'light'"
      >
        {{ $t('GDT') }}
      </BBadge>
    </div>
    <div
      class="wallet-amount bg-white app-box-shadow gradido-border-radius p-4 border"
      :class="showStatus ? 'gradido-global-border-color-accent' : 'border-light opacity-05'"
    >
      <BRow>
        <BCol class="h4">{{ $t('gdt.gdtKonto') }}</BCol>
      </BRow>
      <BRow>
        <BCol cols="9">
          <!--          <b-icon-->
          <!--            icon="layers"-->
          <!--            class="mr-3 gradido-global-border-color-accent d-none d-lg-inline"-->
          <!--          ></b-icon>-->
          <IBiLayers />
          <span v-if="hideAmount" class="font-weight-bold gradido-global-color-accent">
            {{ t('asterisks') }}
          </span>
          <span v-else class="font-weight-bold gradido-global-color-accent">
            {{ n(gdtBalance, 'decimal') }} {{ t('GDT') }}
          </span>
        </BCol>
        <BCol cols="3" class="border-left border-light">
          <!--          <b-icon-->
          <!--            :icon="hideAmount ? 'eye-slash' : 'eye'"-->
          <!--            class="mr-3 gradido-global-border-color-accent pointer hover-icon"-->
          <!--            @click="updateHideAmountGDT"-->
          <!--          ></b-icon>-->
          <button class="transparent-button" @click="updateHideAmountGDT">
            <IBiEyeSlash v-if="hideAmount" />
            <IBiEye v-else />
          </button>
        </BCol>
      </BRow>
    </div>
  </div>
</template>
<!--<script>-->
<!--import { updateUserInfos } from '@/graphql/mutations'-->

<!--export default {-->
<!--  name: 'GdtAmount',-->
<!--  props: {-->
<!--    GdtBalance: { type: Number, required: true },-->
<!--    badgeShow: { type: Boolean, default: true },-->
<!--    showStatus: { type: Boolean, default: false },-->
<!--  },-->
<!--  computed: {-->
<!--    hideAmount() {-->
<!--      return this.$store.state.hideAmountGDT-->
<!--    },-->
<!--  },-->
<!--  methods: {-->
<!--    async updateHideAmountGDT() {-->
<!--      this.$apollo-->
<!--        .mutate({-->
<!--          mutation: updateUserInfos,-->
<!--          variables: {-->
<!--            hideAmountGDT: !this.hideAmount,-->
<!--          },-->
<!--        })-->
<!--        .then(() => {-->
<!--          this.$store.commit('hideAmountGDT', !this.hideAmount)-->
<!--          if (!this.hideAmount) {-->
<!--            this.toastSuccess(this.$t('settings.showAmountGDT'))-->
<!--          } else {-->
<!--            this.toastSuccess(this.$t('settings.hideAmountGDT'))-->
<!--          }-->
<!--        })-->
<!--        .catch((error) => {-->
<!--          this.toastError(error.message)-->
<!--        })-->
<!--    },-->
<!--  },-->
<!--}-->
<!--</script>-->

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useMutation } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { updateUserInfos } from '@/graphql/mutations'
import { useAppToast } from '../../../composables/useToast'

const props = defineProps({
  gdtBalance: { type: Number, required: true },
  badgeShow: { type: Boolean, default: true },
  showStatus: { type: Boolean, default: false },
})

const store = useStore()
const { mutate } = useMutation(updateUserInfos)
const { t, n } = useI18n()
const { toastSuccess, toastError } = useAppToast()

const hideAmount = computed(() => store.state.hideAmountGDT)

const updateHideAmountGDT = async () => {
  try {
    await mutate({
      hideAmountGDT: !hideAmount.value,
    })

    store.commit('hideAmountGDT', !hideAmount.value)

    if (!hideAmount.value) {
      toastSuccess(t('settings.showAmountGDT'))
    } else {
      toastSuccess(t('settings.hideAmountGDT'))
    }
  } catch (error) {
    toastError(error.message)
  }
}
</script>
