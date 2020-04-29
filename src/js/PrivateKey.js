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

  /**
   * Recover the random factor used for encrypting a message with the complementary public key.
   * The recovery function only works if the public key generator g was using the simple variant
   * g = 1 + n
   *
   * @param {bigint} c - the encryption using the public of message m with random factor r
   *
   * @returns {bigint} - the random factor (mod n)
   *
   * @throws {RangeError} - Cannot recover the random factor if publicKey.g != publicKey.n + 1. You should generate yout keys using the simple variant, e.g. generateRandomKeys(3072, true) )
   */
  getRandomFactor (c) {
    if (this.publicKey.g !== this.n + 1n) throw RangeError('Cannot recover the random factor if publicKey.g != publicKey.n + 1. You should generate yout keys using the simple variant, e.g. generateRandomKeys(3072, true) )')
    const m = this.decrypt(c)
    const phi = (this._p - 1n) * (this._q - 1n)
    const nInvModPhi = bcu.modInv(this.n, phi)
    const c1 = c * (1n - m * this.n) % this.publicKey._n2
    return bcu.modPow(c1, nInvModPhi, this.n)
  }
}

export function L (a, n) {
  return (a - 1n) / n
}
