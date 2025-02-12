import { SupportedChainIds } from '@shapeshiftoss/types'
import { AxiosResponse } from 'axios'
import * as rax from 'retry-axios'

import { BuildTradeInput, SwapError, Trade } from '../../..'
import { ZrxQuoteResponse } from '../types'
import { erc20AllowanceAbi } from '../utils/abi/erc20Allowance-abi'
import { applyAxiosRetry } from '../utils/applyAxiosRetry'
import { bnOrZero } from '../utils/bignumber'
import {
  AFFILIATE_ADDRESS,
  APPROVAL_GAS_LIMIT,
  DEFAULT_SLIPPAGE,
  DEFAULT_SOURCE,
  MAX_SLIPPAGE
} from '../utils/constants'
import { getAllowanceRequired, normalizeAmount } from '../utils/helpers/helpers'
import { zrxService } from '../utils/zrxService'
import { ZrxSwapperDeps } from '../ZrxSwapper'

export async function zrxBuildTrade(
  { adapterManager, web3 }: ZrxSwapperDeps,
  input: BuildTradeInput
): Promise<Trade<SupportedChainIds>> {
  const {
    sellAsset,
    buyAsset,
    sellAmount,
    slippage,
    sellAssetAccountId,
    buyAssetAccountId,
    wallet
  } = input

  if (!sellAssetAccountId || !buyAssetAccountId) {
    throw new SwapError(
      'ZrxSwapper:ZrxBuildTrade Both sellAssetAccountId and buyAssetAccountId are required'
    )
  }

  const buyToken = buyAsset.tokenId || buyAsset.symbol || buyAsset.network
  const sellToken = sellAsset.tokenId || sellAsset.symbol || sellAsset.network
  if (!buyToken) {
    throw new SwapError(
      'ZrxSwapper:ZrxBuildTrade One of buyAssetContract or buyAssetSymbol or buyAssetNetwork are required'
    )
  }
  if (!sellToken) {
    throw new SwapError(
      'ZrxSwapper:ZrxBuildTrade One of sellAssetContract or sellAssetSymbol or sellAssetNetwork are required'
    )
  }

  if (buyAsset.chainId !== 'eip155:1') {
    throw new SwapError('ZrxSwapper:ZrxBuildTrade buyAsset must be on chainId eip155:1')
  }

  const adapter = adapterManager.byChain(buyAsset.chain)
  const bip44Params = adapter.buildBIP44Params({ accountNumber: Number(buyAssetAccountId) })
  const receiveAddress = await adapter.getAddress({ wallet, bip44Params })

  if (bnOrZero(slippage).gt(MAX_SLIPPAGE)) {
    throw new SwapError(
      `ZrxSwapper:ZrxBuildTrade slippage value of ${slippage} is greater than max slippage value of ${MAX_SLIPPAGE}`
    )
  }

  const slippagePercentage = slippage ? bnOrZero(slippage).div(100).toString() : DEFAULT_SLIPPAGE

  try {
    /**
     * /swap/v1/quote
     * params: {
     *   sellToken: contract address (or symbol) of token to sell
     *   buyToken: contractAddress (or symbol) of token to buy
     *   sellAmount?: integer string value of the smallest increment of the sell token
     * }
     */

    const zrxRetry = applyAxiosRetry(zrxService, {
      statusCodesToRetry: [[400, 400]],
      shouldRetry: (err) => {
        const cfg = rax.getConfig(err)
        const retryAttempt = cfg?.currentRetryAttempt ?? 0
        const retry = cfg?.retry ?? 3
        // ensure max retries is always respected
        if (retryAttempt >= retry) return false
        // retry if 0x returns error code 111 Gas estimation failed
        if (err?.response?.data?.code === 111) return true

        // Handle the request based on your other config options, e.g. `statusCodesToRetry`
        return rax.shouldRetryRequest(err)
      }
    })
    const quoteResponse: AxiosResponse<ZrxQuoteResponse> = await zrxRetry.get<ZrxQuoteResponse>(
      '/swap/v1/quote',
      {
        params: {
          buyToken,
          sellToken,
          sellAmount: normalizeAmount(sellAmount?.toString()),
          takerAddress: receiveAddress,
          slippagePercentage,
          skipValidation: false,
          affiliateAddress: AFFILIATE_ADDRESS
        }
      }
    )

    const { data } = quoteResponse

    const estimatedGas = bnOrZero(data.gas || 0)

    const trade: Trade<'eip155:1'> = {
      sellAsset,
      buyAsset,
      success: true,
      statusReason: '',
      sellAssetAccountId,
      receiveAddress,
      rate: data.price,
      depositAddress: data.to,
      feeData: {
        fee: bnOrZero(estimatedGas).multipliedBy(bnOrZero(data.gasPrice)).toString(),
        chainSpecific: {
          estimatedGas: estimatedGas.toString(),
          gasPrice: data.gasPrice
        }
      },
      txData: data.data,
      sellAmount: data.sellAmount,
      buyAmount: data.buyAmount,
      allowanceContract: data.allowanceTarget,
      sources: data.sources?.filter((s) => parseFloat(s.proportion) > 0) || DEFAULT_SOURCE
    }

    const allowanceRequired = await getAllowanceRequired({
      sellAsset,
      allowanceContract: data.allowanceTarget,
      receiveAddress,
      sellAmount: data.sellAmount,
      web3,
      erc20AllowanceAbi
    })

    if (allowanceRequired) {
      trade.feeData = {
        fee: trade.feeData?.fee || '0',
        chainSpecific: {
          ...trade.feeData?.chainSpecific,
          approvalFee: bnOrZero(APPROVAL_GAS_LIMIT).multipliedBy(bnOrZero(data.gasPrice)).toString()
        }
      }
    }
    return trade
  } catch (e) {
    // eslint-disable-next-line no-console
    const statusReason =
      e?.response?.data?.validationErrors?.[0]?.reason ||
      e?.response?.data?.reason ||
      'Unknown Error'
    // This hackyness will go away when we correctly handle errors
    return {
      sellAsset,
      buyAsset,
      success: false,
      statusReason,
      sellAmount: '0',
      buyAmount: '0',
      depositAddress: '',
      allowanceContract: '',
      receiveAddress: '',
      sellAssetAccountId,
      txData: '',
      rate: '0',
      feeData: { fee: '0', chainSpecific: {} },
      sources: []
    }
  }
}
