paillier-bigint - v3.2.2

# paillier-bigint - v3.2.2

## Table of contents

### Classes

- [PrivateKey](classes/privatekey.md)
- [PublicKey](classes/publickey.md)

### Interfaces

- [KeyPair](interfaces/keypair.md)

### Functions

- [generateRandomKeys](API.md#generaterandomkeys)
- [generateRandomKeysSync](API.md#generaterandomkeyssync)

## Functions

### generateRandomKeys

▸ **generateRandomKeys**(`bitlength?`: *number*, `simpleVariant?`: *boolean*): *Promise*<[*KeyPair*](interfaces/keypair.md)\>

Generates a pair private, public key for the Paillier cryptosystem.

#### Parameters:

Name | Type | Default value | Description |
:------ | :------ | :------ | :------ |
`bitlength` | *number* | 3072 | The bit length of the public modulo   |
`simpleVariant` | *boolean* | false | - |

**Returns:** *Promise*<[*KeyPair*](interfaces/keypair.md)\>

A promise that resolves to a [KeyPair](interfaces/keypair.md) of public, private keys

Defined in: [generateRandomKeys.ts:18](https://github.com/juanelas/paillier-bigint/blob/b36905d/src/ts/generateRandomKeys.ts#L18)

___

### generateRandomKeysSync

▸ **generateRandomKeysSync**(`bitlength?`: *number*, `simpleVariant?`: *boolean*): [*KeyPair*](interfaces/keypair.md)

Generates a pair private, public key for the Paillier cryptosystem in synchronous mode.
Synchronous mode is NOT RECOMMENDED since it won't use workers and thus it'll be slower and may freeze thw window in browser's javascript.

#### Parameters:

Name | Type | Default value | Description |
:------ | :------ | :------ | :------ |
`bitlength` | *number* | 3072 | The bit length of the public modulo   |
`simpleVariant` | *boolean* | false | - |

**Returns:** [*KeyPair*](interfaces/keypair.md)

A pair of public, private keys

Defined in: [generateRandomKeys.ts:55](https://github.com/juanelas/paillier-bigint/blob/b36905d/src/ts/generateRandomKeys.ts#L55)
