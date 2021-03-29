import * as bcu from 'bigint-crypto-utils'
import PublicKey from './PublicKey'

/**
 * Class for Paillier private keys.
 */
export default class PrivateKey {
  readonly lambda: bigint
  readonly mu: bigint
  readonly publicKey: PublicKey
  private readonly _p?: bigint
  private readonly _q?: bigint

  /**
     * Creates an instance of class PrivateKey
     *
     * @param lambda
     * @param mu
     * @param publicKey
     * @param p - a big prime
     * @param q- a big prime
     */
  constructor (lambda: bigint, mu: bigint, publicKey: PublicKey, p?: bigint, q?: bigint) {
    this.lambda = lambda
    this.mu = mu
    this._p = p
    this._q = q
    this.publicKey = publicKey
  }

  /**
   * Get the bit length of the public modulo
   * @returns The bit length of the public modulo
   */
  get bitLength (): number {
    return bcu.bitLength(this.publicKey.n)
  }

  /**
   * Get the public modulo n=p·q
   * @returns The public modulo n=p·q
   */
  get n (): bigint {
    return this.publicKey.n
  }

  /**
   * Paillier private-key decryption
   *
   * @param c - A bigint encrypted with the public key
   *
   * @returns The decryption of c with this private key
   */
  decrypt (c: bigint): bigint {
    return (L(bcu.modPow(c, this.lambda, this.publicKey._n2), this.publicKey.n) * this.mu) % this.publicKey.n
  }

  /**
   * Recover the random factor used for encrypting a message with the complementary public key.
   * The recovery function only works if the public key generator g was using the simple variant
   * g = 1 + n
   * It is also necessary to know p and q (usually stored in the private key)
   *
   * @param c - The encryption using the public of message m with random factor r
   *
   * @returns The random factor (mod n)
   *
   * @throws {RangeError}
   * Cannot recover the random factor if publicKey.g != publicKey.n + 1. You should generate yout keys using the simple variant, e.g. generateRandomKeys(3072, true) )
   *
   * @throws {Error}
   * Cannot get random factor without knowing p and q
   *
   */
  getRandomFactor (c: bigint): bigint {
    if (this.publicKey.g !== this.n + 1n) throw RangeError('Cannot recover the random factor if publicKey.g != publicKey.n + 1. You should generate yout keys using the simple variant, e.g. generateRandomKeys(3072, true) )')
    if (this._p === undefined || this._q === undefined) {
      throw Error('Cannot get random factor without knowing p and q')
    }
    const m = this.decrypt(c)
    const phi = (this._p - 1n) * (this._q - 1n)
    const nInvModPhi = bcu.modInv(this.n, phi)
    const c1 = c * (1n - m * this.n) % this.publicKey._n2
    return bcu.modPow(c1, nInvModPhi, this.n)
  }
}

export function L (a: bigint, n: bigint): bigint {
  return (a - 1n) / n
}
