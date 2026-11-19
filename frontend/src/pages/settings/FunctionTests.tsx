// AI-GENERATED — not an architecture reference
import { useMutation, useQuery } from '@vue/apollo-composable'
import { BAlert, BButton } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { SettingsSection } from '@/components/UserSettings/SettingsSection'
import { firstCreationStatus, startFirstCreationTest } from '@/graphql/firstCreation.graphql'
import { useWalletStore } from '@/store/useWalletStore'

/** ES-015: 1000 GDD a month over 100 GDD a run. Only the wording is here; the number the
 * counter shows comes off the server's own quota (`testRunsLeft`). */
const FIRST_CREATION_RUNS_PER_MONTH = 10

/** What the server says about the first creation, as far as this page reads it. */
type Status = {
  functionTestsEnabled?: boolean
  testRunsLeft?: number | null
  isFirstCreationSigner?: boolean
}

export const FunctionTests = defineComponent({
  name: 'FunctionTests',
  setup() {
    const { t } = useI18n()
    const store = useWalletStore()
    const router = useRouter()

    /**
     * ⚠️ `cache-and-network` for the same reason FirstCreation.tsx reads it that way: the query
     * takes no arguments, so every member on this browser shares one cache key.
     */
    const { result } = useQuery(firstCreationStatus, null, { fetchPolicy: 'cache-and-network' })
    const status = computed<Status | null>(() => result.value?.firstCreationStatus ?? null)

    const isAdmin = computed(() => (store.role as string | null) === 'ADMIN')

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
    /** The press went through; the admin is told how to meet the window. */
    const started = ref(false)
    const canRun = computed(() => !running.value && !isSigner.value && runsLeft.value > 0)

    /**
     * No `refetchQueries` and no way to the overview: the window would not open there. It asks
     * the server only while the store's login state says it might, and a tester's state is
     * settled until the next sign-in (see the hint in the markup). So the page stays, and says
     * what to do -- rather than teaching the store a second writer for a test function.
     */
    const { mutate: startTest } = useMutation(startFirstCreationTest)

    const start = async (withBooking: boolean) => {
      running.value = true
      failed.value = false
      started.value = false
      try {
        await startTest({ withBooking })
        started.value = true
      } catch {
        failed.value = true
      } finally {
        running.value = false
      }
    }

    return () => (
      <SettingsSection title={t('settings.menu.function-tests')}>
        {allowed.value ? (
          <div data-test='function-tests-first-creation'>
            <div class='h5'>{t('settings.functionTests.firstCreation.title')}</div>
            <p class='mt-3'>{t('settings.functionTests.firstCreation.intro')}</p>

            <p class='fw-bold' data-test='function-tests-runs-left'>
              {runsLeftText.value}
            </p>

            {/* The signer cannot be the tester: nobody confirms their own contribution, so the
                backend refuses this account. Said here rather than after the press, because
                after the press there is nothing to see -- the window simply would not open. */}
            {isSigner.value ? (
              <BAlert modelValue={true} variant='warning' data-test='function-tests-signer-hint'>
                {t('settings.functionTests.firstCreation.signerHint')}
              </BAlert>
            ) : null}

            <div class='d-grid gap-2 mt-4'>
              <BButton
                variant='primary'
                disabled={!canRun.value}
                data-test='function-tests-with-booking'
                onClick={() => start(true)}
              >
                {t('settings.functionTests.firstCreation.withBooking')}
              </BButton>
              <BButton
                variant='secondary'
                disabled={!canRun.value}
                data-test='function-tests-without-booking'
                onClick={() => start(false)}
              >
                {t('settings.functionTests.firstCreation.withoutBooking')}
              </BButton>
            </div>

            <p class='small text-muted mt-3'>
              {t('settings.functionTests.firstCreation.unbookedHint')}
            </p>
            {/* Where the member stands reaches the wallet with the login answer, and the window
                asks the server only while that says it might still open (FirstCreation.tsx,
                `mightOpen`). An admin who has created long since holds a settled state, so the
                forced one gets through only with the next sign-in. Said BEFORE the press, so
                nobody waits on the overview for a window that cannot know yet. */}
            <p class='small text-muted' data-test='function-tests-relogin-hint'>
              {t('settings.functionTests.firstCreation.reloginHint')}
            </p>

            {started.value ? (
              <BAlert modelValue={true} variant='success' data-test='function-tests-started'>
                {t('settings.functionTests.firstCreation.started')}
              </BAlert>
            ) : null}
            {failed.value ? (
              <BAlert modelValue={true} variant='danger' data-test='function-tests-failed'>
                {t('settings.functionTests.firstCreation.failed')}
              </BAlert>
            ) : null}
          </div>
        ) : null}
      </SettingsSection>
    )
  },
})
