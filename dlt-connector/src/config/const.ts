import path from 'node:path'

export const LOG4JS_BASE_CATEGORY = 'dlt'
// 7 days
export const MIN_TOPIC_EXPIRE_MILLISECONDS_FOR_UPDATE = 1000 * 60 * 60 * 24 * 7
// 10 minutes
export const MIN_TOPIC_EXPIRE_MILLISECONDS_FOR_SEND_MESSAGE = 1000 * 60 * 10

export const GRADIDO_NODE_RUNTIME_PATH = path.join(
  __dirname,
  '..',
  '..',
  'gradido_node',
  'bin',
  'GradidoNode',
)
// if last start was less than this time, do not restart
export const GRADIDO_NODE_MIN_RUNTIME_BEFORE_RESTART_MILLISECONDS = 1000 * 30
export const GRADIDO_NODE_MIN_RUNTIME_BEFORE_EXIT_MILLISECONDS = 1000 * 2
export const GRADIDO_NODE_KILL_TIMEOUT_MILLISECONDS = 10000
// currently hard coded in gradido node, update in future
export const GRADIDO_NODE_HOME_FOLDER_NAME = '.gradido'
