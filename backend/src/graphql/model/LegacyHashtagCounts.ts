import { Field, Int, ObjectType } from 'type-graphql'

// LEGACY-HASHTAG-ADOPTION -- a changeover aid, meant to be removed again.
// Group functions: what adopting the legacy hashtags would find for one group, right now.
//
// The two spellings are counted apart because they are not the same kind of thing. "#tag"
// always displayed as the group. "# tag" never did -- neither the display rule nor the old
// SQL rule matched it -- so taking it is a decision the administrator makes with the number
// in front of them, not a repair.
@ObjectType()
export class LegacyHashtagCounts {
  constructor(exact: number, loose: number) {
    this.exact = exact
    this.loose = loose
  }

  // Memos naming the group the way it always worked: "#Amstetten".
  @Field(() => Int)
  exact: number

  // Memos with blanks after the '#': "# Amstetten". Never displayed as a group.
  @Field(() => Int)
  loose: number
}
