import ed25519 from './crypto_primitives/ed25519.js'

class ModulrSDK {
    constructor(nodeUrl) {
        if (!nodeUrl || typeof nodeUrl !== 'string') {
            throw new Error('Node URL must be provided as a string')
        }

        this.nodeUrl = nodeUrl.replace(/\/+$/, '')

        this.crypto = {
            generateDefaultKeypair: async (mnemonic, mnemonicPassword, bip44Path) =>
                ed25519.generateDefaultEd25519Keypair(mnemonic, mnemonicPassword, bip44Path),
            sign: (data, privateKeyAsBase64) =>
                ed25519.signEd25519(data, privateKeyAsBase64),
            verify: (data, signature, publicKey) =>
                ed25519.verifyEd25519(data, signature, publicKey),
        }

        this.helpers = {
            getNodeUrl: () => this.nodeUrl,
            buildUrl: (endpoint = '') => {
                const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
                return `${this.nodeUrl}${normalized}`
            },
            encodeSegment: (segment) => encodeURIComponent(String(segment ?? '').trim()),
            buildTransactionPayload: ({ sender, recipient, amount, nonce, payload = '' }) => {
                if (sender === undefined || recipient === undefined || amount === undefined || nonce === undefined) {
                    throw new Error('sender, recipient, amount and nonce must be provided')
                }

                return {
                    sender,
                    recipient,
                    amount,
                    nonce,
                    payload,
                }
            },
            parseJsonResponse: async (response) => {
                if (!response.ok) {
                    const errorPayload = await response.text()
                    throw new Error(`Node responded with ${response.status}: ${errorPayload}`)
                }

                return response.json()
            },
        }

        this.api = {
            getBlockById: async (blockId) =>
                this.#get(`/block/${this.helpers.encodeSegment(blockId)}`),
            getBlockByHeight: async (absoluteHeightIndex) =>
                this.#get(`/height/${this.helpers.encodeSegment(absoluteHeightIndex)}`),
            getAccountById: async (accountId) =>
                this.#get(`/account/${this.helpers.encodeSegment(accountId)}`),
            getEpochData: async (epochIndex) =>
                this.#get(`/epoch_data/${this.helpers.encodeSegment(epochIndex)}`),
            getAggregatedFinalizationProof: async (blockId) =>
                this.#get(`/aggregated_finalization_proof/${this.helpers.encodeSegment(blockId)}`),
            getAggregatedEpochFinalizationProof: async (epochIndex) =>
                this.#get(`/aggregated_epoch_finalization_proof/${this.helpers.encodeSegment(epochIndex)}`),
            getTransactionByHash: async (hash) =>
                this.#get(`/transaction/${this.helpers.encodeSegment(hash)}`),
            submitTransaction: async () => {
                throw new Error('POST /transaction is not implemented yet')
            },
        }
    }

    async #get(path) {
        const response = await fetch(this.helpers.buildUrl(path))
        return this.helpers.parseJsonResponse(response)
    }
}

export default ModulrSDK