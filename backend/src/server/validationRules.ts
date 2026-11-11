// AI-GENERATED — not an architecture reference
import {
  type ASTVisitor,
  GraphQLError,
  Kind,
  type SelectionSetNode,
  type ValidationContext,
} from 'graphql'

// The front ends send at most three (the admin's start page). Above the largest RequestBudget
// cap (10), so each budget still refuses its own field with its own answer.
export const ROOT_FIELDS_MAX_PER_OPERATION = 20

const rootTypeNames = (context: ValidationContext): string[] => {
  const schema = context.getSchema()
  return [schema.getQueryType(), schema.getMutationType()].flatMap((type) =>
    type ? [type.name] : [],
  )
}

/**
 * An alias below the root asks once more for a value its resolver has already made: the
 * resolver runs once, the answer carries the value once per alias, and RequestBudget, which
 * counts resolver calls, sees none of it -- `keptPictures { a1: picture a2: picture … }`.
 * At the root every alias is a resolver call of its own, counted there and capped below.
 */
export const noNestedAliasesRule = (context: ValidationContext): ASTVisitor => {
  const roots = rootTypeNames(context)
  return {
    Field(node) {
      const parent = context.getParentType()
      if (node.alias && parent && !roots.includes(parent.name)) {
        context.reportError(
          new GraphQLError(`Alias "${node.alias.value}" is allowed on root fields only.`, {
            nodes: node,
          }),
        )
      }
    },
  }
}

// Fields of one level, through its inline fragments; spreads are counted by the caller.
const fieldsOf = (selectionSet: SelectionSetNode): number =>
  selectionSet.selections.reduce(
    (count, selection) =>
      count +
      (selection.kind === Kind.FIELD
        ? 1
        : selection.kind === Kind.INLINE_FRAGMENT
          ? fieldsOf(selection.selectionSet)
          : 0),
    0,
  )

/**
 * Each root field is a resolver call, most of them reach the database, and aliases let one
 * operation repeat them as often as the body has room for. A fragment on a root type adds
 * its fields once however often it is spread: spread twice, it asks for the same keys.
 */
export const rootFieldsCapRule = (context: ValidationContext): ASTVisitor => {
  const roots = rootTypeNames(context)
  return {
    OperationDefinition(node) {
      const rootFields = context
        .getRecursivelyReferencedFragments(node)
        .filter((fragment) => roots.includes(fragment.typeCondition.name.value))
        .reduce(
          (count, fragment) => count + fieldsOf(fragment.selectionSet),
          fieldsOf(node.selectionSet),
        )
      if (rootFields > ROOT_FIELDS_MAX_PER_OPERATION) {
        context.reportError(
          new GraphQLError(
            `${rootFields} root fields, at most ${ROOT_FIELDS_MAX_PER_OPERATION} are allowed.`,
            { nodes: node },
          ),
        )
      }
    },
  }
}

export const validationRules = [noNestedAliasesRule, rootFieldsCapRule]
