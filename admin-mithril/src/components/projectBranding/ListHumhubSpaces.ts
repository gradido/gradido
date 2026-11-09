// AI-GENERATED — not an architecture reference
import classes from '@admin/components/ProjectBranding/ListHumhubSpaces.module.css'
import m, { type ClassComponent, type Vnode } from 'mithril'
import { Pagination } from '@/components/bootstrap/Pagination'
import type { Space, SpacesPage } from '@/data/ProjectBranding.schema'
import { t } from '@/i18n'

export const SPACES_PER_PAGE = 20

interface Attrs {
  /** the page of spaces shown */
  spaces: SpacesPage
  chosen: number | null | undefined
  onchoose: (space: Space) => void
  onpage: (page: number) => void
}

/** A page of the Humhub spaces to choose from, each with a link to open it in Humhub. */
export class ListHumhubSpaces implements ClassComponent<Attrs> {
  view({ attrs: { spaces, chosen, onchoose, onpage } }: Vnode<Attrs>) {
    const { pagination, results } = spaces
    return m('div', [
      m(
        'ul.list-unstyled.list-group.mb-3',
        { class: classes.spaces },
        results.map((space) =>
          m(
            'li.list-group-item.list-group-item-action.d-flex.justify-content-between.align-items-center.cursor-pointer',
            {
              key: space.id,
              title: space.description,
              class: space.id === chosen ? 'active' : '',
              onclick: () => onchoose(space),
            },
            [
              m('div', [
                // named after its space: the name beside it is not its label
                m('input.me-2', {
                  type: 'radio',
                  value: space.id,
                  checked: space.id === chosen,
                  'aria-label': space.name,
                }),
                ` ${space.name}`,
              ]),
              m(
                'a',
                {
                  href: space.url,
                  target: '_blank',
                  onclick: (event: MouseEvent) => event.stopPropagation(),
                },
                t('projectBranding.openSpaceInHumhub'),
              ),
            ],
          ),
        ),
      ),
      pagination.total > SPACES_PER_PAGE
        ? m(Pagination, {
            page: pagination.page,
            pages: Math.ceil(pagination.total / SPACES_PER_PAGE),
            controls: 'list-humhub-spaces',
            onpage,
          })
        : null,
    ])
  }
}
