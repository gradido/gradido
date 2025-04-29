import { GraphQLResolveInfo } from 'graphql'
import {
  parseResolveInfo,
  ResolveTree,
  simplifyParsedResolveInfoFragmentWithType,
} from 'graphql-parse-resolve-info'
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm'

/**
 * Extracts the requested fields from GraphQL
 * @param info GraphQLResolveInfo
 */
export function extractGraphQLFields(info: GraphQLResolveInfo): object {
  const parsedInfo = parseResolveInfo(info)
  if (!parsedInfo) {
    throw new Error('Could not parse resolve info')
  }

  return simplifyParsedResolveInfoFragmentWithType(parsedInfo as ResolveTree, info.returnType)
    .fields
}

/**
 * Extracts the requested fields from GraphQL and applies them to a TypeORM query.
 * @param info GraphQLResolveInfo
 * @param queryBuilder TypeORM QueryBuilder
 * @param alias the table alias for select
 */
export function extractGraphQLFieldsForSelect<T extends ObjectLiteral>(
  info: GraphQLResolveInfo,
  queryBuilder: SelectQueryBuilder<T>,
  alias: string,
) {
  const requestedFields = Object.keys(extractGraphQLFields(info))

  if (requestedFields.length > 0) {
    // Filter out fields that don't exist in the entity type T
    const entityName = queryBuilder.alias.charAt(0).toUpperCase() + queryBuilder.alias.slice(1)
    const metadata = queryBuilder.connection.getMetadata(entityName)
    const validFields = requestedFields.filter(
      (field) => metadata.findColumnWithPropertyName(field) !== undefined,
    )

    if (requestedFields.length > 0) {
      queryBuilder.select(validFields.map((field) => `${alias}.${field}`))
    }
  }
}
