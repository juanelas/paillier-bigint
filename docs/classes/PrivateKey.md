# Class: PrivateKey

Class for Paillier private keys.

## Table of contents

### Constructors

- [constructor](PrivateKey.md#constructor)

### Properties

- [lambda](PrivateKey.md#lambda)
- [mu](PrivateKey.md#mu)
- [publicKey](PrivateKey.md#publickey)

### Accessors

- [bitLength](PrivateKey.md#bitlength)
- [n](PrivateKey.md#n)

### Methods

- [decrypt](PrivateKey.md#decrypt)
- [getRandomFactor](PrivateKey.md#getrandomfactor)

## Constructors

### constructor

• **new PrivateKey**(`lambda`, `mu`, `publicKey`, `p?`, `q?`)

Creates an instance of class PrivateKey

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `lambda` | `bigint` |  |
| `mu` | `bigint` |  |
| `publicKey` | [`PublicKey`](PublicKey.md) |  |
| `p?` | `bigint` | a big prime |
| `q?` | `bigint` | - |

## Properties

### lambda

• `Readonly` **lambda**: `bigint`

___

### mu

• `Readonly` **mu**: `bigint`

___

### publicKey

• `Readonly` **publicKey**: [`PublicKey`](PublicKey.md)

## Accessors

### bitLength

• `get` **bitLength**(): `number`

Get the bit length of the public modulo

#### Returns

`number`

The bit length of the public modulo

___

### n

• `get` **n**(): `bigint`

Get the public modulo n=p·q

#### Returns

`bigint`

The public modulo n=p·q

## Methods

### decrypt

▸ **decrypt**(`c`): `bigint`

Paillier private-key decryption

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `c` | `bigint` | A bigint encrypted with the public key |

#### Returns

`bigint`

The decryption of c with this private key

___

### getRandomFactor

▸ **getRandomFactor**(`c`): `bigint`

Recover the random factor used for encrypting a message with the complementary public key.
The recovery function only works if the public key generator g was using the simple variant
g = 1 + n (see [generateRandomKeys](../API.md#generaterandomkeys))
It is also necessary to know p and q (usually stored in the private key)

**`Throws`**

RangeError
Cannot recover the random factor if publicKey.g != publicKey.n + 1. You should generate yout keys using the simple variant, e.g. generateRandomKeys(3072, true)  (see [generateRandomKeys](../API.md#generaterandomkeys))

**`Throws`**

Error
Cannot get random factor without knowing p and q

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `c` | `bigint` | The encryption of message m using a Paillier's [PublicKey](PublicKey.md) and random factor r |

#### Returns

`bigint`

The random factor r (mod n)
