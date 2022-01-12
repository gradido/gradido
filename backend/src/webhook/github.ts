// eslint-disable-next-line camelcase
import { spawn } from 'child_process'
import path from 'path'
import CONFIG from '../config'

export const githubWebhook = async (req: any, res: any): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log('Hook received')
  // End call as early as possible
  res.status(200).end()
  // eslint-disable-next-line no-console
  console.log('Call ended')

  // Handle push events
  if (req.headers['x-github-event'] === 'push') {
    const payload = req.body
    // eslint-disable-next-line no-console
    console.log(payload)

    if (payload.ref === `refs/heads/${CONFIG.WEBHOOK_GITHUB_BRANCH}`) {
      // spawn shell and detach process to allow killing of parent process in the update script
      const child = spawn(
        path.join(__dirname, '../../../deployment/bare_metal/start.sh'),
        [CONFIG.WEBHOOK_GITHUB_BRANCH],
        {
          detached: true,
          stdio: ['ignore', 'ignore', 'ignore'],
        },
      )
      child.unref()
    }
  }
}
