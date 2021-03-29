import * as bcu from 'bigint-crypto-utils'

/**
 * Class for a Paillier public key
 */
export default class PublicKey {
  readonly n: bigint
  readonly g: bigint

  readonly _n2: bigint

  /**
     * Creates an instance of class PublicKey
     * @param n - The public modulo
     * @param g - The public generator
     */
  constructor (n: bigint, g: bigint) {
    this.n = n
    this._n2 = this.n ** 2n // cache n^2
    this.g = g
  }

  /**
     * Get the bit length of the public modulo
     * @returns The bit length of the public modulo
     */
  get bitLength (): number {
    return bcu.bitLength(this.n)
  }

  /**
     * Paillier public-key encryption
     *
     * @param m - A bigint representation of a plaintext message
     * @param r - The random integer factor for encryption. By default is a random in (1,n)
     *
     * @returns The encryption of m with this public key
     */
  encrypt (m: bigint, r?: bigint): bigint {
    if (r === undefined) {
      do {
        r = bcu.randBetween(this.n)
      } while (bcu.gcd(r, this.n) !== 1n)
    }
    return (bcu.modPow(this.g, m, this._n2) * bcu.modPow(r, this.n, this._n2)) % this._n2
  }

  /**
     * Homomorphic addition
     *
     * @param ciphertexts - n >= 2 ciphertexts (c_1,..., c_n) that are the encryption of (m_1, ..., m_n) with this public key
     *
     * @returns The encryption of (m_1 + ... + m_2) with this public key
     */
  addition (...ciphertexts: Array<bigint>): bigint {
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
  multiply (c: bigint, k: bigint|number): bigint {
    return bcu.modPow(c, k, this._n2)
  }
}
