// AI-GENERATED — not an architecture reference
import { adminOpenCreationCounts } from '@admin/graphql/adminListContributions.graphql'
import m, { type ClassComponent } from 'mithril'
import { toastError } from '@/components/Toasts'
import { type OpenCreationCounts, openCreationsOf } from '@/data/OpenCreations.logic'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import { setOpenCreations } from '@/store/admin.store'
import { askOpenSupportTickets } from '@/store/openSupportTickets.store'

type SupportCounts = NonNullable<Awaited<ReturnType<typeof askOpenSupportTickets>>>

/**
 * The first page, where a sign-in goes on to and the coin in the bar leads: what is waiting.
 * Every moderator opens it every time, so what stands here has to be cheap for the server; the
 * figures that take it seconds have a page of their own (Statistic).
 */
export class Dashboard implements ClassComponent {
  private counts: ReturnType<typeof openCreationsOf> | null = null
  // the creation's counts have answered or failed: the support's lines stand below them, and
  // come only then, so that nothing moves down under the eye
  private creationsAsked = false
  private support: SupportCounts | null = null

  oninit() {
    // Two questions side by side: neither waits for the other, and either may fail alone.
    this.askCreations()
    this.askSupport()
  }

  private async askCreations() {
    // Also what the badge in the bar counts, so it is asked anew each time. The server limits
    // all three to the groups of a group moderator.
    const answer = await graphqlRequest<OpenCreationCounts>(adminOpenCreationCounts)
    this.creationsAsked = true
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    this.counts = openCreationsOf(answer.value)
    setOpenCreations(this.counts.open)
  }

  private async askSupport() {
    // The support's open tab in the moderator's groups (Support-Anfragen K3); the badges count
    // the same.
    this.support = await askOpenSupportTickets()
    if (!this.support) {
      toastError(t('support.loadFailed'))
    }
  }

  private today(open: number) {
    if (!open) {
      return t('dashboard.todayNone')
    }
    return open === 1 ? t('dashboard.todayOne') : t('dashboard.today', { n: open })
  }

  private supportToday(open: number) {
    if (!open) {
      return t('dashboard.supportNone')
    }
    return open === 1 ? t('dashboard.supportOne') : t('dashboard.support', { n: open })
  }

  view() {
    const counts = this.counts
    const support = this.creationsAsked ? this.support : null
    const supportOpen = support ? support.forModeration + support.forMember : 0
    return m('.admin-dashboard', [
      m('h2.h4.mb-3', t('dashboard.welcome')),
      counts
        ? m(
            'p.mb-1',
            m(
              m.route.Link,
              { href: '/creation-confirm', 'data-test': 'open-creations' },
              this.today(counts.open),
            ),
          )
        : null,
      // The two lines add up to the number above. Both stand, also at 0: "nothing waits for the
      // moderation" is what a moderator looks for here.
      counts?.open
        ? m('ul.list-unstyled.ms-3.mb-1', { 'data-test': 'open-creations-waiting' }, [
            m(
              'li',
              { 'data-test': 'waiting-for-moderation' },
              t(
                'dashboard.waitingForModeration',
                { n: counts.forModeration },
                counts.forModeration,
              ),
            ),
            m(
              'li',
              { 'data-test': 'waiting-for-member' },
              t('dashboard.waitingForMember', { n: counts.forMember }, counts.forMember),
            ),
          ])
        : null,
      // not part of the number above, so it says "also"
      counts?.onResubmission
        ? m(
            'p.mb-1',
            { 'data-test': 'on-resubmission' },
            t('dashboard.resubmission', { n: counts.onResubmission }),
          )
        : null,
      // the support requests of the open tab, below the creation's lines, in the same form
      support
        ? m(
            'p.mb-1.mt-3',
            m(
              m.route.Link,
              { href: '/support', 'data-test': 'open-support-tickets' },
              this.supportToday(supportOpen),
            ),
          )
        : null,
      support && supportOpen
        ? m('ul.list-unstyled.ms-3.mb-1', { 'data-test': 'support-waiting' }, [
            m(
              'li',
              { 'data-test': 'support-waiting-for-moderation' },
              t(
                'dashboard.waitingForModeration',
                { n: support.forModeration },
                support.forModeration,
              ),
            ),
            m(
              'li',
              { 'data-test': 'support-waiting-for-member' },
              t('dashboard.waitingForMember', { n: support.forMember }, support.forMember),
            ),
          ])
        : null,
      // not part of the number above, so it says "also", as for contributions (K4)
      support?.onResubmission
        ? m(
            'p.mb-1',
            { 'data-test': 'support-on-resubmission' },
            t('dashboard.resubmission', { n: support.onResubmission }),
          )
        : null,
    ])
  }
}
