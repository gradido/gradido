// AI-GENERATED — not an architecture reference
import { CONFIG } from '@admin/config'
import {
  deleteProjectBranding,
  upsertProjectBranding,
} from '@admin/graphql/projectBranding.graphql'
import m, { type ClassComponent, type Vnode } from 'mithril'
import * as v from 'valibot'
import { Tooltip } from '@/components/bootstrap/Tooltip'
import { phoneLabel } from '@/components/federation/phoneLabel'
import { toastError, toastSuccess } from '@/components/Toasts'
import { type ProjectBranding, upsertedProjectBrandingSchema } from '@/data/ProjectBranding.schema'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import checkIcon from '~icons/bi/check'
import copyIcon from '~icons/bi/copy'
import trashIcon from '~icons/bi/trash'
import xIcon from '~icons/bi/x'
import { ProjectBrandingForm } from './ProjectBrandingForm'

interface Attrs {
  item: ProjectBranding
  /** saved: the entry as the server answered it */
  onsaved: (item: ProjectBranding) => void
  ondeleted: (id: number | undefined) => void
}

// a button with its name above it while the pointer or the focus is on it
const iconButton = (variant: string, label: string, svg: string, onclick: () => void) =>
  m(
    Tooltip,
    { title: label },
    m(
      `button.btn.btn-md.btn-${variant}`,
      {
        type: 'button',
        'aria-label': label,
        onclick: (event: MouseEvent) => {
          // not a click on the row, which opens the details
          event.stopPropagation()
          onclick()
        },
      },
      m.trust(svg),
    ),
  )

/** An entry of the list: its values in a row, a click on it opens its form below. */
export class ProjectBrandingItem implements ClassComponent<Attrs> {
  private details = false

  private async copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toastSuccess(t('copied-to-clipboard'))
    } catch (error) {
      toastError((error as Error).message)
    }
  }

  private async save(form: ProjectBranding, onsaved: Attrs['onsaved']) {
    const answer = await graphqlRequest(upsertProjectBranding, { input: form })
    if (!answer.success) {
      toastError(t('projectBranding.error', { message: answer.error.message }))
      return
    }
    onsaved(v.parse(upsertedProjectBrandingSchema, answer.value).upsertProjectBranding)
    toastSuccess(t(form.id ? 'projectBranding.updated' : 'projectBranding.created'))
    this.details = false
  }

  private async remove(id: number | undefined, ondeleted: Attrs['ondeleted']) {
    const answer = await graphqlRequest(deleteProjectBranding, { id })
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    ondeleted(id)
  }

  view({ attrs: { item, onsaved, ondeleted } }: Vnode<Attrs>) {
    const loginUrl = item.alias ? `${CONFIG.WALLET_LOGIN_URL}?project=${item.alias}` : undefined
    return m('.project-branding-item', [
      m('.row', { title: item.description, onclick: () => (this.details = !this.details) }, [
        m('.col-12.col-lg-3.text-break', [
          `${item.name} `,
          m('br'),
          loginUrl
            ? [
                ` ${loginUrl} `,
                iconButton('secondary', t('copy-to-clipboard'), copyIcon, () =>
                  this.copy(loginUrl),
                ),
              ]
            : null,
        ]),
        m('.col-12.col-lg-2.text-break', [phoneLabel(t('alias')), item.alias]),
        m('.col-12.col-lg-2', [
          phoneLabel(t('projectBranding.newUserToSpace')),
          item.newUserToSpace
            ? m('span.text-success', m.trust(checkIcon))
            : m('span.text-danger', m.trust(xIcon)),
        ]),
        m('.col-12.col-lg-3.me-lg-2', [
          phoneLabel(t('logo')),
          m('img.img-fluid', { src: item.logoUrl, alt: item.logoUrl }),
        ]),
        m(
          '.col-12.col-lg-1',
          iconButton('danger', t('delete'), trashIcon, () => this.remove(item.id, ondeleted)),
        ),
      ]),
      this.details || item.id === undefined
        ? m(
            '.row.details',
            m(
              '.col',
              { colspan: '5' },
              m(
                '.card',
                m(
                  '.card-body',
                  m(ProjectBrandingForm, { item, onsave: (form) => this.save(form, onsaved) }),
                ),
              ),
            ),
          )
        : null,
    ])
  }
}
