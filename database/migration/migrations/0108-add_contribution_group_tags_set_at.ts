// Group functions: tell "deliberately assigned" apart from "never assigned".
//
// Until now a contribution with no row in contribution_group_tags could mean two things:
// it predates the group field, or someone chose "no group" on purpose. Both looked
// identical, so the legacy inline-"#tag" fallback had to apply to either — which meant a
// hashtag written for other reasons ("#feuerwehr was great!") could pull a contribution
// into a group it does not belong to, and into that group moderator's visibility scope.
//
// group_tags_set_at records the moment the group was set through the group field — on
// submission and on every later change in the admin, including when it is set to "no
// group". Once it carries a timestamp, inline hashtags in the memo are irrelevant for that
// contribution: free hashtags become free again.
//
// NULL keeps the old reading, so the existing stock is untouched: no structured link and
// no timestamp still resolves its inline "#tag" as before.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `contributions` ADD COLUMN `group_tags_set_at` datetime(3) NULL DEFAULT NULL;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `contributions` DROP COLUMN `group_tags_set_at`;')
}
