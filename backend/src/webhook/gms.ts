/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { User as DbUser } from '@entity/User'

import { decode } from '@/auth/JWT'
// import { backendLogger as logger } from '@/server/logger'

export const gmsWebhook = async (req: any, res: any): Promise<void> => {
  console.log('GMS Hook received', req)
  const { token } = req.query

  if (!token) {
    console.log('gmsWebhook: missing token')
    res.status(400).json({ message: 'false' })
    return
  }
  console.log('gmsWebhook: found token=', token)
  const payload = await decode(token)
  console.log('gmsWebhook: decoded token=', payload)
  if (!payload) {
    console.log('gmsWebhook: invalid token')
    res.status(400).json({ message: 'false' })
    return
  }
  const user = await DbUser.findOne({ where: { gradidoID: payload.gradidoID } })
  if (!user) {
    console.log('gmsWebhook: missing user')
    res.status(400).json({ message: 'false' })
    return
  }
  console.log('gmsWebhook: authenticate user=', user)
  console.log('gmsWebhook: authentication successful')
  res.status(200).json({ userUuid: user.gradidoID })
}
