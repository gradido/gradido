import { IsNull, Not, Like } from '@dbTools/typeorm'
import { User as DbUser } from '@entity/User'

import { SearchUsersFilters } from '@arg/SearchUsersFilters'
import { Order } from '@enum/Order'

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
      userContacts: filters
        ? {
            emailChecked: emailCheckedQuery(filters),
          }
        : undefined,
    },
    {
      lastName: likeQuery(searchCriteria),
      deletedAt: deletedAtQuery(filters),
      userContacts: filters
        ? {
            emailChecked: emailCheckedQuery(filters),
          }
        : undefined,
    },
    {
      userContacts: {
        // ...(filters ?? emailChecked: filters.byActivated)
        emailChecked: filters ? emailCheckedQuery(filters) : undefined,
        email: likeQuery(searchCriteria),
      },
      deletedAt: deletedAtQuery(filters),
    },
  ]
  const selectFind = Object.fromEntries(select.map((item) => [item, true]))
  const relations = { userContacts: true, userRoles: true }
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
