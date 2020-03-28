[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

# paillier-bigint

An implementation of the Paillier cryptosystem relying on the native JS (stage 3) implementation of BigInt. It can be used by any [Web Browser or webview supporting BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#Browser_compatibility) and with Node.js (>=10.4.0). In the latter case, for multi-threaded primality tests, you should use Node.js v11 or newer or enable at runtime with `node --experimental-worker` with Node.js version >= 10.5.0 and < 11.

_The operations supported on BigInts are not constant time. BigInt can be therefore **[unsuitable for use in cryptography](https://www.chosenplaintext.ca/articles/beginners-guide-constant-time-cryptography.html).** Many platforms provide native support for cryptography, such as [Web Cryptography API](https://w3c.github.io/webcrypto/) or [Node.js Crypto](https://nodejs.org/dist/latest/docs/api/crypto.html)._

The Paillier cryptosystem, named after and invented by Pascal Paillier in 1999, is a probabilistic asymmetric algorithm
for public key cryptography. A notable feature of the Paillier cryptosystem is its homomorphic properties.

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

For web browsers, you can also directly download the minimised version of the [IIFE file](https://aw.githubusercontent.com/juanelas/paillier-bigint/master/dist/paillier-bigint-latest.browser.min.js) or the [ES6 module](https://raw.githubusercontent.com/juanelas/paillier-bigint/master/dist/paillier-bigint-latest.browser.mod.min.js) from GitHub.

## Usage
Every input number should be a string in base 10, an integer, or a bigint. All the output numbers are of type `bigint`.

An example with Node.js:
```javascript
    // import paillier
    const paillier = require('paillier-bigint.js');

    // (asynchronous) creation of a random private, public key pair for the Paillier cryptosystem
    const {publicKey, privateKey} = await paillier.generateRandomKeys(3072);

    // optionally, you can create your public/private keys from known parameters
    const publicKey = new paillier.PublicKey(n, g);
    const privateKey = new paillier.PrivateKey(lambda, mu, publicKey);

    // encrypt m
    let c = publicKey.encrypt(m);

    // decrypt c
    let d = privateKey.decrypt(c);

    // homomorphic addition of two ciphertexts (encrypted numbers)
    let c1 = publicKey.encrypt(m1);
    let c2 = publicKey.encrypt(m2);
    let encryptedSum = publicKey.addition(c1, c2);
    let sum = privateKey.decrypt(encryptedSum); // m1 + m2

    // multiplication by k
    let c1 = publicKey.encrypt(m1);
    let encryptedMul = publicKey.multiply(c1, k);
    let mul = privateKey.decrypt(encryptedMul); // k · m1
```

From a browser, you can just load the module in a html page as:
```html
    <script type="module">
        import * as paillier from 'paillier-bigint-latest.browser.mod.min.js';

        // (asynchronous) creation of a random private, public key pair for the Paillier cryptosystem
        paillier.generateRandomKeys(3072).then((keyPair) => {
            const publicKey = keyPair.publicKey;
            const privateKey = keyPair.privateKey;
            // ...
        });

        // You can also create your public/private keys from known parameters
        const publicKey = new paillier.PublicKey(n, g);
        const privateKey = new paillier.PrivateKey(lambda, mu, publicKey);

        // encrypt m is just
        let c = publicKey.encrypt(m);

        // decrypt c
        let d = privateKey.decrypt(c);

        // homomorphic addition of two ciphertexts (encrypted numbers)
        let c1 = publicKey.encrypt(m1);
        let c2 = publicKey.encrypt(m2);
        let encryptedSum = publicKey.addition(c1, c2);
        let sum = privateKey.decrypt(encryptedSum); // m1 + m2

        // multiplication by k
        let c1 = publicKey.encrypt(m1);
        let encryptedMul = publicKey.multiply(c1, k);
        let mul = privateKey.decrypt(encryptedMul); // k · m1
    </script>
```

{{>main}}

* * *