// AI-GENERATED — not an architecture reference
import m from 'mithril'

/**
 * The address of the sign-in or of the registration, as the page shown leads there: what its
 * own address carries goes along -- the code of a link (`/login/<code>`), and the query (a
 * project, who showed Gradido, a guarantor code). `more` is added to that query.
 */
export function authLink(page: '/login' | '/register', more: Record<string, string> = {}) {
  const query = new URLSearchParams(location.search)
  for (const [name, value] of Object.entries(more)) {
    query.set(name, value)
  }
  // Mithril hands a query out as parameters too: a `?code=` reads as the code of a link
  // here, and leads where `/register/<code>` typed by hand leads as well.
  const code: unknown = m.route.param('code')
  return [
    page,
    typeof code === 'string' ? `/${encodeURIComponent(code)}` : '',
    query.size ? `?${query}` : '',
  ].join('')
}
