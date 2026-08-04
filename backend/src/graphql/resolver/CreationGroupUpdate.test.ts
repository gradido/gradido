import { RoleNames } from '@enum/RoleNames'
import { cleanDB, testEnvironment } from '@test/helpers'
import { AppDatabase, CreationGroup, UserRole } from 'database'
import { getLogger as originalGetLogger } from 'log4js'
import { CreationGroupResolver } from './CreationGroupResolver'
import { parseModeratorScope } from './util/findContributions'

// Group functions: editing a canonical creation group. Contributions and personal
// user tag lists reference the numeric id, so a rename leaves them intact; the moderator
// visibility scope stores the tag as a string and must be migrated in lock-step.
// Deleting is intentionally not offered.

let db: AppDatabase
const resolver = new CreationGroupResolver()

beforeAll(async () => {
  const testEnv = await testEnvironment(originalGetLogger('apollo'))
  db = testEnv.db
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

const makeTag = async (tag: string, name: string | null): Promise<CreationGroup> => {
  const entry = CreationGroup.create()
  entry.tag = tag
  entry.name = name
  await entry.save()
  return entry
}

const makeModerator = async (userId: number, scope: string[]): Promise<void> => {
  const role = UserRole.create()
  role.createdAt = new Date()
  role.userId = userId
  role.role = RoleNames.MODERATOR
  role.visibleCreationGroups = JSON.stringify(scope)
  await role.save()
}

describe('editCreationGroup', () => {
  it('changes only the display name, leaving the slug untouched', async () => {
    const tag = await makeTag('gardening', 'Gardening')
    await resolver.editCreationGroup(tag.id, null, 'Community Garden')
    const reloaded = await CreationGroup.findOneOrFail({ where: { id: tag.id } })
    expect(reloaded.tag).toBe('gardening')
    expect(reloaded.name).toBe('Community Garden')
  })

  it('renames the slug and migrates it through moderator scopes, leaving other entries alone', async () => {
    const tag = await makeTag('oldbrigade', 'Brigade')
    await makeModerator(900001, ['oldbrigade', 'music', '*untagged'])
    await makeModerator(900002, ['music'])

    // A leading '#' is stripped, so '#newbrigade' is stored canonically as 'newbrigade'.
    await resolver.editCreationGroup(tag.id, '#newbrigade', null)

    const reloaded = await CreationGroup.findOneOrFail({ where: { id: tag.id } })
    expect(reloaded.tag).toBe('newbrigade')

    const scoped = await UserRole.findOneOrFail({ where: { userId: 900001 } })
    expect(parseModeratorScope(scoped.visibleCreationGroups)).toEqual([
      'newbrigade',
      'music',
      '*untagged',
    ])

    const untouched = await UserRole.findOneOrFail({ where: { userId: 900002 } })
    expect(parseModeratorScope(untouched.visibleCreationGroups)).toEqual(['music'])
  })

  it('rejects a slug rename that collides with an existing tag', async () => {
    await makeTag('collide-a', null)
    const b = await makeTag('collide-b', null)
    await expect(resolver.editCreationGroup(b.id, 'collide-a')).rejects.toThrow()
  })

  it('rejects an invalid slug (inner whitespace)', async () => {
    const tag = await makeTag('valid-slug', null)
    await expect(resolver.editCreationGroup(tag.id, 'has space')).rejects.toThrow()
  })

  it('throws when the group does not exist', async () => {
    await expect(resolver.editCreationGroup(987654, null, 'x')).rejects.toThrow()
  })
})

describe('creation groups with capitals and accented letters', () => {
  // The tables are utf8mb4, so German and Scandinavian umlauts must survive a round trip
  // through the database byte for byte, capitals included.
  const CASES = ['Grünwald-Süd', 'Straßenfest', 'Ålesund', 'Nørrebro', 'Æblegård', 'THW']

  it('stores and returns them unchanged', async () => {
    for (const tag of CASES) {
      const created = await resolver.addCreationGroup(tag, `Gruppe ${tag}`)
      expect(created.tag).toBe(tag)

      const reloaded = await CreationGroup.findOneOrFail({ where: { id: created.id } })
      expect(reloaded.tag).toBe(tag)
      expect(reloaded.name).toBe(`Gruppe ${tag}`)
    }
  })

  it('renames to an accented slug without losing characters', async () => {
    const tag = await makeTag('plain-slug', 'Plain')
    await resolver.editCreationGroup(tag.id, 'Öffentlichkeitsarbeit', null)
    const reloaded = await CreationGroup.findOneOrFail({ where: { id: tag.id } })
    expect(reloaded.tag).toBe('Öffentlichkeitsarbeit')
  })

  // ⚠️ A group must not clash with ITSELF. The lookup runs on a utf8mb4_unicode_ci column
  // and is therefore case- and accent-insensitive, so searching for the new spelling
  // returns the very group being renamed. Without an id check that reads as "already
  // exists" -- which made every purely cosmetic respelling impossible, and blocked the one
  // way to reach memos carrying a misspelling: rename the group onto it, adopt, rename back.
  describe('respelling a group as itself', () => {
    it('allows dropping an umlaut from its own slug', async () => {
      const tag = await makeTag('Mönchengladbach', 'Mönchengladbach')
      await resolver.editCreationGroup(tag.id, 'Monchengladbach', null)
      const reloaded = await CreationGroup.findOneOrFail({ where: { id: tag.id } })
      expect(reloaded.tag).toBe('Monchengladbach')
    })

    it('allows changing only the capitalisation', async () => {
      const tag = await makeTag('feuerwache', 'Feuerwache')
      await resolver.editCreationGroup(tag.id, 'Feuerwache', null)
      const reloaded = await CreationGroup.findOneOrFail({ where: { id: tag.id } })
      expect(reloaded.tag).toBe('Feuerwache')
    })

    // The round trip is the point: rename onto the misspelling, adopt, rename back.
    it('survives being renamed there and back', async () => {
      const tag = await makeTag('Grünwald', 'Grünwald')
      await resolver.editCreationGroup(tag.id, 'Grunwald', null)
      await resolver.editCreationGroup(tag.id, 'Grünwald', null)
      const reloaded = await CreationGroup.findOneOrFail({ where: { id: tag.id } })
      expect(reloaded.tag).toBe('Grünwald')
    })

    // The guard that must stay: a DIFFERENT group already holding that spelling still wins.
    it('still refuses a slug another group already holds', async () => {
      const mine = await makeTag('kantine', 'Kantine')
      await makeTag('Werkstatt', 'Werkstatt')
      await expect(resolver.editCreationGroup(mine.id, 'werkstatt', null)).rejects.toThrow(
        'Creation group already exists',
      )
      const reloaded = await CreationGroup.findOneOrFail({ where: { id: mine.id } })
      expect(reloaded.tag).toBe('kantine')
    })
  })
})

// The moderator scope and the group filter both read '*all' and '*untagged' as reserved
// words meaning "everything" and "no group". A real group carrying such a slug would
// quietly take over that meaning, so '*' is refused at the door — on creating and on
// renaming, since either way in would be enough.
describe('reserved slugs', () => {
  const RESERVED = ['*untagged', '*all', '*anything']

  it('refuses to create a group whose slug starts with "*"', async () => {
    for (const tag of RESERVED) {
      await expect(resolver.addCreationGroup(tag, 'Reserved')).rejects.toThrow(
        'Invalid creation group',
      )
      expect(await CreationGroup.findOne({ where: { tag } })).toBeNull()
    }
  })

  it('refuses to rename an existing group onto such a slug', async () => {
    const tag = await makeTag('ordinary', 'Ordinary')
    for (const reserved of RESERVED) {
      await expect(resolver.editCreationGroup(tag.id, reserved, null)).rejects.toThrow(
        'Invalid creation group',
      )
    }
    const reloaded = await CreationGroup.findOneOrFail({ where: { id: tag.id } })
    expect(reloaded.tag).toBe('ordinary')
  })

  it('still accepts a slug that merely contains "*" somewhere else', async () => {
    const created = await resolver.addCreationGroup('a*b', 'Odd but harmless')
    expect(created.tag).toBe('a*b')
  })
})
