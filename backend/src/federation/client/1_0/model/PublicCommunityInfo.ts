export interface PublicCommunityInfo {
  name: string | null
  description: string | null
  creationDate: Date | null
  publicKey: string
  publicJwtKey: string | null
  hieroTopicId: string | null
}
