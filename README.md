[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Node.js CI](https://github.com/juanelas/paillier-bigint/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/juanelas/paillier-bigint/actions/workflows/build-and-test.yml)
[![Coverage Status](https://coveralls.io/repos/github/juanelas/paillier-bigint/badge.svg?branch=main)](https://coveralls.io/github/juanelas/paillier-bigint?branch=main)

# paillier-bigint

An implementation of the Paillier cryptosystem relying on the native JS implementation of BigInt. 

It can be used by any [Web Browser or webview supporting BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#Browser_compatibility) and with Node.js (>=10.4.0). In the latter case, for multi-threaded primality tests, you should use Node.js v11 or newer or enable at runtime with `node --experimental-worker` with Node.js version >= 10.5.0 and < 11.

_The operations supported on BigInts are not constant time. BigInt can be therefore **[unsuitable for use in cryptography](https://www.chosenplaintext.ca/articles/beginners-guide-constant-time-cryptography.html).** Many platforms provide native support for cryptography, such as [Web Cryptography API](https://w3c.github.io/webcrypto/) or [Node.js Crypto](https://nodejs.org/dist/latest/docs/api/crypto.html)._

The Paillier cryptosystem, named after and invented by Pascal Paillier in 1999, is a probabilistic asymmetric algorithm for public key cryptography. A notable feature of the Paillier cryptosystem is its homomorphic properties.

## Homomorphic properties

### Homomorphic addition of plaintexts

The product of two ciphertexts will decrypt to the sum of their corresponding plaintexts,

**D( E(m<sub>1</sub>) · E(m<sub>2</sub>) ) mod n<sup>2</sup> = m<sub>1</sub> + m<sub>2</sub> mod n**

The product of a ciphertext with a plaintext raising g will decrypt to the sum of the corresponding plaintexts,

**D( E(m<sub>1</sub>) · g<sup>m<sub>2</sub></sup> ) mod n<sup>2</sup> = m<sub>1</sub> + m<sub>2</sub> mod n**

### (pseudo-)homomorphic multiplication of plaintexts

An encrypted plaintext raised to the power of another plaintext will decrypt to the product of the two plaintexts,

**D( E(m<sub>1</sub>)<sup>m<sub>2</sub></sup> mod n<sup>2</sup> ) = m<sub>1</sub> · m<sub>2</sub> mod n**,

**D( E(m<sub>2</sub>)<sup>m<sub>1</sub></sup> mod n<sup>2</sup> ) = m<sub>1</sub> · m<sub>2</sub> mod n**.

More generally, an encrypted plaintext raised to a constant k will decrypt to the product of the plaintext and the
constant,

**D( E(m<sub>1</sub>)<sup>k</sup> mod n<sup>2</sup> ) = k · m<sub>1</sub> mod n**.

However, given the Paillier encryptions of two messages there is no known way to compute an encryption of the product of
these messages without knowing the private key.

## Key generation

1. Define the bit length of the modulus `n`, or `keyLength` in bits.
2. Choose two large prime numbers `p` and `q` randomly and independently of each other such that `gcd( p·q, (p-1)(q-1) )=1` and `n=p·q` has a key length of keyLength. For instance:
   1. Generate a random prime `p` with a bit length of `keyLength/2 + 1`.
   2. Generate a random prime `q` with a bit length of `keyLength/2`.
   3. Repeat until the bitlength of `n=p·q` is `keyLength`.
3. Compute parameters `λ`, `g` and `μ`. Among other ways, it can be done as follows:
   1. Standard approach:
      1. Compute `λ = lcm(p-1, q-1)` with `lcm(a, b) = a·b / gcd(a, b)`.
      2. Generate randoms `α` and `β` in `Z*` of `n`, and select generator `g` in `Z*` of `n**2` as `g = ( α·n + 1 ) β**n mod n**2`.
      3. Compute `μ = ( L( g^λ mod n**2 ) )**(-1) mod n` where `L(x)=(x-1)/n`.
   2. If using p,q of equivalent length, a simpler variant would be:
      1. `λ = (p-1, q-1)`
      2. `g = n+1`
      3. `μ = λ**(-1) mod n`
   
The **public** (encryption) **key** is **(n, g)**.

The **private** (decryption) **key** is **(λ, μ)**. 
  
## Encryption
Let `m` in `[0, n)` be the clear-text message,

1. Select random integer `r` in `Z*` of `n`.

2. Compute ciphertext as: **`c = g**m · r**n mod n**2`**

## Decryption
Let `c` be the ciphertext to decrypt, where `c` in `(0, n**2)`.

1. Compute the plaintext message as: **`m = L( c**λ mod n**2 ) · μ mod n`**

## Usage

`paillier-bigint` can be imported to your project with `npm`:

```console
npm install paillier-bigint
```

Then either require (Node.js CJS):

```javascript
const paillierBigint = require('paillier-bigint')
```

or import (JavaScript ES module):

```javascript
import * as paillierBigint from 'paillier-bigint'
```

The appropriate version for browser or node is automatically exported.

You can also download the [IIFE bundle](https://raw.githubusercontent.com/juanelas/paillier-bigint/main/dist/bundle.iife.js), the [ESM bundle](https://raw.githubusercontent.com/juanelas/paillier-bigint/main/dist/bundle.esm.min.js) or the [UMD bundle](https://raw.githubusercontent.com/juanelas/paillier-bigint/main/dist/bundle.umd.js) and manually add it to your project, or, if you have already imported `paillier-bigint` to your project, just get the bundles from `node_modules/paillier-bigint/dist/bundles/`.

An example of usage could be:

```javascript
async function paillierTest () {
  // (asynchronous) creation of a random private, public key pair for the Paillier cryptosystem
  const { publicKey, privateKey } = await paillierBigint.generateRandomKeys(3072)

  // Optionally, you can create your public/private keys from known parameters
  // const publicKey = new paillierBigint.PublicKey(n, g)
  // const privateKey = new paillierBigint.PrivateKey(lambda, mu, publicKey)

  const m1 = 12345678901234567890n
  const m2 = 5n

  // encryption/decryption
  const c1 = publicKey.encrypt(m1)
  console.log(privateKey.decrypt(c1)) // 12345678901234567890n

  // homomorphic addition of two ciphertexts (encrypted numbers)
  const c2 = publicKey.encrypt(m2)
  const encryptedSum = publicKey.addition(c1, c2)
  console.log(privateKey.decrypt(encryptedSum)) // m1 + m2 = 12345678901234567895n

  // multiplication by k
  const k = 10n
  const encryptedMul = publicKey.multiply(c1, k)
  console.log(privateKey.decrypt(encryptedMul)) // k · m1 = 123456789012345678900n
}
paillierTest()
```

> Consider using [bigint-conversion](https://github.com/juanelas/bigint-conversion) if you need to convert from/to bigint to/from unicode text, hex, buffer.

## API reference documentation

[Check the API](./docs/API.md)
