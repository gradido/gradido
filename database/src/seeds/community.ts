import { Community } from '../entity'
import { randomBytes } from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'

export async function createCommunity(foreign: boolean, save: boolean = true): Promise<Community> {
    const community = new Community()    
    community.publicKey = randomBytes(32)
    community.communityUuid = uuidv4()
    community.name = 'HomeCommunity-name'
    community.creationDate = new Date()

    if(foreign) {
        community.foreign = true
        community.name = 'ForeignCommunity-name'
        community.description = 'ForeignCommunity-description'
        community.url = `http://foreign-${Math.random()}/api`
    } else {
        community.foreign = false
        community.privateKey = randomBytes(64)
        community.name = 'HomeCommunity-name'
        community.description = 'HomeCommunity-description'
        community.url = 'http://localhost/api'
    }
    return save ? await community.save() : community
}

export async function createAuthenticatedForeignCommunity(
    authenticatedBeforeMs: number,
    save: boolean = true
): Promise<Community> {
    const foreignCom = await createCommunity(true, false)
    foreignCom.authenticatedAt = new Date(Date.now() - authenticatedBeforeMs)
    return save ? await foreignCom.save() : foreignCom
}