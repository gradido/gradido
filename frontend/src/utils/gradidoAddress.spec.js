// AI-GENERATED — not an architecture reference

import { describe, expect, it, vi } from 'vitest'
import {
  communityHost,
  gradidoAddress,
  memberAlias,
  sameHost,
  splitRecipient,
} from './gradidoAddress'

vi.mock('@/config', () => ({
  default: { COMMUNITY_URL: 'https://ki-playground.gradido.net' },
}))

describe('memberAlias', () => {
  it('takes the user name when there is one', () => {
    expect(memberAlias('bernd', 'uuid-1')).toBe('bernd')
  })

  // Accounts from before the user name became compulsory. `…/u/<uuid>` resolves, so this
  // is a working address and not a placeholder.
  it('falls back to the Gradido ID', () => {
    expect(memberAlias('', 'uuid-1')).toBe('uuid-1')
    expect(memberAlias(undefined, 'uuid-1')).toBe('uuid-1')
    expect(memberAlias(null, 'uuid-1')).toBe('uuid-1')
  })
})

describe('gradidoAddress', () => {
  // Shown and printed without a scheme (E-008), carried with one -- without it many phone
  // cameras do not offer to open the address at all, and the clipboard has to hand over
  // something that works when pasted into a browser (P-019).
  it('hands out the shown shape and the linked shape together', () => {
    expect(gradidoAddress('bernd')).toEqual({
      host: 'ki-playground.gradido.net',
      display: 'ki-playground.gradido.net/u/bernd',
      link: 'https://ki-playground.gradido.net/u/bernd',
    })
  })

  it('encodes the link but leaves the shown line readable', () => {
    const address = gradidoAddress('a?b')
    expect(address.link).toBe('https://ki-playground.gradido.net/u/a%3Fb')
    expect(address.display).toBe('ki-playground.gradido.net/u/a?b')
  })

  // What it builds must be what the send form accepts -- the two halves of this module
  // are only worth anything together.
  it('builds a shown line the recipient field can read back', () => {
    expect(splitRecipient(gradidoAddress('bernd').display)).toEqual({
      community: 'ki-playground.gradido.net',
      user: 'bernd',
    })
  })

  it('builds a link the recipient field can read back', () => {
    expect(splitRecipient(gradidoAddress('bernd').link)).toEqual({
      community: 'ki-playground.gradido.net',
      user: 'bernd',
    })
  })
})

describe('communityHost', () => {
  it('prints the bare host, without scheme, port path or trailing slash', () => {
    expect(communityHost('https://ki-playground.gradido.net/')).toBe('ki-playground.gradido.net')
    expect(communityHost('http://localhost:3000/wallet')).toBe('localhost:3000')
  })

  it('survives a value that is not a URL at all', () => {
    expect(communityHost('ki-playground.gradido.net')).toBe('ki-playground.gradido.net')
    expect(communityHost('')).toBe('')
  })
})

describe('sameHost', () => {
  // What is stored is the federation endpoint, what is typed is the printed line -- the
  // whole reason a bare host never found its community until now.
  it('sees through the federation endpoint to the host', () => {
    expect(sameHost('https://ki-playground.gradido.net/api/', 'ki-playground.gradido.net')).toBe(
      true,
    )
    expect(sameHost('http://localhost/api/', 'localhost')).toBe(true)
  })

  it('is blind to case, because host names are', () => {
    expect(sameHost('https://ki-playground.gradido.net/api/', 'KI-Playground.Gradido.NET')).toBe(
      true,
    )
  })

  // A bare host with a port reads as a scheme to the URL parser; without the guard this
  // is the one shape that quietly stops matching in a development environment.
  it('keeps a port attached', () => {
    expect(sameHost('http://localhost:3000/api/', 'localhost:3000')).toBe(true)
    expect(sameHost('http://localhost:3000/api/', 'localhost:4000')).toBe(false)
  })

  it('never lets two empty values count as a match', () => {
    expect(sameHost('', '')).toBe(false)
    expect(sameHost(null, undefined)).toBe(false)
    expect(sameHost('', 'ki-playground.gradido.net')).toBe(false)
  })

  it('does not confuse a community name with a host', () => {
    expect(sameHost('https://ki-playground.gradido.net/api/', 'Gradido Entwicklung')).toBe(false)
  })
})

