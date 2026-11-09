// AI-GENERATED — not an architecture reference
import { adminOpenCreationCounts } from '@admin/graphql/adminListContributions.graphql'
import m, { type ClassComponent } from 'mithril'
import { toastError } from '@/components/Toasts'
import { type OpenCreationCounts, openCreationsOf } from '@/data/OpenCreations.logic'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import { setOpenCreations } from '@/store/admin.store'

/**
 * The first page, where a sign-in goes on to and the coin in the bar leads: what is waiting.
 * Every moderator opens it every time, so what stands here has to be cheap for the server; the
 * figures that take it seconds have a page of their own (Statistic).
 */
export class Dashboard implements ClassComponent {
  private counts: ReturnType<typeof openCreationsOf> | null = null

  async oninit() {
    // Also what the badge in the bar counts, so it is asked anew each time. The server limits
    // all three to the groups of a group moderator.
    const answer = await graphqlRequest<OpenCreationCounts>(adminOpenCreationCounts)
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    this.counts = openCreationsOf(answer.value)
    setOpenCreations(this.counts.open)
  }

  private today(open: number) {
    if (!open) {
      return t('dashboard.todayNone')
    }
    return open === 1 ? t('dashboard.todayOne') : t('dashboard.today', { n: open })
  }

  view() {
    const counts = this.counts
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
    ])
  }
}
