import fs from 'node:fs'
import path from 'node:path'
import {
  ConfirmedTransaction,
  Filter,
  InteractionSerialize,
  Profiler,
  SearchDirection_ASC,
} from 'gradido-blockchain-js'
import { CONFIG } from '../../config'
import { Context } from './Context'
import { bytesString, calculateOneHashStep } from './utils'
import { CommunityContext } from './valibot.schema'

export function exportAllCommunities(context: Context, batchSize: number) {
  const timeUsed = new Profiler()
  for (const communityContext of context.communities.values()) {
    context.logger.info(`exporting community ${communityContext.communityId} to binary file`)
    exportCommunity(communityContext, context, batchSize)
  }
  context.logger.info(`time used for exporting communities to binary file: ${timeUsed.string()}`)
}

export function exportCommunity(
  communityContext: CommunityContext,
  context: Context,
  batchSize: number,
) {
  const timeUsed = new Profiler()
  const timeSinceLastPrint = new Profiler()
  // write as binary file for GradidoNode
  const f = new Filter()
  f.pagination.size = batchSize
  f.pagination.page = 1
  f.searchDirection = SearchDirection_ASC
  const binFilePath = prepareFolder(communityContext)
  let count = 0
  let printCount = 0

  let lastTransactionCount = 0
  let triggeredTransactionsCount = 0
  let hash = Buffer.alloc(32, 0)
  const isDebug = context.logger.isDebugEnabled()
  const printConsole = () => {
    if (triggeredTransactionsCount > 0) {
      process.stdout.write(`exported ${count} transactions + ${triggeredTransactionsCount} triggered from timeouted transaction links\r`)
    } else {
      process.stdout.write(`exported ${count} transactions\r`)
    }
  }
  do {
    const transactions = communityContext.blockchain.findAll(f)
    lastTransactionCount = transactions.size()

    for (let i = 0; i < lastTransactionCount; i++) {
      const confirmedTransaction = transactions.get(i)?.getConfirmedTransaction()
      const transactionNr = (f.pagination.page - 2) * batchSize + i
      if (!confirmedTransaction) {
        throw new Error(`invalid TransactionEntry at index: ${transactionNr} `)
      }
      hash = exportTransaction(confirmedTransaction, hash, binFilePath)
      if (confirmedTransaction?.getGradidoTransaction()?.getTransactionBody()?.isTimeoutDeferredTransfer()) {
        triggeredTransactionsCount++
      } else {
        count++
      }
      if (isDebug) {
        if (timeSinceLastPrint.millis() > 100) {
          printConsole()
          timeSinceLastPrint.reset()
        }
      } else {
        printCount++
        if (printCount >= 100) {
          printConsole()
          printCount = 0
        }
      }
    }
    f.pagination.page++    
  } while (lastTransactionCount === batchSize)
  printConsole()
  process.stdout.write(`\n`)

  fs.appendFileSync(binFilePath, hash!)
  context.logger.info(
    `binary file for community ${communityContext.communityId} written to ${binFilePath}`,
  )
  const sumTransactionsCount = ((f.pagination.page - 2) * batchSize) + lastTransactionCount
  const fileSize = fs.statSync(binFilePath).size
  context.logger.info(
    `exported ${sumTransactionsCount} transactions (${bytesString(fileSize)}) in ${timeUsed.string()}`,
  )
}

function exportTransaction(
  confirmedTransaction: ConfirmedTransaction,
  hash: Buffer<ArrayBuffer>,
  binFilePath: string,
): Buffer<ArrayBuffer> {
  const sizeBuffer = Buffer.alloc(2)
  const interactionSerialize = new InteractionSerialize(confirmedTransaction)
  const binBlock = interactionSerialize.run()
  if (!binBlock) {
    throw new Error(
      `invalid TransactionEntry at index: ${confirmedTransaction.getId()}, serialize into protobuf format failed`,
    )
  }

  hash = calculateOneHashStep(hash, binBlock.data())
  sizeBuffer.writeUInt16LE(binBlock.size(), 0)
  fs.appendFileSync(binFilePath, sizeBuffer)
  fs.appendFileSync(binFilePath, binBlock.data())
  return hash
}

function prepareFolder(communityContext: CommunityContext): string {
  const binFileFolder = path.join(
    CONFIG.DLT_GRADIDO_NODE_SERVER_HOME_FOLDER,
    '.gradido',
    communityContext.folder,
  )
  const binFilePath = path.join(binFileFolder, 'blk00000001.dat')
  // make sure we work with a clean folder, rm beforehand with all content
  fs.rmSync(binFileFolder, { force: true, recursive: true })
  fs.mkdirSync(binFileFolder, { recursive: true })
  return binFilePath
}
