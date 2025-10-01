import { TransactionLink as DbTransactionLink, User as DbUser } from "database";

export async function storeLinkAsRedeemed(
    dbTransactionLink: DbTransactionLink,
    foreignUser: DbUser,
    creationDate: Date,
): Promise<boolean> {
    try {
        dbTransactionLink.redeemedBy = foreignUser.id
        dbTransactionLink.redeemedAt = creationDate
        await DbTransactionLink.save(dbTransactionLink)
        return true
    } catch (err) {
        console.error('error in storeLinkAsRedeemed;', err)
        return false
    }
}