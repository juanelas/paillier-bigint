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

NPM installation defaults to the ES6 module for native JS and the CJS one for Node.js.

For web browsers, you can also directly download the minimized version of the [IIFE file](https://aw.githubusercontent.com/juanelas/paillier-bigint/master/dist/index.browser.bundle.iife.js) or the [ES6 bundle module](https://raw.githubusercontent.com/juanelas/paillier-bigint/master/dist/index.browser.bundle.mod.js) from GitHub.

## Usage

Import your module as :

 - Node.js
   ```javascript
   const paillierBigint = require('paillier-bigint')
   ... // your code here
   ```
 - JavaScript native project or TypeScript
   ```javascript
   import * as paillierBigint from 'paillier-bigint'
   ... // your code here
   ```
   > BigInt is [ES-2020](https://tc39.es/ecma262/#sec-bigint-objects). In order to use it with TypeScript you should set `lib` (and probably also `target` and `module`) to `esnext` in `tsconfig.json`.
 - JavaScript native browser ES6 mod
   ```html
   <script type="module">
      import * as paillierBigint from 'lib/index.browser.bundle.mod.js'  // Use you actual path to the broser mod bundle
      ... // your code here
    </script>
   ```
 - JavaScript native browser IIFE
   ```html
   <script src="../../lib/index.browser.bundle.js"></script> <!-- Use you actual path to the browser bundle -->
   <script>
     ... // your code here
   </script>
   ```

Then you could use, for instance, the following code:

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

### Modules

<dl>
<dt><a href="#module_paillier-bigint">paillier-bigint</a></dt>
<dd><p>Paillier cryptosystem for both Node.js and native JS (browsers and webviews)</p>
</dd>
</dl>

### Classes

<dl>
<dt><a href="#PublicKey">PublicKey</a></dt>
<dd><p>Class for a Paillier public key</p>
</dd>
<dt><a href="#PrivateKey">PrivateKey</a></dt>
<dd><p>Class for Paillier private keys.</p>
</dd>
</dl>

<a name="module_paillier-bigint"></a>

### paillier-bigint
Paillier cryptosystem for both Node.js and native JS (browsers and webviews)


* [paillier-bigint](#module_paillier-bigint)
    * [~generateRandomKeys([bitlength], [simplevariant])](#module_paillier-bigint..generateRandomKeys) ⇒ <code>Promise.&lt;KeyPair&gt;</code>
    * [~generateRandomKeysSync([bitlength], [simplevariant])](#module_paillier-bigint..generateRandomKeysSync) ⇒ <code>KeyPair</code>
    * [~KeyPair](#module_paillier-bigint..KeyPair) : <code>Object</code>

<a name="module_paillier-bigint..generateRandomKeys"></a>

#### paillier-bigint~generateRandomKeys([bitlength], [simplevariant]) ⇒ <code>Promise.&lt;KeyPair&gt;</code>
Generates a pair private, public key for the Paillier cryptosystem.

**Kind**: inner method of [<code>paillier-bigint</code>](#module_paillier-bigint)  
**Returns**: <code>Promise.&lt;KeyPair&gt;</code> - - a promise that resolves to a [KeyPair](KeyPair) of public, private keys  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [bitlength] | <code>number</code> | <code>3072</code> | the bit length of the public modulo |
| [simplevariant] | <code>boolean</code> | <code>false</code> | use the simple variant to compute the generator (g=n+1) |

<a name="module_paillier-bigint..generateRandomKeysSync"></a>

#### paillier-bigint~generateRandomKeysSync([bitlength], [simplevariant]) ⇒ <code>KeyPair</code>
Generates a pair private, public key for the Paillier cryptosystem in synchronous mode.
Synchronous mode is NOT RECOMMENDED since it won't use workers and thus it'll be slower and may freeze thw window in browser's javascript.

**Kind**: inner method of [<code>paillier-bigint</code>](#module_paillier-bigint)  
**Returns**: <code>KeyPair</code> - - a [KeyPair](KeyPair) of public, private keys  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [bitlength] | <code>number</code> | <code>4096</code> | the bit length of the public modulo |
| [simplevariant] | <code>boolean</code> | <code>false</code> | use the simple variant to compute the generator (g=n+1) |

<a name="module_paillier-bigint..KeyPair"></a>

#### paillier-bigint~KeyPair : <code>Object</code>
**Kind**: inner typedef of [<code>paillier-bigint</code>](#module_paillier-bigint)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| publicKey | [<code>PublicKey</code>](#PublicKey) | a Paillier's public key |
| privateKey | [<code>PrivateKey</code>](#PrivateKey) | the associated Paillier's private key |

<a name="PublicKey"></a>

### PublicKey
Class for a Paillier public key

**Kind**: global class  

* [PublicKey](#PublicKey)
    * [new PublicKey(n, g)](#new_PublicKey_new)
    * [.bitLength](#PublicKey+bitLength) ⇒ <code>number</code>
    * [.encrypt(m)](#PublicKey+encrypt) ⇒ <code>bigint</code>
    * [.addition(...ciphertexts)](#PublicKey+addition) ⇒ <code>bigint</code>
    * [.multiply(c, k)](#PublicKey+multiply) ⇒ <code>bigint</code>

<a name="new_PublicKey_new"></a>

#### new PublicKey(n, g)
Creates an instance of class PublicKey


| Param | Type | Description |
| --- | --- | --- |
| n | <code>bigint</code> | the public modulo |
| g | <code>bigint</code> | the public generator |

<a name="PublicKey+bitLength"></a>

#### publicKey.bitLength ⇒ <code>number</code>
Get the bit length of the public modulo

**Kind**: instance property of [<code>PublicKey</code>](#PublicKey)  
**Returns**: <code>number</code> - - bit length of the public modulo  
<a name="PublicKey+encrypt"></a>

#### publicKey.encrypt(m) ⇒ <code>bigint</code>
Paillier public-key encryption

**Kind**: instance method of [<code>PublicKey</code>](#PublicKey)  
**Returns**: <code>bigint</code> - - the encryption of m with this public key  

| Param | Type | Description |
| --- | --- | --- |
| m | <code>bigint</code> | a bigint representation of a cleartext message |

<a name="PublicKey+addition"></a>

#### publicKey.addition(...ciphertexts) ⇒ <code>bigint</code>
Homomorphic addition

**Kind**: instance method of [<code>PublicKey</code>](#PublicKey)  
**Returns**: <code>bigint</code> - - the encryption of (m_1 + ... + m_2) with this public key  

| Param | Type | Description |
| --- | --- | --- |
| ...ciphertexts | <code>bigint</code> | n >= 2 ciphertexts (c_1,..., c_n) that are the encryption of (m_1, ..., m_n) with this public key |

<a name="PublicKey+multiply"></a>

#### publicKey.multiply(c, k) ⇒ <code>bigint</code>
Pseudo-homomorphic Paillier multiplication

**Kind**: instance method of [<code>PublicKey</code>](#PublicKey)  
**Returns**: <code>bigint</code> - - the encryption of k·m with this public key  

| Param | Type | Description |
| --- | --- | --- |
| c | <code>bigint</code> | a number m encrypted with this public key |
| k | <code>bigint</code> \| <code>number</code> | either a bigint or a number |

<a name="PrivateKey"></a>

### PrivateKey
Class for Paillier private keys.

**Kind**: global class  

* [PrivateKey](#PrivateKey)
    * [new PrivateKey(lambda, mu, publicKey, [p], [q])](#new_PrivateKey_new)
    * [.bitLength](#PrivateKey+bitLength) ⇒ <code>number</code>
    * [.n](#PrivateKey+n) ⇒ <code>bigint</code>
    * [.decrypt(c)](#PrivateKey+decrypt) ⇒ <code>bigint</code>

<a name="new_PrivateKey_new"></a>

#### new PrivateKey(lambda, mu, publicKey, [p], [q])
Creates an instance of class PrivateKey


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| lambda | <code>bigint</code> |  |  |
| mu | <code>bigint</code> |  |  |
| publicKey | [<code>PublicKey</code>](#PublicKey) |  |  |
| [p] | <code>bigint</code> | <code></code> | a big prime |
| [q] | <code>bigint</code> | <code></code> | a big prime |

<a name="PrivateKey+bitLength"></a>

#### privateKey.bitLength ⇒ <code>number</code>
Get the bit length of the public modulo

**Kind**: instance property of [<code>PrivateKey</code>](#PrivateKey)  
**Returns**: <code>number</code> - - bit length of the public modulo  
<a name="PrivateKey+n"></a>

#### privateKey.n ⇒ <code>bigint</code>
Get the public modulo n=p·q

**Kind**: instance property of [<code>PrivateKey</code>](#PrivateKey)  
**Returns**: <code>bigint</code> - - the public modulo n=p·q  
<a name="PrivateKey+decrypt"></a>

#### privateKey.decrypt(c) ⇒ <code>bigint</code>
Paillier private-key decryption

**Kind**: instance method of [<code>PrivateKey</code>](#PrivateKey)  
**Returns**: <code>bigint</code> - - the decryption of c with this private key  

| Param | Type | Description |
| --- | --- | --- |
| c | <code>bigint</code> | a bigint encrypted with the public key |

