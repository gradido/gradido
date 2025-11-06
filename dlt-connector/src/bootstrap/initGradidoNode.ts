import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import AdmZip from 'adm-zip'
import { getLogger } from 'log4js'
import { exportCommunities } from '../client/GradidoNode/communities'
import { GradidoNodeProcess } from '../client/GradidoNode/GradidoNodeProcess'
import { HieroClient } from '../client/hiero/HieroClient'
import { CONFIG } from '../config'
import {
  GRADIDO_NODE_HOME_FOLDER_NAME,
  GRADIDO_NODE_RUNTIME_PATH,
  LOG4JS_BASE_CATEGORY,
} from '../config/const'
import { checkFileExist, checkPathExist } from '../utils/filesystem'
import { isPortOpen } from '../utils/network'
import { AppContextClients } from './appContext'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.bootstrap.initGradidoNode`)

export async function initGradidoNode(clients: AppContextClients): Promise<void> {
  const url = `http://localhost:${CONFIG.DLT_NODE_SERVER_PORT}`
  const isOpen = await isPortOpen(url)
  if (isOpen) {
    logger.info(`GradidoNode is already running on ${url}`)
    return
  }

  const gradidoNodeHomeFolder = path.join(
    CONFIG.DLT_GRADIDO_NODE_SERVER_HOME_FOLDER,
    GRADIDO_NODE_HOME_FOLDER_NAME,
  )
  // check folder, create when missing
  checkPathExist(gradidoNodeHomeFolder, true)

  await Promise.all([
    // write Hedera Address Book
    exportHederaAddressbooks(gradidoNodeHomeFolder, clients.hiero),
    // check GradidoNode Runtime, download when missing
    ensureGradidoNodeRuntimeAvailable(GRADIDO_NODE_RUNTIME_PATH),
    // export communities to GradidoNode Folder
    exportCommunities(gradidoNodeHomeFolder, clients.backend),
  ])
  GradidoNodeProcess.getInstance().start()
}

async function exportHederaAddressbooks(
  homeFolder: string,
  hieroClient: HieroClient,
): Promise<void> {
  const networkName = CONFIG.HIERO_HEDERA_NETWORK
  const addressBook = await hieroClient.downloadAddressBook()
  const addressBookPath = path.join(homeFolder, 'addressbook', `${networkName}.pb`)
  checkPathExist(path.dirname(addressBookPath), true)
  fs.writeFileSync(addressBookPath, addressBook.toBytes())
}

async function ensureGradidoNodeRuntimeAvailable(runtimeFileName: string): Promise<void> {
  const runtimeFolder = path.dirname(runtimeFileName)
  checkPathExist(runtimeFolder, true)
  if (!checkFileExist(runtimeFileName)) {
    const runtimeArchiveFilename = createGradidoNodeRuntimeArchiveFilename()
    const downloadUrl = new URL(
      `https://github.com/gradido/gradido_node/releases/download/v${CONFIG.DLT_GRADIDO_NODE_SERVER_VERSION}/${runtimeArchiveFilename}`,
    )
    logger.debug(`download GradidoNode Runtime from ${downloadUrl}`)
    const archive = await fetch(downloadUrl)
    if (!archive.ok) {
      throw new Error(`Failed to download GradidoNode Runtime: ${archive.statusText}`)
    }
    const compressedBuffer = await archive.arrayBuffer()
    if (process.platform === 'win32') {
      const zip = new AdmZip(Buffer.from(compressedBuffer))
      zip.extractAllTo(runtimeFolder, true)
    } else {
      const archivePath = path.join(runtimeFolder, runtimeArchiveFilename)
      logger.debug(`GradidoNode Runtime Archive: ${archivePath}`)
      fs.writeFileSync(archivePath, Buffer.from(compressedBuffer))
      execSync(`tar -xzf ${archivePath}`, { cwd: runtimeFolder })
    }
  }
}

function createGradidoNodeRuntimeArchiveFilename(): string {
  const version = CONFIG.DLT_GRADIDO_NODE_SERVER_VERSION
  const platform: string = process.platform
  const fileEnding = platform === 'win32' ? 'zip' : 'tar.gz'
  return `gradido_node-v${version}-${platform}-${process.arch}.${fileEnding}`
}
