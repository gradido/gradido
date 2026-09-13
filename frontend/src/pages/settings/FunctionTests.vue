<!-- AI-GENERATED — not an architecture reference -->
<template>
  <settings-section :title="$t('settings.menu.function-tests')">
    <div v-if="allowed" data-test="function-tests-first-creation">
      <div class="h5">{{ $t('settings.functionTests.firstCreation.title') }}</div>
      <p class="mt-3">{{ $t('settings.functionTests.firstCreation.intro') }}</p>

      <p class="fw-bold" data-test="function-tests-runs-left">{{ runsLeftText }}</p>

      <!-- The signer cannot be the tester: nobody confirms their own contribution, so the
           backend refuses this account. Said here rather than after the press, because
           after the press there is nothing to see -- the window simply would not open. -->
      <BAlert
        v-if="isSigner"
        :model-value="true"
        variant="warning"
        data-test="function-tests-signer-hint"
      >
        {{ $t('settings.functionTests.firstCreation.signerHint') }}
      </BAlert>

      <div class="d-grid gap-2 mt-4">
        <BButton
          variant="primary"
          :disabled="!canRun"
          data-test="function-tests-with-booking"
          @click="start(true)"
        >
          {{ $t('settings.functionTests.firstCreation.withBooking') }}
        </BButton>
        <BButton
          variant="secondary"
          :disabled="!canRun"
          data-test="function-tests-without-booking"
          @click="start(false)"
        >
          {{ $t('settings.functionTests.firstCreation.withoutBooking') }}
        </BButton>
      </div>

      <p class="small text-muted mt-3">
        {{ $t('settings.functionTests.firstCreation.unbookedHint') }}
      </p>

      <BAlert v-if="failed" :model-value="true" variant="danger" data-test="function-tests-failed">
        {{ $t('settings.functionTests.firstCreation.failed') }}
      </BAlert>
    </div>
  </settings-section>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { BAlert, BButton } from 'bootstrap-vue-next'
import SettingsSection from '@/components/UserSettings/SettingsSection.vue'
import { firstCreationStatus, startFirstCreationTest } from '@/graphql/firstCreation.graphql'

/** ES-015: 1000 GDD a month over 100 GDD a run. Only the wording is here; the number the
 * counter shows comes off the server's own quota (`testRunsLeft`). */
const FIRST_CREATION_RUNS_PER_MONTH = 10

const { t } = useI18n()
const store = useStore()
const router = useRouter()

/**
 * ⚠️ `cache-and-network` for the same reason FirstCreation.vue reads it that way: the query
 * takes no arguments, so every member on this browser shares one cache key.
 */
const { result } = useQuery(firstCreationStatus, null, { fetchPolicy: 'cache-and-network' })
const status = computed(() => result.value?.firstCreationStatus ?? null)

const isAdmin = computed(() => store.state.role === 'ADMIN')

/**
 * Both halves, the same two the menu entry hangs on. The route itself is registered
 * unconditionally -- it has to be, because whether the server offers the area is an answer
 * that arrives well after the route table is built -- so this page is what closes the
 * address to anybody else, and the backend refuses the mutation regardless.
 */
const allowed = computed(() => isAdmin.value && status.value?.functionTestsEnabled === true)

/**
 * Away as soon as we KNOW it is not for this account. Not while `status` is still null: at
 * that moment nothing is known yet, and sending an admin back to /settings for the second
 * it takes to answer would make the entry unreachable by clicking it.
 */
watch(
  () => [status.value, isAdmin.value],
  () => {
    if (status.value && !allowed.value) {
      router.replace('/settings')
    }
  },
  { immediate: true },
)

const runsLeft = computed(() => status.value?.testRunsLeft ?? 0)
const isSigner = computed(() => status.value?.isFirstCreationSigner === true)
const runsLeftText = computed(() =>
  runsLeft.value > 0
    ? t('settings.functionTests.firstCreation.runsLeft', {
        left: runsLeft.value,
        total: FIRST_CREATION_RUNS_PER_MONTH,
      })
    : t('settings.functionTests.firstCreation.noRunsLeft', {
        total: FIRST_CREATION_RUNS_PER_MONTH,
      }),
)

const running = ref(false)
const failed = ref(false)
const canRun = computed(() => !running.value && !isSigner.value && runsLeft.value > 0)

/**
 * ⚠️ `refetchQueries` is not decoration. The window itself hangs in DashboardLayout and has
 * long since had its answer; nothing about a mutation makes it ask again, and this answer
 * carries no id for the cache to match it to. So the status is fetched afresh and awaited,
 * and only then is the overview entered -- otherwise the member arrives there before the
 * window knows it may open.
 */
const { mutate: startTest } = useMutation(startFirstCreationTest, {
  refetchQueries: [{ query: firstCreationStatus }],
  awaitRefetchQueries: true,
})

const start = async (withBooking) => {
  running.value = true
  failed.value = false
  try {
    await startTest({ withBooking })
    // Never over the settings: the window keeps away from every /settings route, so it can
    // only be met somewhere else.
    await router.push('/overview')
  } catch {
    failed.value = true
  } finally {
    running.value = false
  }
}
</script>
