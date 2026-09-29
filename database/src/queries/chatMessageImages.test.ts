// AI-GENERATED — not an architecture reference
import { eq, inArray } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { DBDuplicateEntryError } from '../errorTypes'
import {
  ChatMessageImageInsert,
  chatConversationMembersTable,
  chatMessageImagesTable,
  chatMessagesTable,
} from '../schemas'
import { ChatMemberRef, dbInsertChatConversationMembers } from './chatConversationMembers'
import {
  dbDeleteChatMessageImagesByMessageUuid,
  dbInsertChatMessageImage,
  dbSelectChatMessageImageForMember,
  dbSelectChatMessageImageInfos,
} from './chatMessageImages'
import { dbInsertChatMessage } from './chatMessages'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// No foreign keys: a conversation id and the pairs of its members are all the rows need.
const CONVERSATION = 9101
const OTHER_CONVERSATION = 9102
const HOME = '11111111-1111-4111-8111-111111111111'
const ANNA: ChatMemberRef = {
  communityUuid: HOME,
  gradidoId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
}
const BEN: ChatMemberRef = {
  communityUuid: HOME,
  gradidoId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
}
const CARL: ChatMemberRef = {
  communityUuid: HOME,
  gradidoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
}

// Messages of Anna and Ben, one of Anna and Carl, and one that is never filed.
const WITH_PICTURES = '30000000-0000-4000-8000-000000000001'
const WITHOUT_PICTURE = '30000000-0000-4000-8000-000000000002'
const TO_BE_DELETED = '30000000-0000-4000-8000-000000000003'
const WITH_CARL = '30000000-0000-4000-8000-000000000004'
const NEVER_FILED = '30000000-0000-4000-8000-000000000005'
const MESSAGES = [WITH_PICTURES, WITHOUT_PICTURE, TO_BE_DELETED, WITH_CARL]

const FIRST_PICTURE = '40000000-0000-4000-8000-000000000001'
const SECOND_PICTURE = '40000000-0000-4000-8000-000000000002'
const DELETED_PICTURE = '40000000-0000-4000-8000-000000000003'
const CARLS_PICTURE = '40000000-0000-4000-8000-000000000004'
const ORPHAN_PICTURE = '40000000-0000-4000-8000-000000000005'

// Two pictures that differ, so a query that hands back the wrong one cannot pass.
const JPEG_A = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9])
const JPEG_B = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10, 0x45, 0x78, 0x69, 0xff, 0xd9])

const picture = (
  imageUuid: string,
  messageUuid: string,
  rest: Partial<ChatMessageImageInsert> = {},
): ChatMessageImageInsert => ({
  imageUuid,
  messageUuid,
  position: 0,
  width: 800,
  height: 600,
  image: JPEG_A,
  mimeType: 'image/jpeg',
  ...rest,
})

const fileMessage = async (messageUuid: string, conversationId: number): Promise<void> => {
  const filed = await dbInsertChatMessage({
    messageUuid,
    conversationId,
    senderCommunityUuid: HOME,
    senderGradidoId: ANNA.gradidoId,
    subject: null,
    body: 'Look at this',
    notify: 'email',
    deliveryState: 'delivered',
  })
  if (!filed.success) {
    throw new Error(`could not file the message ${messageUuid}`)
  }
}

/** The bytes a member gets for a picture, or null. */
const pictureFor = async (imageUuid: string, member: ChatMemberRef): Promise<Buffer | null> => {
  const found = await dbSelectChatMessageImageForMember(imageUuid, member)
  return found.success ? found.value : null
}

const cleanUp = async (): Promise<void> => {
  await db.delete(chatMessageImagesTable)
  await db.delete(chatMessagesTable).where(inArray(chatMessagesTable.messageUuid, MESSAGES))
  await db
    .delete(chatConversationMembersTable)
    .where(inArray(chatConversationMembersTable.conversationId, [CONVERSATION, OTHER_CONVERSATION]))
}

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await cleanUp()
  await dbInsertChatConversationMembers(CONVERSATION, [ANNA, BEN])
  await dbInsertChatConversationMembers(OTHER_CONVERSATION, [ANNA, CARL])
  await fileMessage(WITH_PICTURES, CONVERSATION)
  await fileMessage(WITHOUT_PICTURE, CONVERSATION)
  await fileMessage(TO_BE_DELETED, CONVERSATION)
  await fileMessage(WITH_CARL, OTHER_CONVERSATION)
})
afterAll(async () => {
  await cleanUp()
  await appDB.destroy()
})

