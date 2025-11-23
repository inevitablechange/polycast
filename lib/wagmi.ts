// lib/wagmi.ts
import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'

export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(), // 필요하면 커스텀 RPC로 교체
  },
  connectors: [
    farcasterMiniApp(), // Farcaster / Base Mini App 지갑 커넥터
  ],
})
