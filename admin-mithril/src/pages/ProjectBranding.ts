// AI-GENERATED — not an architecture reference
import { projectBrandings } from '@admin/graphql/projectBranding.graphql'
import m, { type ClassComponent } from 'mithril'
import * as v from 'valibot'
import { ProjectBrandingItem } from '@/components/projectBranding/ProjectBrandingItem'
import { toastError } from '@/components/Toasts'
import {
  type ProjectBranding as Entry,
  newProjectBranding,
  projectBrandingsSchema,
} from '@/data/ProjectBranding.schema'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import refreshIcon from '~icons/bi/arrow-clockwise'
import plusIcon from '~icons/bi/plus'

/**
 * The project brandings: a logo of its own in the login of the wallet, and the Humhub space new
 * members of the project join. Only administrators reach the page.
 */
export class ProjectBranding implements ClassComponent {
  // the list of the last answer, with the new entry until it is saved
  private entries: Entry[] = []

  oninit() {
    this.load()
  }

  private async load() {
    const answer = await graphqlRequest(projectBrandings)
    if (!answer.success) {
      // the list shown stays as it was
      toastError(answer.error.message)
      return
    }
    this.entries = v.parse(projectBrandingsSchema, answer.value).projectBrandings
  }

  // the saved entry takes the place of the one with its id, or of the new one
  private updated(saved: Entry) {
    const index = this.entries.findIndex((entry) => entry.id === saved.id || entry.id === undefined)
    this.entries.splice(index, 1, saved)
  }

  view() {
    const adding = this.entries.some((entry) => entry.id === undefined)
    return m('.project-branding', [
      m('.d-flex.justify-content-between.align-items-center.mb-3', [
        m('span.h2', t('projectBranding.title')),
        m('div', [
          m(
            'button.btn.btn-md.btn-primary.me-3',
            {
              type: 'button',
              'data-test': 'project-branding-add-btn',
              title: t('projectBranding.addTooltip'),
              disabled: adding,
              class: adding ? 'disabled' : '',
              onclick: () => this.entries.push(newProjectBranding()),
            },
            m.trust(plusIcon),
          ),
          m(
            'button.btn.btn-md.btn-secondary',
            {
              type: 'button',
              'data-test': 'project-branding-refresh-btn',
              // a symbol and nothing else: the name is all a screen reader has of it
              title: t('refresh'),
              'aria-label': t('refresh'),
              onclick: () => this.load(),
            },
            m.trust(refreshIcon),
          ),
        ]),
      ]),
      m('.list-group', [
        // The heads of the columns, from 992px on; below, every entry is a card whose values
        // carry a small name of their own.
        m('.row.d-none.d-lg-flex', [
          m('.col-3.ms-1.text-break', `${t('name')} + ${t('link')}`),
          m('.col-2.text-break', t('alias')),
          m(
            '.col-2.text-break',
            { title: t('projectBranding.newUserToSpaceTooltip') },
            t('projectBranding.newUserToSpace'),
          ),
          m('.col-3.text-break', t('logo')),
          m('.col-1.text-break', t('actions')),
        ]),
        this.entries.map((entry) =>
          m(
            '.list-group-item',
            { key: entry.id ?? 'new' },
            m(ProjectBrandingItem, {
              item: entry,
              onsaved: (saved) => this.updated(saved),
              ondeleted: (id) => {
                this.entries = this.entries.filter((other) => other.id !== id)
              },
            }),
          ),
        ),
      ]),
    ])
  }
}
