import { ChainTypes, NetworkTypes } from '@shapeshiftoss/types'

import { AssetNamespace, AssetReference, toAssetId } from '../../assetId/assetId'
import { assetIdToCoinCap, coincapToAssetId } from '.'

describe('adapters:coincap', () => {
  describe('coincapToAssetId', () => {
    it('can get AssetId for bitcoin', () => {
      const chain = ChainTypes.Bitcoin
      const network = NetworkTypes.MAINNET
      const assetId = toAssetId({
        chain,
        network,
        assetNamespace: AssetNamespace.Slip44,
        assetReference: AssetReference.Bitcoin
      })
      expect(coincapToAssetId('bitcoin')).toEqual(assetId)
    })

    it('can get AssetId id for ethereum', () => {
      const chain = ChainTypes.Ethereum
      const network = NetworkTypes.MAINNET
      const assetId = toAssetId({
        chain,
        network,
        assetNamespace: AssetNamespace.Slip44,
        assetReference: AssetReference.Ethereum
      })
      expect(coincapToAssetId('ethereum')).toEqual(assetId)
    })

    it('can get AssetId id for FOX', () => {
      const chain = ChainTypes.Ethereum
      const network = NetworkTypes.MAINNET
      const assetNamespace = AssetNamespace.ERC20
      const assetReference = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
      const assetId = toAssetId({ chain, network, assetNamespace, assetReference })
      expect(coincapToAssetId('fox-token')).toEqual(assetId)
    })
  })

  it('can get AssetId for cosmos', () => {
    const chain = ChainTypes.Cosmos
    const network = NetworkTypes.COSMOSHUB_MAINNET
    const assetId = toAssetId({
      chain,
      network,
      assetNamespace: AssetNamespace.Slip44,
      assetReference: AssetReference.Cosmos
    })
    expect(coincapToAssetId('cosmos')).toEqual(assetId)
  })

  it('can get AssetId for osmosis', () => {
    const chain = ChainTypes.Osmosis
    const network = NetworkTypes.OSMOSIS_MAINNET
    const assetId = toAssetId({
      chain,
      network,
      assetNamespace: AssetNamespace.Slip44,
      assetReference: AssetReference.Osmosis
    })
    expect(coincapToAssetId('osmosis')).toEqual(assetId)
  })

  describe('assetIdToCoinCap', () => {
    it('can get coincap id for bitcoin AssetId', () => {
      const chain = ChainTypes.Bitcoin
      const network = NetworkTypes.MAINNET
      const assetId = toAssetId({
        chain,
        network,
        assetNamespace: AssetNamespace.Slip44,
        assetReference: AssetReference.Bitcoin
      })
      expect(assetIdToCoinCap(assetId)).toEqual('bitcoin')
    })

    it('can get coincap id for ethereum AssetId', () => {
      const chain = ChainTypes.Ethereum
      const network = NetworkTypes.MAINNET
      const assetId = toAssetId({
        chain,
        network,
        assetNamespace: AssetNamespace.Slip44,
        assetReference: AssetReference.Ethereum
      })
      expect(assetIdToCoinCap(assetId)).toEqual('ethereum')
    })

    it('can get coincap id for FOX', () => {
      const chain = ChainTypes.Ethereum
      const network = NetworkTypes.MAINNET
      const assetNamespace = AssetNamespace.ERC20
      const assetReference = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
      const assetId = toAssetId({ chain, network, assetNamespace, assetReference })
      expect(assetIdToCoinCap(assetId)).toEqual('fox-token')
    })

    it('can get coincap id for cosmos AssetId', () => {
      const chain = ChainTypes.Cosmos
      const network = NetworkTypes.COSMOSHUB_MAINNET
      const assetId = toAssetId({
        chain,
        network,
        assetNamespace: AssetNamespace.Slip44,
        assetReference: AssetReference.Cosmos
      })
      expect(assetIdToCoinCap(assetId)).toEqual('cosmos')
    })

    it('can get coincap id for osmosis AssetId', () => {
      const chain = ChainTypes.Osmosis
      const network = NetworkTypes.OSMOSIS_MAINNET
      const assetId = toAssetId({
        chain,
        network,
        assetNamespace: AssetNamespace.Slip44,
        assetReference: AssetReference.Osmosis
      })
      expect(assetIdToCoinCap(assetId)).toEqual('osmosis')
    })
  })
})