describe('chatMessageImages query test', () => {
  it('files a picture of a message', async () => {
    expect(await dbInsertChatMessageImage(picture(FIRST_PICTURE, WITH_PICTURES))).toEqual({
      success: true,
    })

    const [row] = await db
      .select()
      .from(chatMessageImagesTable)
      .where(eq(chatMessageImagesTable.imageUuid, FIRST_PICTURE))
    expect(row).toMatchObject({
      imageUuid: FIRST_PICTURE,
      messageUuid: WITH_PICTURES,
      position: 0,
      width: 800,
      height: 600,
      mimeType: 'image/jpeg',
    })
    expect(row.image.equals(JPEG_A)).toBe(true)
    expect(row.createdAt).toBeInstanceOf(Date)
  })

  // Ready for several pictures in one message: the next place is free.
  it('files a second picture of the same message at the next place', async () => {
    const second = picture(SECOND_PICTURE, WITH_PICTURES, {
      position: 1,
      width: 393,
      height: 1220,
      image: JPEG_B,
    })
    expect(await dbInsertChatMessageImage(second)).toEqual({ success: true })
  })

  it('refuses a taken uuid, and a taken place in a message, and files neither', async () => {
    const takenUuid = await dbInsertChatMessageImage(picture(FIRST_PICTURE, WITHOUT_PICTURE))
    const takenPlace = await dbInsertChatMessageImage(
      picture('40000000-0000-4000-8000-000000000009', WITH_PICTURES),
    )

    for (const refused of [takenUuid, takenPlace]) {
      expect(refused.success).toBe(false)
      expect(!refused.success && refused.error).toBeInstanceOf(DBDuplicateEntryError)
    }
    expect(await db.select().from(chatMessageImagesTable)).toHaveLength(2)
  })

  it('says what is known about the pictures of several messages at once -- never the pictures', async () => {
    await dbInsertChatMessageImage(picture(CARLS_PICTURE, WITH_CARL, { image: JPEG_B }))

    const infos = await dbSelectChatMessageImageInfos([WITH_PICTURES, WITHOUT_PICTURE, WITH_CARL])

    expect(infos).toEqual([
      {
        imageUuid: FIRST_PICTURE,
        messageUuid: WITH_PICTURES,
        position: 0,
        width: 800,
        height: 600,
      },
      {
        imageUuid: SECOND_PICTURE,
        messageUuid: WITH_PICTURES,
        position: 1,
        width: 393,
        height: 1220,
      },
      { imageUuid: CARLS_PICTURE, messageUuid: WITH_CARL, position: 0, width: 800, height: 600 },
    ])
    for (const info of infos) {
      expect(Object.keys(info)).not.toContain('image')
    }
  })

  it('says nothing about no messages, and nothing about a message without a picture', async () => {
    expect(await dbSelectChatMessageImageInfos([])).toEqual([])
    expect(await dbSelectChatMessageImageInfos([WITHOUT_PICTURE])).toEqual([])
  })

  it('hands a picture to the members of its conversation', async () => {
    expect((await pictureFor(FIRST_PICTURE, ANNA))?.equals(JPEG_A)).toBe(true)
    expect((await pictureFor(SECOND_PICTURE, BEN))?.equals(JPEG_B)).toBe(true)
    expect((await pictureFor(CARLS_PICTURE, CARL))?.equals(JPEG_B)).toBe(true)
  })

  // Carl is in a conversation with Anna -- another one. Ben is in none with Carl.
  it('hands nothing to a member of another conversation', async () => {
    expect(await pictureFor(FIRST_PICTURE, CARL)).toBeNull()
    expect(await pictureFor(CARLS_PICTURE, BEN)).toBeNull()
  })

  it('hands nothing for a uuid no picture has', async () => {
    const found = await dbSelectChatMessageImageForMember(
      '40000000-0000-4000-8000-00000000000f',
      ANNA,
    )
    expect(found.success).toBe(false)
  })

  // A picture is written before its message; one whose message was never filed is nobody's.
  it('hands nothing for a picture whose message was never filed', async () => {
    await dbInsertChatMessageImage(picture(ORPHAN_PICTURE, NEVER_FILED))

    expect(await pictureFor(ORPHAN_PICTURE, ANNA)).toBeNull()
  })

  it('hands nothing once the message is marked deleted', async () => {
    await dbInsertChatMessageImage(picture(DELETED_PICTURE, TO_BE_DELETED))
    // The picture itself proves the fixture: before the mark, Anna gets it.
    expect(await pictureFor(DELETED_PICTURE, ANNA)).not.toBeNull()

    await db
      .update(chatMessagesTable)
      .set({ deletedAt: new Date() })
      .where(eq(chatMessagesTable.messageUuid, TO_BE_DELETED))

    expect(await pictureFor(DELETED_PICTURE, ANNA)).toBeNull()
    expect(await pictureFor(DELETED_PICTURE, BEN)).toBeNull()
  })

  it('removes the pictures of a message, and no other', async () => {
    expect(await dbDeleteChatMessageImagesByMessageUuid(WITH_PICTURES)).toBe(2)

    expect(await dbSelectChatMessageImageInfos([WITH_PICTURES])).toEqual([])
    expect(await pictureFor(FIRST_PICTURE, ANNA)).toBeNull()
    expect(await dbSelectChatMessageImageInfos([WITH_CARL])).toHaveLength(1)
  })

  it('removes nothing where there is nothing, and says so', async () => {
    expect(await dbDeleteChatMessageImagesByMessageUuid(WITH_PICTURES)).toBe(0)
  })
})
