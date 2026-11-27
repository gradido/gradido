// AI-GENERATED — not an architecture reference
import CONFIG from '@frontend/config'
import m from 'mithril'
import { aliasSchema, uuidv4Schema } from 'shared/browser'
import * as v from 'valibot'
import { AuthTriads } from '@/components/layout/auth/AuthTriads'
import { authLink } from '@/components/layout/auth/authLink'
import { GradidoAddressCopy } from '@/components/member/GradidoAddressCopy'
import { t } from '@/i18n'
import classes from './PublicProfile.module.css'

/**
 * What a Gradido address (`/u/<name>`) opens for anybody: who shows Gradido, and the two ways
 * on -- sending to them, or opening an account. It asks the server nothing: whether there is
 * such a member is not told to somebody not signed in.
 */
export class PublicProfile implements m.ClassComponent {
  view() {
    const alias = String(m.route.param('alias'))
    // The member learns who arrived through their address: only where it names them by a
    // user name, which the registration takes along.
    const leavesTrace = v.is(aliasSchema, alias)
    return m(
      '.public-profile.text-center',
      m(AuthTriads),
      m(
        'h2.h4.mb-2',
        { 'data-test': 'public-profile-shows' },
        // an ID greets nobody by it
        v.is(uuidv4Schema, alias)
          ? t('public-profile.showsSomebody')
          : t('public-profile.shows', { name: alias }),
      ),
      m('p.small.mb-4', { 'data-test': 'public-profile-lead' }, t('public-profile.lead')),
      // Two buttons of one size, neither ranked: the page cannot know whether a member or a
      // guest is looking at it.
      m(
        '.profile-actions',
        { class: classes['profile-actions'] },
        m(
          m.route.Link,
          {
            class: 'btn btn-gradido fs-7 profile-action',
            href: `/send/${encodeURIComponent(CONFIG.COMMUNITY_NAME)}/${encodeURIComponent(alias)}`,
            'data-test': 'public-profile-send',
          },
          t('public-profile.send'),
        ),
        m(
          m.route.Link,
          {
            class: 'btn btn-gradido fs-7 profile-action',
            href: authLink('/register', leavesTrace ? { referrer: alias } : {}),
            'data-test': 'public-profile-register',
          },
          t('public-profile.join'),
        ),
      ),
      m('.mt-4', m('.small', t('public-profile.address')), m(GradidoAddressCopy, { alias })),
      m(
        'p.small.mt-4.mb-0',
        { 'data-test': 'public-profile-duration' },
        t('public-profile.duration', { communityName: CONFIG.COMMUNITY_NAME }),
      ),
      leavesTrace
        ? m(
            'p.small.mt-2.mb-0',
            { 'data-test': 'public-profile-echo-hint' },
            t('public-profile.echoHint', { name: alias }),
          )
        : undefined,
    )
  }
}
