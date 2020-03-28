import { bitLength, prime, modInv, modPow, lcm, primeSync, randBetween } from 'bigint-crypto-utils'

const _ONE = BigInt(1)

/**
 * @typedef {Object} KeyPair
 * @property {PublicKey} publicKey - a Paillier's public key
 * @property {PrivateKey} privateKey - the associated Paillier's private key
 */
/**
 * Generates a pair private, public key for the Paillier cryptosystem.
 *
 * @param {number} [bitLength = 3072] - the bit length of the public modulo
 * @param {boolean} [simplevariant = false] - use the simple variant to compute the generator (g=n+1)
 *
 * @returns {Promise<KeyPair>} - a promise that resolves to a {@link KeyPair} of public, private keys
 */
const generateRandomKeys = async function (bitLength$1 = 3072, simpleVariant = false) {
  let p, q, n, g, lambda, mu
  // if p and q are bitLength/2 long ->  2**(bitLength - 2) <= n < 2**(bitLength)
  do {
    p = await prime(Math.floor(bitLength$1 / 2) + 1)
    q = await prime(Math.floor(bitLength$1 / 2))
    n = p * q
  } while (q === p || bitLength(n) !== bitLength$1)

  const phi = (p - _ONE) * (q - _ONE)

  const n2 = n ** BigInt(2)

  if (simpleVariant === true) {
    // If using p,q of equivalent length, a simpler variant of the key
    // generation steps would be to set
    // g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n)
    g = n + _ONE
    lambda = phi
    mu = modInv(lambda, n)
  } else {
    g = getGenerator(n, n2)
    lambda = lcm(p - _ONE, q - _ONE)
    mu = modInv(L(modPow(g, lambda, n2), n), n)
  }

  const publicKey = new PublicKey(n, g)
  const privateKey = new PrivateKey(lambda, mu, publicKey, p, q)
  return { publicKey, privateKey }
}

/**
 * Generates a pair private, public key for the Paillier cryptosystem in synchronous mode.
 * Synchronous mode is NOT RECOMMENDED since it won't use workers and thus it'll be slower and may freeze thw window in browser's javascript.
 *
 * @param {number} [bitLength = 4096] - the bit length of the public modulo
 * @param {boolean} [simplevariant = false] - use the simple variant to compute the generator (g=n+1)
 *
 * @returns {KeyPair} - a {@link KeyPair} of public, private keys
 */
const generateRandomKeysSync = function (bitLength$1 = 4096, simpleVariant = false) {
  let p, q, n, g, lambda, mu
  // if p and q are bitLength/2 long ->  2**(bitLength - 2) <= n < 2**(bitLength)
  do {
    p = primeSync(Math.floor(bitLength$1 / 2) + 1)
    q = primeSync(Math.floor(bitLength$1 / 2))
    n = p * q
  } while (q === p || bitLength(n) !== bitLength$1)

  const phi = (p - _ONE) * (q - _ONE)

  const n2 = n ** BigInt(2)

  if (simpleVariant === true) {
    // If using p,q of equivalent length, a simpler variant of the key
    // generation steps would be to set
    // g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n)
    g = n + _ONE
    lambda = phi
    mu = modInv(lambda, n)
  } else {
    g = getGenerator(n, n2)
    lambda = lcm(p - _ONE, q - _ONE)
    mu = modInv(L(modPow(g, lambda, n2), n), n)
  }

  const publicKey = new PublicKey(n, g)
  const privateKey = new PrivateKey(lambda, mu, publicKey, p, q)
  return { publicKey, privateKey }
}

/**
 * Class for a Paillier public key
 */
const PublicKey = class PublicKey {
  /**
   * Creates an instance of class PaillierPublicKey
   * @param {bigint} n - the public modulo
   * @param {bigint | number} g - the public generator
   */
  constructor (n, g) {
    this.n = n
    this._n2 = this.n ** BigInt(2) // cache n^2
    this.g = BigInt(g)
  }

  /**
   * Get the bit length of the public modulo
   * @return {number} - bit length of the public modulo
   */
  get bitLength () {
    return bitLength(this.n)
  }

  /**
   * Paillier public-key encryption
   *
   * @param {bigint} m - a bigint representation of a cleartext message
   *
   * @returns {bigint} - the encryption of m with this public key
   */
  encrypt (m) {
    const r = randBetween(this.n)
    return (modPow(this.g, m, this._n2) * modPow(r, this.n, this._n2)) % this._n2
  }

  /**
   * Homomorphic addition
   *
   * @param {...bigint} ciphertexts - n >= 2 ciphertexts (c_1,..., c_n) that are the encryption of (m_1, ..., m_n) with this public key
   *
   * @returns {bigint} - the encryption of (m_1 + ... + m_2) with this public key
   */
  addition (...ciphertexts) {
    return ciphertexts.reduce((sum, next) => sum * next % (this._n2), _ONE)
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
    return modPow(BigInt(c), BigInt(k), this._n2)
  }
}

/**
 * Class for Paillier private keys.
 */
const PrivateKey = class PrivateKey {
  /**
   * Creates an instance of class PaillierPrivateKey
   *
   * @param {bigint} lambda
   * @param {bigint} mu
   * @param {PaillierPublicKey} publicKey
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
   * @return {number} - bit length of the public modulo
   */
  get bitLength () {
    return bitLength(this.publicKey.n)
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
    return (L(modPow(c, this.lambda, this.publicKey._n2), this.publicKey.n) * this.mu) % this.publicKey.n
  }
}

function L (a, n) {
  return (a - _ONE) / n
}

function getGenerator (n, n2 = modPow(n, 2)) {
  const alpha = randBetween(n)
  const beta = randBetween(n)
  return ((alpha * n + _ONE) * modPow(beta, n, n2)) % n2
}

export { PrivateKey, PublicKey, generateRandomKeys, generateRandomKeysSync }