describe('splitRecipient', () => {
  describe('the shapes that were already accepted', () => {
    it('takes a bare user name, e-mail or Gradido ID', () => {
      expect(splitRecipient('Bernd')).toEqual({ community: null, user: 'Bernd' })
      expect(splitRecipient('bernd@example.org')).toEqual({
        community: null,
        user: 'bernd@example.org',
      })
    })

    it('takes community and user separated by one slash', () => {
      expect(splitRecipient('Gradido Entwicklung/Bernd')).toEqual({
        community: 'Gradido Entwicklung',
        user: 'Bernd',
      })
    })
  })

  describe('the printed address', () => {
    it('reads the line as it is printed on the card', () => {
      expect(splitRecipient('ki-playground.gradido.net/u/Bernd')).toEqual({
        community: 'ki-playground.gradido.net',
        user: 'Bernd',
      })
    })

    it('reads the same line with the scheme the copy button adds', () => {
      expect(splitRecipient('https://ki-playground.gradido.net/u/Bernd')).toEqual({
        community: 'ki-playground.gradido.net',
        user: 'Bernd',
      })
    })

    it('forgives the trailing slash a browser address bar hands over', () => {
      expect(splitRecipient('ki-playground.gradido.net/u/Bernd/')).toEqual({
        community: 'ki-playground.gradido.net',
        user: 'Bernd',
      })
    })

    it('forgives surrounding whitespace from a paste', () => {
      expect(splitRecipient('  ki-playground.gradido.net/u/Bernd  ')).toEqual({
        community: 'ki-playground.gradido.net',
        user: 'Bernd',
      })
    })

    it('takes the namespace in either case', () => {
      expect(splitRecipient('ki-playground.gradido.net/U/Bernd')).toEqual({
        community: 'ki-playground.gradido.net',
        user: 'Bernd',
      })
    })
  })

  describe('what it refuses', () => {
    // The point of the namespace: a group, a project or a shop must never be handed to
    // the send form as if it were a person.
    it('refuses every namespace but the one for people', () => {
      expect(splitRecipient('ki-playground.gradido.net/g/Wandergruppe')).toBeNull()
      expect(splitRecipient('ki-playground.gradido.net/p/Waldprojekt')).toBeNull()
      expect(splitRecipient('ki-playground.gradido.net/s/Hofladen')).toBeNull()
    })

    it('refuses more parts than an address has', () => {
      expect(splitRecipient('a/b/c/d')).toBeNull()
    })

    it('refuses an empty part anywhere', () => {
      expect(splitRecipient('/u/Bernd')).toBeNull()
      expect(splitRecipient('ki-playground.gradido.net/u/')).toBeNull()
      expect(splitRecipient('')).toBeNull()
      expect(splitRecipient('   ')).toBeNull()
    })

    it('refuses a query or a fragment, which would end up inside the user name', () => {
      expect(splitRecipient('ki-playground.gradido.net/u/Bernd?from=card')).toBeNull()
      expect(splitRecipient('ki-playground.gradido.net/u/Bernd#top')).toBeNull()
    })

    it('refuses a scheme on any shape but the full address', () => {
      expect(splitRecipient('https://ki-playground.gradido.net/Bernd')).toBeNull()
      expect(splitRecipient('https://Bernd')).toBeNull()
    })

    // These resolve to exactly the same person as the https form, because the scheme is
    // thrown away. They are refused anyway: a line that works here and in no browser is
    // one that will be printed or pasted into a signature one day.
    it('refuses a scheme an address is never served under', () => {
      expect(splitRecipient('ftp://ki-playground.gradido.net/u/Bernd')).toBeNull()
      expect(splitRecipient('javascript://ki-playground.gradido.net/u/Bernd')).toBeNull()
      expect(splitRecipient('file://ki-playground.gradido.net/u/Bernd')).toBeNull()
    })

    it('keeps http, which is what a local community is served over', () => {
      expect(splitRecipient('http://localhost:3000/u/Bernd')).toEqual({
        community: 'localhost:3000',
        user: 'Bernd',
      })
    })

    it('survives nothing at all', () => {
      expect(splitRecipient(null)).toBeNull()
      expect(splitRecipient(undefined)).toBeNull()
    })
  })
})
