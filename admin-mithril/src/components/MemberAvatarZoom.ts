// AI-GENERATED — not an architecture reference
import '@admin/components/MemberAvatarZoom.css'
import classes from '@admin/components/MemberAvatarZoom.module.css'
import m, { type ClassComponent } from 'mithril'
import { Modal } from '@/components/bootstrap/Modal'
import { t } from '@/i18n'
import { closeMemberAvatarZoom, memberAvatarZoom } from '@/store/memberAvatarZoom.store'

/**
 * A member's picture, large and round, without a head or buttons: a tap on it or beside it, or
 * Escape, closes it. The full size lies over the small one: the swap is a sharpening, not a blink.
 */
export class MemberAvatarZoom implements ClassComponent {
  view() {
    const { shown } = memberAvatarZoom
    return shown
      ? m(
          Modal,
          {
            onclose: closeMemberAvatarZoom,
            centered: true,
            header: false,
            label: shown.label,
            contentClass: 'member-avatar-zoom-content',
            bodyClass: 'member-avatar-zoom-body',
          },
          m(
            'button',
            {
              type: 'button',
              class: classes.memberAvatarZoomCloser,
              'aria-label': t('close'),
              'data-test': 'member-avatar-zoom-closer',
              onclick: closeMemberAvatarZoom,
            },
            m('span', { class: classes.memberAvatarZoomStage }, [
              m('img', {
                class: classes.memberAvatarZoomImage,
                src: shown.src,
                alt: shown.label,
                'data-test': 'member-avatar-zoom-small',
              }),
              shown.full
                ? m('img', {
                    class: `${classes.memberAvatarZoomImage} member-avatar-zoom-image-full`,
                    src: shown.full,
                    alt: '',
                    'data-test': 'member-avatar-zoom-full',
                  })
                : null,
            ]),
          ),
        )
      : null
  }
}
