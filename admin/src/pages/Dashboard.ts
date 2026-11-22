// AI-GENERATED — not an architecture reference

import m, { type ClassComponent } from 'mithril'
import { toastError } from '@/components/Toasts'
import { supportIsTheirs } from '@/data/Moderator.logic'
import { type OpenCreationCounts, openCreationsOf } from '@/data/OpenCreations.logic'
import { adminOpenCreationCounts } from '@/graphql/adminListContributions.graphql'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import {
  adminStore,
  askingHandledCreationGroups,
  keepHandledCreationGroups,
} from '@/store/admin.store'
import { answerOpenCreations, askingOpenCreations } from '@/store/openCreations.store'
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
    // Two questions side by side: neither waits for the other, and either may fail alone. The
    // support's only where it is theirs (K6): nobody else is asked for it, and nobody shown it.
    this.askCreations()
    if (supportIsTheirs(adminStore.moderator)) {
      this.askSupport()
    }
  }

  private async askCreations() {
    // Also what the badge in the bar counts, so it is asked anew each time. The server limits
    // all of them to the groups of a group moderator, and the three of "Meine Gruppen" (MG1) to
    // the choice of whoever sees every group.
    const of = adminStore.moderator?.gradidoID
    // marked as the question goes out: a later question or save overtakes the answer, also where
    // this page is left by then (MG1)
    const badgeAsked = askingOpenCreations()
    const choiceAsked = askingHandledCreationGroups()
    const answer = await graphqlRequest<OpenCreationCounts>(adminOpenCreationCounts)
    this.creationsAsked = true
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    this.counts = openCreationsOf(answer.value)
    answerOpenCreations(badgeAsked, this.counts.open)
    keepHandledCreationGroups(of, answer.value.handledCreationGroups, choiceAsked)
  }

  private async askSupport() {
    // The support's open tab in the moderator's groups (Support-Anfragen K3); the badges count
    // the same.
    this.support = await askOpenSupportTickets()
    // where the server refused, the support is no longer theirs (askOpenSupportTickets): nothing
    // to report then -- any other failure is
    if (!this.support && supportIsTheirs(adminStore.moderator)) {
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

  private supportElsewhere(open: number) {
    return open === 1
      ? t('dashboard.supportElsewhereOne')
      : t('dashboard.supportElsewhere', { n: open })
  }

  view() {
    // who switched an area off in "Meine Gruppen" (MG5) reads nothing of it here
    const counts = this.counts?.off ? null : this.counts
    const support = this.creationsAsked && !this.support?.off ? this.support : null
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
      // What is open outside "Meine Gruppen", quietly and without a link: nothing waits unseen
      // that nobody ticked (MG1).
      counts?.elsewhere
        ? m(
            'p.mb-1.text-body-secondary',
            { 'data-test': 'open-elsewhere' },
            counts.elsewhere === 1
              ? t('dashboard.elsewhereOne')
              : t('dashboard.elsewhere', { n: counts.elsewhere }),
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
      // What is open outside "Meine Gruppen", quietly and without a link, as for contributions
      // (MG2); the server counts it only for whoever chose, so it never stands for anybody else.
      support?.elsewhere
        ? m(
            'p.mb-1.text-body-secondary',
            { 'data-test': 'support-open-elsewhere' },
            this.supportElsewhere(support.elsewhere),
          )
        : null,
    ])
  }
}
