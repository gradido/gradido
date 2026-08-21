import { SearchUsersFilters } from '@arg/SearchUsersFilters'
import { Order } from '@enum/Order'
import { User as DbUser } from 'database'
import { IsNull, Like, Not } from 'typeorm'

function likeQuery(searchCriteria: string) {
  return Like(`%${searchCriteria}%`)
}

function emailCheckedQuery(filters: SearchUsersFilters) {
  return filters.byActivated ?? undefined
}

function deletedAtQuery(filters: SearchUsersFilters | null) {
  return filters?.byDeleted !== undefined && filters?.byDeleted !== null
    ? filters.byDeleted
      ? Not(IsNull())
      : IsNull()
    : undefined
}

export const findUsers = async (
  select: string[],
  searchCriteria: string,
  filters: SearchUsersFilters | null,
  currentPage: number,
  pageSize: number,
  order = Order.ASC,
): Promise<[DbUser[], number]> => {
  const where = [
    {
      firstName: likeQuery(searchCriteria),
      deletedAt: deletedAtQuery(filters),
      emailContact: filters
        ? {
            emailChecked: emailCheckedQuery(filters),
          }
        : undefined,
    },
    {
      lastName: likeQuery(searchCriteria),
      deletedAt: deletedAtQuery(filters),
      emailContact: filters
        ? {
            emailChecked: emailCheckedQuery(filters),
          }
        : undefined,
    },
    {
      // Every address a member ever had, not only the current one: somebody arriving from
      // the GDT server holds the address that was first - which may well be one the member
      // has since changed. The "activated" filter still reads the current address.
      userContacts: {
        email: likeQuery(searchCriteria),
      },
      emailContact: filters
        ? {
            emailChecked: emailCheckedQuery(filters),
          }
        : undefined,
      deletedAt: deletedAtQuery(filters),
    },
  ]
  const selectFind = Object.fromEntries(select.map((item) => [item, true]))
  const relations = ['emailContact', 'userRoles']
  const orderFind = {
    id: order,
  }
  const take = pageSize
  const skip = (currentPage - 1) * pageSize
  const withDeleted = true

  const [users, count] = await DbUser.findAndCount({
    where,
    withDeleted,
    select: selectFind,
    relations,
    order: orderFind,
    take,
    skip,
  })
  return [users, count]
}
