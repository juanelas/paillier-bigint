[paillier-bigint - v3.2.2](../API.md) / PublicKey

# Class: PublicKey

Class for a Paillier public key

## Table of contents

### Constructors

- [constructor](publickey.md#constructor)

### Properties

- [\_n2](publickey.md#_n2)
- [g](publickey.md#g)
- [n](publickey.md#n)

### Accessors

- [bitLength](publickey.md#bitlength)

### Methods

- [addition](publickey.md#addition)
- [encrypt](publickey.md#encrypt)
- [multiply](publickey.md#multiply)

## Constructors

### constructor

\+ **new PublicKey**(`n`: *bigint*, `g`: *bigint*): [*PublicKey*](publickey.md)

Creates an instance of class PublicKey

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`n` | *bigint* | The public modulo   |
`g` | *bigint* | The public generator    |

**Returns:** [*PublicKey*](publickey.md)

Defined in: [PublicKey.ts:10](https://github.com/juanelas/paillier-bigint/blob/b36905d/src/ts/PublicKey.ts#L10)

## Properties

### \_n2

• `Readonly` **\_n2**: *bigint*

Defined in: [PublicKey.ts:10](https://github.com/juanelas/paillier-bigint/blob/b36905d/src/ts/PublicKey.ts#L10)

___

### g

• `Readonly` **g**: *bigint*

Defined in: [PublicKey.ts:8](https://github.com/juanelas/paillier-bigint/blob/b36905d/src/ts/PublicKey.ts#L8)

___

### n

• `Readonly` **n**: *bigint*

Defined in: [PublicKey.ts:7](https://github.com/juanelas/paillier-bigint/blob/b36905d/src/ts/PublicKey.ts#L7)

## Accessors

### bitLength

• get **bitLength**(): *number*

Get the bit length of the public modulo

**Returns:** *number*

The bit length of the public modulo

Defined in: [PublicKey.ts:27](https://github.com/juanelas/paillier-bigint/blob/b36905d/src/ts/PublicKey.ts#L27)

## Methods

### addition

▸ **addition**(...`ciphertexts`: *bigint*[]): *bigint*

Homomorphic addition

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`...ciphertexts` | *bigint*[] | n >= 2 ciphertexts (c_1,..., c_n) that are the encryption of (m_1, ..., m_n) with this public key    |

**Returns:** *bigint*

The encryption of (m_1 + ... + m_2) with this public key

Defined in: [PublicKey.ts:55](https://github.com/juanelas/paillier-bigint/blob/b36905d/src/ts/PublicKey.ts#L55)

___

### encrypt

▸ **encrypt**(`m`: *bigint*, `r?`: *bigint*): *bigint*

Paillier public-key encryption

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`m` | *bigint* | A bigint representation of a plaintext message   |
`r?` | *bigint* | The random integer factor for encryption. By default is a random in (1,n)    |

**Returns:** *bigint*

The encryption of m with this public key

Defined in: [PublicKey.ts:39](https://github.com/juanelas/paillier-bigint/blob/b36905d/src/ts/PublicKey.ts#L39)

___

### multiply

▸ **multiply**(`c`: *bigint*, `k`: *number* \| *bigint*): *bigint*

Pseudo-homomorphic Paillier multiplication

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`c` | *bigint* | a number m encrypted with this public key   |
`k` | *number* \| *bigint* | either a bigint or a number    |

**Returns:** *bigint*

- the encryption of k·m with this public key

Defined in: [PublicKey.ts:67](https://github.com/juanelas/paillier-bigint/blob/b36905d/src/ts/PublicKey.ts#L67)
