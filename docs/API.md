# paillier-bigint - v3.4.3

## Table of contents

### Classes

- [PrivateKey](classes/PrivateKey.md)
- [PublicKey](classes/PublicKey.md)

### Interfaces

- [KeyPair](interfaces/KeyPair.md)

### Functions

- [generateRandomKeys](API.md#generaterandomkeys)
- [generateRandomKeysSync](API.md#generaterandomkeyssync)

## Functions

### generateRandomKeys

▸ **generateRandomKeys**(`bitlength?`, `simpleVariant?`): `Promise`<[`KeyPair`](interfaces/KeyPair.md)\>

Generates a pair of private and public key for the Paillier cryptosystem.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `bitlength` | `number` | `3072` | The bit length of the public modulo |
| `simpleVariant` | `boolean` | `false` | Since generated p and q are of equivalent length, a simpler variant of the key generation steps would be to set g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n). This is REQUIRED if you want to be able to recover the random integer factor used when encrypting with the public key using the [getRandomFactor](classes/PrivateKey.md#getrandomfactor) method |

#### Returns

`Promise`<[`KeyPair`](interfaces/KeyPair.md)\>

A promise that resolves to a [KeyPair](interfaces/KeyPair.md) holding a public and a private key

___

### generateRandomKeysSync

▸ **generateRandomKeysSync**(`bitlength?`, `simpleVariant?`): [`KeyPair`](interfaces/KeyPair.md)

Generates a pair of private and public key for the Paillier cryptosystem in synchronous mode.
Synchronous mode is NOT RECOMMENDED since it won't use workers and thus it'll be slower and may freeze thw window in browser's javascript.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `bitlength` | `number` | `3072` | The bit length of the public modulo |
| `simpleVariant` | `boolean` | `false` | Since generated p and q are of equivalent length, a simpler variant of the key generation steps would be to set g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n). This is REQUIRED if you want to be able to recover the random integer factor used when encrypting with the public key using the [getRandomFactor](classes/PrivateKey.md#getrandomfactor) method. |

#### Returns

[`KeyPair`](interfaces/KeyPair.md)

A [KeyPair](interfaces/KeyPair.md) with a public and a private key
