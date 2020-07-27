import * as bcu from 'bigint-crypto-utils'

/**
 * Class for a Paillier public key
 */
export default class PublicKey {
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
     * @param {bigint} [r] - the random integer factor for encryption. By default is a random in (1,n)
     *
     * @returns {bigint} - the encryption of m with this public key
     */
  encrypt (m, r = null) {
    if (r === null) {
      do {
        r = bcu.randBetween(this.n)
      } while (bcu.gcd(r, this.n) !== 1n)
    }
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
