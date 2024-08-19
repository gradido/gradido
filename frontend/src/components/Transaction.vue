<template>
  <div class="gdt-transaction-list">
    <div class="list-group bg-white app-box-shadow gradido-border-radius p-3 mb-3">
      <BRow class="align-items-center" @click="visible = !visible">
        <BCol cols="3" lg="2" md="2">
          <BAvatar
            :icon="getLinesByType.icon"
            variant="light"
            size="3em"
            :class="getLinesByType.iconclasses"
          />
        </BCol>
        <BCol>
          <div>
            <span class="small">{{ $d(new Date(date), 'short') }}</span>
            <span class="small ml-3">{{ $d(new Date(date), 'time') }}</span>
          </div>
          <div>
            {{ getLinesByType.description }}
          </div>
          <div class="small">
            {{ getLinesByType.descriptiontext }}
          </div>
        </BCol>
        <BCol cols="8" lg="3" md="3" sm="8" offset="3" offset-md="0" offset-lg="0">
          <div class="small mb-2">{{ $t('gdt.credit') }}</div>
          <div class="font-weight-bold">{{ getLinesByType.credittext }}</div>
        </BCol>
        <BCol cols="12" md="1" lg="1" class="text-right">
          <collapse-icon class="text-right" :visible="visible" />
        </BCol>
      </BRow>

      <BCollapse :id="collapseId" v-model="visible" class="mt-2">
        <transaction-collapse
          :amount="amount"
          :gdt-entry-type="gdtEntryType"
          :factor="factor"
          :gdt="gdt"
        ></transaction-collapse>
      </BCollapse>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import CollapseIcon from './TransactionRows/CollapseIcon'
import TransactionCollapse from './TransactionCollapse'
import { GdtEntryType } from '../graphql/enums'

const props = defineProps({
  amount: Number,
  date: String,
  comment: String,
  gdtEntryType: {
    type: String,
    default: GdtEntryType.FORM,
  },
  factor: Number,
  gdt: Number,
  id: Number,
})

const collapseStatus = ref([])
const visible = ref(false)

const { t, n } = useI18n()

const collapseId = computed(() => 'gdt-collapse-' + String(props.id))

const getLinesByType = computed(() => {
  switch (props.gdtEntryType) {
    case GdtEntryType.FORM:
    case GdtEntryType.CVS:
    case GdtEntryType.ELOPAGE:
    case GdtEntryType.DIGISTORE:
    case GdtEntryType.CVS2: {
      return {
        icon: 'heart',
        iconclasses: 'gradido-global-color-accent',
        description: t('gdt.contribution'),
        descriptiontext: n(props.amount, 'decimal') + ' €',
        credittext: n(props.gdt, 'decimal') + ' GDT',
      }
    }
    case GdtEntryType.ELOPAGE_PUBLISHER: {
      return {
        icon: 'person-check',
        iconclasses: 'gradido-global-color-accent',
        description: t('gdt.recruited-member'),
        descriptiontext: '5%',
        credittext: n(props.amount, 'decimal') + ' GDT',
      }
    }
    case GdtEntryType.GLOBAL_MODIFICATOR: {
      return {
        icon: 'gift',
        iconclasses: 'gradido-global-color-accent',
        description: t('gdt.gdt-received'),
        descriptiontext: props.comment,
        credittext: n(props.gdt, 'decimal') + ' GDT',
      }
    }
    default:
      throw new Error('no lines for this type: ' + props.gdtEntryType)
  }
})

onMounted(() => {
  // Note: This event listener setup might need to be adjusted for Vue 3
  const root = getCurrentInstance().appContext.config.globalProperties
  root.$on('bv::collapse::state', (collapseId, isJustShown) => {
    if (isJustShown) {
      collapseStatus.value.push(collapseId)
    } else {
      collapseStatus.value = collapseStatus.value.filter((id) => id !== collapseId)
    }
  })
})
</script>
