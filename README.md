# Modulr JS SDK

A lightweight JavaScript wrapper around the Modulr node HTTP API. The SDK exposes crypto helpers, convenience utilities, and strongly-typed API calls for every public endpoint so you can interact with a node from any modern Node.js or browser project.

## Installation (GitHub source)

The package is not published to npm yet. Install it straight from GitHub so it becomes a normal dependency inside your project:

```bash
pnpm add git+https://github.com/ModulrCloud/js-sdk.git
# or
npm install github:ModulrCloud/js-sdk
```

After installation the package name resolves to `js-sdk`, which matches the `name` field inside `package.json`.

If you prefer to vendor the SDK manually, clone the repository and import `index.js` directly in your application:

```bash
git clone https://github.com/ModulrCloud/js-sdk.git
```

```js
import ModulrSDK from './js-sdk/index.js'
```

## Quick start

```js
import ModulrSDK from 'js-sdk'

const sdk = new ModulrSDK('https://your-node-hostname:port')

// crypto helpers that wrap the Ed25519 primitives shipped with the SDK
const { publicKey, privateKey } = await sdk.crypto.generateDefaultKeypair()

// helper utilities for building payloads and working with node URLs
const payload = sdk.helpers.buildTransactionPayload({
  sender: 'sender-account-id',
  recipient: 'recipient-account-id',
  amount: '1000',
  nonce: 42,
  payload: 'optional memo',
})

const signature = sdk.crypto.sign(JSON.stringify(payload), privateKey)

// async API calls map one-to-one to node endpoints
const block = await sdk.api.getBlockByHeight(1)
const account = await sdk.api.getAccountById('account-id')
const tx = await sdk.api.getTransactionByHash('0xdeadbeef')
```

Each API method automatically URL-encodes path parameters and returns the parsed JSON payload from the node. When the node responds with a non-2xx code, `sdk.helpers.parseJsonResponse` throws an error that includes the HTTP status and raw response body, so wrap requests in `try/catch` when you want custom error handling.

> `sdk.api.submitTransaction` is intentionally left unimplemented until the transaction submission contract is finalized.

## Available modules

| Module | Description |
| --- | --- |
| `sdk.crypto` | Thin wrappers around the `ed25519` primitives (default keypair derivation, signing, verification). |
| `sdk.helpers` | Utility helpers such as `buildUrl`, `buildTransactionPayload`, `encodeSegment`, and `parseJsonResponse`. |
| `sdk.api` | Async methods for every exposed node GET endpoint. |

## Minimal runnable script

```js
// examples/basic.js
import ModulrSDK from 'js-sdk'

async function main () {
  const sdk = new ModulrSDK(process.env.MODULR_NODE_URL)

  console.log('Node URL:', sdk.helpers.getNodeUrl())

  const latestHeight = Number(process.env.MODULR_BLOCK_HEIGHT ?? 1)
  const block = await sdk.api.getBlockByHeight(latestHeight)
  console.log('Block data:', block)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

Execute the script by pointing it to any reachable Modulr node:

```bash
MODULR_NODE_URL="https://your-node-hostname" node examples/basic.js
```

This demonstrates everything you need to wire the SDK into a project: install it straight from GitHub, instantiate it with your node URL, and call helpers plus API methods wherever you need them.