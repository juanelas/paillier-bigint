import * as bcu from 'bigint-crypto-utils'

/**
 * Class for Paillier private keys.
 */
export default class PrivateKey {
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

export function L (a, n) {
  return (a - 1n) / n
}
