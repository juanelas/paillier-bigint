[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

# paillier-bigint

An implementation of the Paillier cryptosystem relying on the native JS (stage 3) implementation of BigInt. It can be used by any [Web Browser or webview supporting BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#Browser_compatibility) and with Node.js (>=10.4.0). In the latter case, for multi-threaded primality tests, you should use Node.js v11 or newer or enable at runtime with `node --experimental-worker` with Node.js version >= 10.5.0 and < 11.

_The operations supported on BigInts are not constant time. BigInt can be therefore **[unsuitable for use in cryptography](https://www.chosenplaintext.ca/articles/beginners-guide-constant-time-cryptography.html).** Many platforms provide native support for cryptography, such as [Web Cryptography API](https://w3c.github.io/webcrypto/) or [Node.js Crypto](https://nodejs.org/dist/latest/docs/api/crypto.html)._

The Paillier cryptosystem, named after and invented by Pascal Paillier in 1999, is a probabilistic asymmetric algorithm for public key cryptography. A notable feature of the Paillier cryptosystem is its homomorphic properties.

## Homomorphic properties

### Homomorphic addition of plaintexts

The product of two ciphertexts will decrypt to the sum of their corresponding plaintexts,

**D( E(m1) · E(m2) ) mod n^2 = m1 + m2 mod n**

The product of a ciphertext with a plaintext raising g will decrypt to the sum of the corresponding plaintexts,

**D( E(m1) · g^(m2) ) mod n^2 = m1 + m2 mod n**

### (pseudo-)homomorphic multiplication of plaintexts

An encrypted plaintext raised to the power of another plaintext will decrypt to the product of the two plaintexts,

**D( E(m1)^(m2) mod n^2 ) = m1 · m2 mod n**,

**D( E(m2)^(m1) mod n^2 ) = m1 · m2 mod n**.

More generally, an encrypted plaintext raised to a constant k will decrypt to the product of the plaintext and the
constant,

**D( E(m1)^k mod n^2 ) = k · m1 mod n**.

However, given the Paillier encryptions of two messages there is no known way to compute an encryption of the product of
these messages without knowing the private key.

## Key generation

1. Define the bit length of the modulus `n`, or `keyLength` in bits.
2. Choose two large prime numbers `p` and `q` randomly and independently of each other such that `gcd( p·q, (p-1)(q-1) )=1` and `n=p·q` has a key length of keyLength. For instance:
   1. Generate a random prime `p` with a bit length of `keyLength/2 + 1`.
   2. Generate a random prime `q` with a bit length of `keyLength/2`.
   3. Repeat until the bitlength of `n=p·q` is `keyLength`.
3. Compute `λ = lcm(p-1, q-1)` with `lcm(a, b) = a·b / gcd(a, b)`.
4. Select a generator `g` in `Z*` of `n^2`. `g` can be computed as follows (there are other ways):
   * Generate randoms `α` and `β` in `Z*` of `n`. 
   * Compute `g=( α·n + 1 ) β^n mod n^2`.
5. Compute `μ=( L( g^λ mod n^2 ) )^(-1) mod n` where `L(x)=(x-1)/n`.
   
The **public** (encryption) **key** is **(n, g)**.

The **private** (decryption) **key** is **(λ, μ)**. 
  
## Encryption
Let `m` in `Z*` of `n` be the clear-text message,

1. Select random integer `r` in `(1, n^2)`.

2. Compute ciphertext as: **`c = g^m · r^n mod n^2`**

## Decryption
Let `c` be the ciphertext to decrypt, where `c` in `(0, n^2)`.

1. Compute the plaintext message as: **`m = L( c^λ mod n^2 ) · μ mod n`**

## Installation
`paillier-bigint` is distributed for [web browsers and/or webviews supporting BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#Browser_compatibility) as an ES6 module or an IIFE file; and for Node.js (>=10.4.0), as a CJS module.

`paillier-bigint` can be imported to your project with `npm`:
```bash
npm install paillier-bigint
```

NPM installation defaults to the ES6 module for browsers and the CJS one for Node.js.

For web browsers, you can also directly download the minimized version of the [IIFE file](https://aw.githubusercontent.com/juanelas/paillier-bigint/master/dist/index.browser.bundle.js) or the [ES6 module](https://raw.githubusercontent.com/juanelas/paillier-bigint/master/dist/index.browser.bundle.mod.js) from GitHub.

## Usage

```javascript
    // import paillier in node.js
    const paillier = require('paillier-bigint.js')
    // import paillier in native JS
    import * as paillier from 'paillier-bigint'

    // (asynchronous) creation of a random private, public key pair for the Paillier cryptosystem
    const {publicKey, privateKey} = await paillier.generateRandomKeys(3072)

    // optionally, you can create your public/private keys from known parameters
    const publicKey = new paillier.PublicKey(n, g)
    const privateKey = new paillier.PrivateKey(lambda, mu, publicKey)

    // encrypt m
    let c = publicKey.encrypt(m)

    // decrypt c
    let d = privateKey.decrypt(c)

    // homomorphic addition of two ciphertexts (encrypted numbers)
    let c1 = publicKey.encrypt(m1)
    let c2 = publicKey.encrypt(m2)
    let encryptedSum = publicKey.addition(c1, c2)
    let sum = privateKey.decrypt(encryptedSum) // m1 + m2

    // multiplication by k
    let c1 = publicKey.encrypt(m1)
    let encryptedMul = publicKey.multiply(c1, k)
    let mul = privateKey.decrypt(encryptedMul) // k · m1
```

# JS Doc

## Classes

<dl>
<dt><a href="#PublicKey">PublicKey</a></dt>
<dd></dd>
<dt><a href="#PrivateKey">PrivateKey</a></dt>
<dd></dd>
</dl>

## Constants

<dl>
<dt><a href="#generateRandomKeys">generateRandomKeys</a> ⇒ <code><a href="#KeyPair">Promise.&lt;KeyPair&gt;</a></code></dt>
<dd><p>Generates a pair private, public key for the Paillier cryptosystem.</p>
</dd>
<dt><a href="#generateRandomKeysSync">generateRandomKeysSync</a> ⇒ <code><a href="#KeyPair">KeyPair</a></code></dt>
<dd><p>Generates a pair private, public key for the Paillier cryptosystem in synchronous mode.
Synchronous mode is NOT RECOMMENDED since it won&#39;t use workers and thus it&#39;ll be slower and may freeze thw window in browser&#39;s javascript.</p>
</dd>
<dt><a href="#PublicKey">PublicKey</a></dt>
<dd><p>Class for a Paillier public key</p>
</dd>
<dt><a href="#PrivateKey">PrivateKey</a></dt>
<dd><p>Class for Paillier private keys.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#KeyPair">KeyPair</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="PublicKey"></a>

## PublicKey
**Kind**: global class  

* [PublicKey](#PublicKey)
    * [new PublicKey(n, g)](#new_PublicKey_new)
    * [.bitLength](#PublicKey+bitLength) ⇒ <code>number</code>
    * [.encrypt(m)](#PublicKey+encrypt) ⇒ <code>bigint</code>
    * [.addition(...ciphertexts)](#PublicKey+addition) ⇒ <code>bigint</code>
    * [.multiply(c, k)](#PublicKey+multiply) ⇒ <code>bigint</code>

<a name="new_PublicKey_new"></a>

### new PublicKey(n, g)
Creates an instance of class PublicKey


| Param | Type | Description |
| --- | --- | --- |
| n | <code>bigint</code> | the public modulo |
| g | <code>bigint</code> \| <code>number</code> | the public generator |

<a name="PublicKey+bitLength"></a>

### publicKey.bitLength ⇒ <code>number</code>
Get the bit length of the public modulo

**Kind**: instance property of [<code>PublicKey</code>](#PublicKey)  
**Returns**: <code>number</code> - - bit length of the public modulo  
<a name="PublicKey+encrypt"></a>

### publicKey.encrypt(m) ⇒ <code>bigint</code>
Paillier public-key encryption

**Kind**: instance method of [<code>PublicKey</code>](#PublicKey)  
**Returns**: <code>bigint</code> - - the encryption of m with this public key  

| Param | Type | Description |
| --- | --- | --- |
| m | <code>bigint</code> | a bigint representation of a cleartext message |

<a name="PublicKey+addition"></a>

### publicKey.addition(...ciphertexts) ⇒ <code>bigint</code>
Homomorphic addition

**Kind**: instance method of [<code>PublicKey</code>](#PublicKey)  
**Returns**: <code>bigint</code> - - the encryption of (m_1 + ... + m_2) with this public key  

| Param | Type | Description |
| --- | --- | --- |
| ...ciphertexts | <code>bigint</code> | n >= 2 ciphertexts (c_1,..., c_n) that are the encryption of (m_1, ..., m_n) with this public key |

<a name="PublicKey+multiply"></a>

### publicKey.multiply(c, k) ⇒ <code>bigint</code>
Pseudo-homomorphic Paillier multiplication

**Kind**: instance method of [<code>PublicKey</code>](#PublicKey)  
**Returns**: <code>bigint</code> - - the encryption of k·m with this public key  

| Param | Type | Description |
| --- | --- | --- |
| c | <code>bigint</code> | a number m encrypted with this public key |
| k | <code>bigint</code> \| <code>number</code> | either a bigint or a number |

<a name="PrivateKey"></a>

## PrivateKey
**Kind**: global class  

* [PrivateKey](#PrivateKey)
    * [new PrivateKey(lambda, mu, publicKey, [p], [q])](#new_PrivateKey_new)
    * [.bitLength](#PrivateKey+bitLength) ⇒ <code>number</code>
    * [.n](#PrivateKey+n) ⇒ <code>bigint</code>
    * [.decrypt(c)](#PrivateKey+decrypt) ⇒ <code>bigint</code>

<a name="new_PrivateKey_new"></a>

### new PrivateKey(lambda, mu, publicKey, [p], [q])
Creates an instance of class PrivateKey


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| lambda | <code>bigint</code> |  |  |
| mu | <code>bigint</code> |  |  |
| publicKey | [<code>PublicKey</code>](#PublicKey) |  |  |
| [p] | <code>bigint</code> | <code></code> | a big prime |
| [q] | <code>bigint</code> | <code></code> | a big prime |

<a name="PrivateKey+bitLength"></a>

### privateKey.bitLength ⇒ <code>number</code>
Get the bit length of the public modulo

**Kind**: instance property of [<code>PrivateKey</code>](#PrivateKey)  
**Returns**: <code>number</code> - - bit length of the public modulo  
<a name="PrivateKey+n"></a>

### privateKey.n ⇒ <code>bigint</code>
Get the public modulo n=p·q

**Kind**: instance property of [<code>PrivateKey</code>](#PrivateKey)  
**Returns**: <code>bigint</code> - - the public modulo n=p·q  
<a name="PrivateKey+decrypt"></a>

### privateKey.decrypt(c) ⇒ <code>bigint</code>
Paillier private-key decryption

**Kind**: instance method of [<code>PrivateKey</code>](#PrivateKey)  
**Returns**: <code>bigint</code> - - the decryption of c with this private key  

| Param | Type | Description |
| --- | --- | --- |
| c | <code>bigint</code> | a bigint encrypted with the public key |

<a name="generateRandomKeys"></a>

## generateRandomKeys ⇒ [<code>Promise.&lt;KeyPair&gt;</code>](#KeyPair)
Generates a pair private, public key for the Paillier cryptosystem.

**Kind**: global constant  
**Returns**: [<code>Promise.&lt;KeyPair&gt;</code>](#KeyPair) - - a promise that resolves to a [KeyPair](#KeyPair) of public, private keys  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [bitLength] | <code>number</code> | <code>3072</code> | the bit length of the public modulo |
| [simplevariant] | <code>boolean</code> | <code>false</code> | use the simple variant to compute the generator (g=n+1) |

<a name="generateRandomKeysSync"></a>

## generateRandomKeysSync ⇒ [<code>KeyPair</code>](#KeyPair)
Generates a pair private, public key for the Paillier cryptosystem in synchronous mode.
Synchronous mode is NOT RECOMMENDED since it won't use workers and thus it'll be slower and may freeze thw window in browser's javascript.

**Kind**: global constant  
**Returns**: [<code>KeyPair</code>](#KeyPair) - - a [KeyPair](#KeyPair) of public, private keys  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [bitLength] | <code>number</code> | <code>4096</code> | the bit length of the public modulo |
| [simplevariant] | <code>boolean</code> | <code>false</code> | use the simple variant to compute the generator (g=n+1) |

<a name="PublicKey"></a>

## PublicKey
Class for a Paillier public key

**Kind**: global constant  

* [PublicKey](#PublicKey)
    * [new PublicKey(n, g)](#new_PublicKey_new)
    * [.bitLength](#PublicKey+bitLength) ⇒ <code>number</code>
    * [.encrypt(m)](#PublicKey+encrypt) ⇒ <code>bigint</code>
    * [.addition(...ciphertexts)](#PublicKey+addition) ⇒ <code>bigint</code>
    * [.multiply(c, k)](#PublicKey+multiply) ⇒ <code>bigint</code>

<a name="new_PublicKey_new"></a>

### new PublicKey(n, g)
Creates an instance of class PublicKey


| Param | Type | Description |
| --- | --- | --- |
| n | <code>bigint</code> | the public modulo |
| g | <code>bigint</code> \| <code>number</code> | the public generator |

<a name="PublicKey+bitLength"></a>

### publicKey.bitLength ⇒ <code>number</code>
Get the bit length of the public modulo

**Kind**: instance property of [<code>PublicKey</code>](#PublicKey)  
**Returns**: <code>number</code> - - bit length of the public modulo  
<a name="PublicKey+encrypt"></a>

### publicKey.encrypt(m) ⇒ <code>bigint</code>
Paillier public-key encryption

**Kind**: instance method of [<code>PublicKey</code>](#PublicKey)  
**Returns**: <code>bigint</code> - - the encryption of m with this public key  

| Param | Type | Description |
| --- | --- | --- |
| m | <code>bigint</code> | a bigint representation of a cleartext message |

<a name="PublicKey+addition"></a>

### publicKey.addition(...ciphertexts) ⇒ <code>bigint</code>
Homomorphic addition

**Kind**: instance method of [<code>PublicKey</code>](#PublicKey)  
**Returns**: <code>bigint</code> - - the encryption of (m_1 + ... + m_2) with this public key  

| Param | Type | Description |
| --- | --- | --- |
| ...ciphertexts | <code>bigint</code> | n >= 2 ciphertexts (c_1,..., c_n) that are the encryption of (m_1, ..., m_n) with this public key |

<a name="PublicKey+multiply"></a>

### publicKey.multiply(c, k) ⇒ <code>bigint</code>
Pseudo-homomorphic Paillier multiplication

**Kind**: instance method of [<code>PublicKey</code>](#PublicKey)  
**Returns**: <code>bigint</code> - - the encryption of k·m with this public key  

| Param | Type | Description |
| --- | --- | --- |
| c | <code>bigint</code> | a number m encrypted with this public key |
| k | <code>bigint</code> \| <code>number</code> | either a bigint or a number |

<a name="PrivateKey"></a>

## PrivateKey
Class for Paillier private keys.

**Kind**: global constant  

* [PrivateKey](#PrivateKey)
    * [new PrivateKey(lambda, mu, publicKey, [p], [q])](#new_PrivateKey_new)
    * [.bitLength](#PrivateKey+bitLength) ⇒ <code>number</code>
    * [.n](#PrivateKey+n) ⇒ <code>bigint</code>
    * [.decrypt(c)](#PrivateKey+decrypt) ⇒ <code>bigint</code>

<a name="new_PrivateKey_new"></a>

### new PrivateKey(lambda, mu, publicKey, [p], [q])
Creates an instance of class PrivateKey


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| lambda | <code>bigint</code> |  |  |
| mu | <code>bigint</code> |  |  |
| publicKey | [<code>PublicKey</code>](#PublicKey) |  |  |
| [p] | <code>bigint</code> | <code></code> | a big prime |
| [q] | <code>bigint</code> | <code></code> | a big prime |

<a name="PrivateKey+bitLength"></a>

### privateKey.bitLength ⇒ <code>number</code>
Get the bit length of the public modulo

**Kind**: instance property of [<code>PrivateKey</code>](#PrivateKey)  
**Returns**: <code>number</code> - - bit length of the public modulo  
<a name="PrivateKey+n"></a>

### privateKey.n ⇒ <code>bigint</code>
Get the public modulo n=p·q

**Kind**: instance property of [<code>PrivateKey</code>](#PrivateKey)  
**Returns**: <code>bigint</code> - - the public modulo n=p·q  
<a name="PrivateKey+decrypt"></a>

### privateKey.decrypt(c) ⇒ <code>bigint</code>
Paillier private-key decryption

**Kind**: instance method of [<code>PrivateKey</code>](#PrivateKey)  
**Returns**: <code>bigint</code> - - the decryption of c with this private key  

| Param | Type | Description |
| --- | --- | --- |
| c | <code>bigint</code> | a bigint encrypted with the public key |

<a name="KeyPair"></a>

## KeyPair : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| publicKey | [<code>PublicKey</code>](#PublicKey) | a Paillier's public key |
| privateKey | [<code>PrivateKey</code>](#PrivateKey) | the associated Paillier's private key |

