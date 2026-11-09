// AI-GENERATED — not an architecture reference

// Apollo matches a fragment by __typename, which the real server sends along; without it the
// old admin reads the fields of a fragment as missing.
export const projectBranding = (id: number, name: string, alias: string) => ({
  __typename: 'ProjectBranding',
  id,
  name,
  alias,
  description: `About ${name}`,
  spaceId: id === 1 ? 21 : null,
  newUserToSpace: id === 1,
  logoUrl: `https://example.org/${alias}.png`,
})

export const space = (id: number) => ({
  __typename: 'Space',
  id,
  name: `Space ${id}`,
  description: `Description of space ${id}`,
  url: `https://humhub.example.org/s/space-${id}`,
})

/** A page of spaces, 20 to the page as the admin asks. */
export const spacesPage = (page: number, total: number) => ({
  pagination: { __typename: 'Pagination', total, page, pages: Math.ceil(total / 20) },
  results: Array.from({ length: Math.min(20, total - (page - 1) * 20) }, (_, index) =>
    space((page - 1) * 20 + index + 1),
  ),
})
