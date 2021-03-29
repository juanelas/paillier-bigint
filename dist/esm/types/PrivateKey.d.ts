import PublicKey from './PublicKey';
/**
 * Class for Paillier private keys.
 */
export default class PrivateKey {
    readonly lambda: bigint;
    readonly mu: bigint;
    readonly publicKey: PublicKey;
    private readonly _p?;
    private readonly _q?;
    /**
       * Creates an instance of class PrivateKey
       *
       * @param lambda
       * @param mu
       * @param publicKey
       * @param p - a big prime
       * @param q- a big prime
       */
    constructor(lambda: bigint, mu: bigint, publicKey: PublicKey, p?: bigint, q?: bigint);
    /**
     * Get the bit length of the public modulo
     * @returns The bit length of the public modulo
     */
    get bitLength(): number;
    /**
     * Get the public modulo n=p·q
     * @returns The public modulo n=p·q
     */
    get n(): bigint;
    /**
     * Paillier private-key decryption
     *
     * @param c - A bigint encrypted with the public key
     *
     * @returns The decryption of c with this private key
     */
    decrypt(c: bigint): bigint;
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
    getRandomFactor(c: bigint): bigint;
}
export declare function L(a: bigint, n: bigint): bigint;
//# sourceMappingURL=PrivateKey.d.ts.map