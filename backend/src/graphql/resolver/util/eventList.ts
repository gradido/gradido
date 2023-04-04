import { Event as DbEvent } from '@entity/Event'
import { User } from '@entity/User'
import { UserContact } from '@entity/UserContact'

export const lastDateTimeEvents = async (eventType: string): Promise<DbEvent[]> => {
  return DbEvent
    .createQueryBuilder('event')
    .select('MAX(event.created_at)', 'value')
    .leftJoin(User, 'user', 'affected_user_id = user.id')
    .leftJoin(UserContact, 'usercontact', 'user.id = usercontact.user_id')
    .addSelect('usercontact.email', 'email')
    .where('event.type = :eventType', { eventType })
    .andWhere('usercontact.email IS NOT NULL')
    .groupBy('event.affected_user_id')
    .getRawMany()
}