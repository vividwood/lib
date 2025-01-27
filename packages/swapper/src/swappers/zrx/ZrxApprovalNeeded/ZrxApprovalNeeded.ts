import { ApprovalNeededOutput, SupportedChainIds } from '@shapeshiftoss/types'

import { ApprovalNeededInput, SwapError } from '../../../api'
import { erc20AllowanceAbi } from '../utils/abi/erc20Allowance-abi'
import { bnOrZero } from '../utils/bignumber'
import { APPROVAL_GAS_LIMIT } from '../utils/constants'
import { getERC20Allowance } from '../utils/helpers/helpers'
import { ZrxSwapperDeps } from '../ZrxSwapper'

export async function ZrxApprovalNeeded(
  { adapterManager, web3 }: ZrxSwapperDeps,
  { quote, wallet }: ApprovalNeededInput<SupportedChainIds>
): Promise<ApprovalNeededOutput> {
  const { sellAsset } = quote

  if (sellAsset.chainId !== 'eip155:1') {
    throw new SwapError('ZrxSwapper:ZrxApprovalNeeded only Ethereum chain type is supported')
  }

  if (sellAsset.symbol === 'ETH') {
    return { approvalNeeded: false }
  }

  const accountNumber = quote.sellAssetAccountId ? Number(quote.sellAssetAccountId) : 0

  const adapter = await adapterManager.byChainId(sellAsset.chainId)
  const bip44Params = adapter.buildBIP44Params({ accountNumber })
  const receiveAddress = await adapter.getAddress({ wallet, bip44Params })

  if (!quote.sellAsset.tokenId || !quote.allowanceContract) {
    throw new SwapError('ZrxApprovalNeeded - tokenId and allowanceTarget are required')
  }

  const allowanceResult = await getERC20Allowance({
    web3,
    erc20AllowanceAbi,
    tokenId: quote.sellAsset.tokenId,
    spenderAddress: quote.allowanceContract,
    ownerAddress: receiveAddress
  })
  const allowanceOnChain = bnOrZero(allowanceResult)

  return {
    approvalNeeded: allowanceOnChain.lte(bnOrZero(quote.sellAmount)),
    gas: APPROVAL_GAS_LIMIT,
    gasPrice: quote?.feeData?.chainSpecific?.gasPrice
  }
}
