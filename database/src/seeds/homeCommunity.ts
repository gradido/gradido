import { Community } from '../entity'
import { randomBytes } from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'

export async function createCommunity(foreign: boolean): Promise<Community> {
    const homeCom = new Community()    
    homeCom.publicKey = randomBytes(32)
    homeCom.communityUuid = uuidv4()
    homeCom.authenticatedAt = new Date()
    homeCom.name = 'HomeCommunity-name'
    homeCom.creationDate = new Date()

    if(foreign) {
        homeCom.foreign = true
        homeCom.name = 'ForeignCommunity-name'
        homeCom.description = 'ForeignCommunity-description'
        homeCom.url = 'http://foreign/api'
    } else {
        homeCom.foreign = false
        homeCom.privateKey = randomBytes(64)
        homeCom.name = 'HomeCommunity-name'
        homeCom.description = 'HomeCommunity-description'
        homeCom.url = 'http://localhost/api'
    }
    return await homeCom.save()
}
