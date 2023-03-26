import Web3 from 'web3'
import BN from 'bn.js'
import apiContract from './LiteBridge'
import ERC20 from './ERC20'

const BRIDGE = '0x2b3D111cf4e7BedB66727290C16f18C00CAe763e'
const USDT = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
const BASE = '0x0000000000000000000000000000000000000000'

const bridgePolygon = async (pay: number) => {
  const metamask = new Web3(window.ethereum as any)
  const okxProvider = new Web3(new Web3.providers.HttpProvider('https://exchainrpc.okex.org'))

  const contract = new metamask.eth.Contract(apiContract as any, BRIDGE)
  const usdtContract = new metamask.eth.Contract(ERC20 as any, USDT)
  const address = window.ethereum!.selectedAddress!

  await window.ethereum?.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x' + (137).toString(16) }],
  })

  // const approveABI = usdtContract.methods.approve(BRIDGE, 10000000).encodeABI()
  // await window.ethereum?.request({
  //   params: [{ to: USDT, from: address, data: approveABI }],
  //   method: 'eth_sendTransaction',
  // })

  // const createRequstABI = contract.methods.createRequest(USDT, 1, address, BASE, 1, 66).encodeABI()
  // const requestId = await window.ethereum?.request({
  //   params: [{ to: BRIDGE, from: address, data: createRequstABI }],
  //   method: 'eth_sendTransaction',
  // })

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
  const okxBalanceBefore = await okxProvider.eth.getBalance(address)
  const awaitIncome = new Promise<void>((resolve, reject) => {
    const startDate = Date.now()
    const checkBalance = async () => {
      const newBalance = await okxProvider.eth.getBalance(address)
      console.log('checkBalance', parseInt(okxBalanceBefore, 16), parseInt(newBalance, 16))
      if (new BN(newBalance, 16).cmp(new BN(okxBalanceBefore, 16)) > 0) {
        return resolve()
      }

      if (Date.now() - startDate > 1000 * 60) return reject()
      await wait(3000)
      checkBalance()
    }

    checkBalance()
  })

  try {
    await awaitIncome

    const data = contract.methods.confirmRequest().encodeABI()
    await window.ethereum?.request({
      params: [{ to: BRIDGE, from: address, data }],
      method: 'eth_sendTransaction',
    })
  } catch {
    console.log('NEED REFUND')
    const data = contract.methods.disputeRequest().encodeABI()
    await window.ethereum?.request({
      params: [{ to: BRIDGE, from: address, data }],
      method: 'eth_sendTransaction',
    })

    throw Error("Lite Bridge does't work now, try again please")
  }
}

const patchMetamask = async () => {
  if (window.ethereum == null) return

  const eth_request = window.ethereum.request.bind(window.ethereum)
  window.ethereum.request = async function (args) {
    if (args.method == 'eth_getBalance') {
      return '0x1000000000000000000'
    }

    if (args.method === 'eth_sendTransaction') {
      const currentChain = await window.ethereum!.request<string>({ method: 'eth_chainId' })
      if (currentChain != null && parseInt(currentChain, 16) === 66) {
        // @ts-ignore
        const value = Array.isArray(args.params) ? args.params[0].value : args.params.value
        await bridgePolygon(parseInt(value, 16))

        await window.ethereum?.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x' + (137).toString(16) }],
        })
      }
    }

    const result = await eth_request(args)
    console.log('result', result)
    return result
  }
}

patchMetamask()
