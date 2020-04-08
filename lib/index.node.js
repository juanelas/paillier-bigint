'use strict'

Object.defineProperty(exports, '__esModule', { value: true })

var bcu = require('bigint-crypto-utils')

/**
 * Class for a Paillier public key
 */
class PublicKey {
  /**
     * Creates an instance of class PublicKey
     * @param {bigint} n - the public modulo
     * @param {bigint} g - the public generator
     */
  constructor (n, g) {
    this.n = n
    this._n2 = this.n ** 2n // cache n^2
    this.g = g
  }

  /**
     * Get the bit length of the public modulo
     * @returns {number} - bit length of the public modulo
     */
  get bitLength () {
    return bcu.bitLength(this.n)
  }

  /**
     * Paillier public-key encryption
     *
     * @param {bigint} m - a bigint representation of a cleartext message
     *
     * @returns {bigint} - the encryption of m with this public key
     */
  encrypt (m) {
    const r = bcu.randBetween(this.n)
    return (bcu.modPow(this.g, m, this._n2) * bcu.modPow(r, this.n, this._n2)) % this._n2
  }

  /**
     * Homomorphic addition
     *
     * @param {...bigint} ciphertexts - n >= 2 ciphertexts (c_1,..., c_n) that are the encryption of (m_1, ..., m_n) with this public key
     *
     * @returns {bigint} - the encryption of (m_1 + ... + m_2) with this public key
     */
  addition (...ciphertexts) {
    return ciphertexts.reduce((sum, next) => sum * next % (this._n2), 1n)
  }

  /**
     * Pseudo-homomorphic Paillier multiplication
     *
     * @param {bigint} c - a number m encrypted with this public key
     * @param {bigint | number} k - either a bigint or a number
     *
     * @returns {bigint} - the encryption of k·m with this public key
     */
  multiply (c, k) {
    return bcu.modPow(BigInt(c), BigInt(k), this._n2)
  }
}

/**
 * Class for Paillier private keys.
 */
class PrivateKey {
  /**
     * Creates an instance of class PrivateKey
     *
     * @param {bigint} lambda
     * @param {bigint} mu
     * @param {PublicKey} publicKey
     * @param {bigint} [p = null] - a big prime
     * @param {bigint} [q = null] - a big prime
     */
  constructor (lambda, mu, publicKey, p = null, q = null) {
    this.lambda = lambda
    this.mu = mu
    this._p = p || null
    this._q = q || null
    this.publicKey = publicKey
  }

  /**
     * Get the bit length of the public modulo
     * @returns {number} - bit length of the public modulo
     */
  get bitLength () {
    return bcu.bitLength(this.publicKey.n)
  }

  /**
     * Get the public modulo n=p·q
     * @returns {bigint} - the public modulo n=p·q
     */
  get n () {
    return this.publicKey.n
  }

  /**
     * Paillier private-key decryption
     *
     * @param {bigint} c - a bigint encrypted with the public key
     *
     * @returns {bigint} - the decryption of c with this private key
     */
  decrypt (c) {
    return (L(bcu.modPow(c, this.lambda, this.publicKey._n2), this.publicKey.n) * this.mu) % this.publicKey.n
  }
}

function L (a, n) {
  return (a - 1n) / n
}

/**
 * Paillier cryptosystem for both Node.js and native JS (browsers and webviews)
 * @module paillier-bigint
 */

/**
 * @typedef {Object} KeyPair
 * @property {PublicKey} publicKey - a Paillier's public key
 * @property {PrivateKey} privateKey - the associated Paillier's private key
 */

/**
 * Generates a pair private, public key for the Paillier cryptosystem.
 *
 * @param {number} [bitlength = 3072] - the bit length of the public modulo
 * @param {boolean} [simplevariant = false] - use the simple variant to compute the generator (g=n+1)
 *
 * @returns {Promise<KeyPair>} - a promise that resolves to a {@link KeyPair} of public, private keys
 */
async function generateRandomKeys (bitlength = 3072, simpleVariant = false) {
  let p, q, n, g, lambda, mu
  // if p and q are bitLength/2 long ->  2**(bitLength - 2) <= n < 2**(bitLength)
  do {
    p = await bcu.prime(Math.floor(bitlength / 2) + 1)
    q = await bcu.prime(Math.floor(bitlength / 2))
    n = p * q
  } while (q === p || bcu.bitLength(n) !== bitlength)

  const phi = (p - 1n) * (q - 1n)

  const n2 = n ** 2n

  if (simpleVariant === true) {
    // If using p,q of equivalent length, a simpler variant of the key
    // generation steps would be to set
    // g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n)
    g = n + 1n
    lambda = phi
    mu = bcu.modInv(lambda, n)
  } else {
    g = getGenerator(n, n2)
    lambda = bcu.lcm(p - 1n, q - 1n)
    mu = bcu.modInv(L(bcu.modPow(g, lambda, n2), n), n)
  }

  const publicKey = new PublicKey(n, g)
  const privateKey = new PrivateKey(lambda, mu, publicKey, p, q)
  return { publicKey, privateKey }
}

/**
 * Generates a pair private, public key for the Paillier cryptosystem in synchronous mode.
 * Synchronous mode is NOT RECOMMENDED since it won't use workers and thus it'll be slower and may freeze thw window in browser's javascript.
 *
 * @param {number} [bitlength = 4096] - the bit length of the public modulo
 * @param {boolean} [simplevariant = false] - use the simple variant to compute the generator (g=n+1)
 *
 * @returns {KeyPair} - a {@link KeyPair} of public, private keys
 */
function generateRandomKeysSync (bitlength = 4096, simpleVariant = false) {
  let p, q, n, g, lambda, mu
  // if p and q are bitLength/2 long ->  2**(bitLength - 2) <= n < 2**(bitLength)
  do {
    p = bcu.primeSync(Math.floor(bitlength / 2) + 1)
    q = bcu.primeSync(Math.floor(bitlength / 2))
    n = p * q
  } while (q === p || bcu.bitLength(n) !== bitlength)

  const phi = (p - 1n) * (q - 1n)

  const n2 = n ** 2n

  if (simpleVariant === true) {
    // If using p,q of equivalent length, a simpler variant of the key
    // generation steps would be to set
    // g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n)
    g = n + 1n
    lambda = phi
    mu = bcu.modInv(lambda, n)
  } else {
    g = getGenerator(n, n2)
    lambda = bcu.lcm(p - 1n, q - 1n)
    mu = bcu.modInv(L(bcu.modPow(g, lambda, n2), n), n)
  }

  const publicKey = new PublicKey(n, g)
  const privateKey = new PrivateKey(lambda, mu, publicKey, p, q)
  return { publicKey, privateKey }
}

function getGenerator (n, n2 = bcu.modPow(n, 2)) {
  const alpha = bcu.randBetween(n)
  const beta = bcu.randBetween(n)
  return ((alpha * n + 1n) * bcu.modPow(beta, n, n2)) % n2
}

exports.PrivateKey = PrivateKey
exports.PublicKey = PublicKey
exports.generateRandomKeys = generateRandomKeys
exports.generateRandomKeysSync = generateRandomKeysSync
