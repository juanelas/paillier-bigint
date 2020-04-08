export type KeyPair = {
    /**
     * - a Paillier's public key
     */
    publicKey: PublicKey;
    /**
     * - the associated Paillier's private key
     */
    privateKey: PrivateKey;
};
/**
 * Class for Paillier private keys.
 */
export class PrivateKey {
    /**
       * Creates an instance of class PrivateKey
       *
       * @param {bigint} lambda
       * @param {bigint} mu
       * @param {PublicKey} publicKey
       * @param {bigint} [p = null] - a big prime
       * @param {bigint} [q = null] - a big prime
       */
    constructor(lambda: bigint, mu: bigint, publicKey: PublicKey, p?: bigint, q?: bigint);
    lambda: bigint;
    mu: bigint;
    _p: bigint;
    _q: bigint;
    publicKey: PublicKey;
    /**
       * Get the bit length of the public modulo
       * @returns {number} - bit length of the public modulo
       */
    get bitLength(): number;
    /**
       * Get the public modulo n=p·q
       * @returns {bigint} - the public modulo n=p·q
       */
    get n(): bigint;
    /**
       * Paillier private-key decryption
       *
       * @param {bigint} c - a bigint encrypted with the public key
       *
       * @returns {bigint} - the decryption of c with this private key
       */
    decrypt(c: bigint): bigint;
}
/**
 * Class for a Paillier public key
 */
export class PublicKey {
    /**
       * Creates an instance of class PublicKey
       * @param {bigint} n - the public modulo
       * @param {bigint} g - the public generator
       */
    constructor(n: bigint, g: bigint);
    n: bigint;
    _n2: bigint;
    g: bigint;
    /**
       * Get the bit length of the public modulo
       * @returns {number} - bit length of the public modulo
       */
    get bitLength(): number;
    /**
       * Paillier public-key encryption
       *
       * @param {bigint} m - a bigint representation of a cleartext message
       *
       * @returns {bigint} - the encryption of m with this public key
       */
    encrypt(m: bigint): bigint;
    /**
       * Homomorphic addition
       *
       * @param {...bigint} ciphertexts - n >= 2 ciphertexts (c_1,..., c_n) that are the encryption of (m_1, ..., m_n) with this public key
       *
       * @returns {bigint} - the encryption of (m_1 + ... + m_2) with this public key
       */
    addition(...ciphertexts: bigint[]): bigint;
    /**
       * Pseudo-homomorphic Paillier multiplication
       *
       * @param {bigint} c - a number m encrypted with this public key
       * @param {bigint | number} k - either a bigint or a number
       *
       * @returns {bigint} - the encryption of k·m with this public key
       */
    multiply(c: bigint, k: number | bigint): bigint;
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
export function generateRandomKeys(bitlength?: number, simpleVariant?: boolean): Promise<KeyPair>;
/**
 * Generates a pair private, public key for the Paillier cryptosystem in synchronous mode.
 * Synchronous mode is NOT RECOMMENDED since it won't use workers and thus it'll be slower and may freeze thw window in browser's javascript.
 *
 * @param {number} [bitlength = 4096] - the bit length of the public modulo
 * @param {boolean} [simplevariant = false] - use the simple variant to compute the generator (g=n+1)
 *
 * @returns {KeyPair} - a {@link KeyPair} of public, private keys
 */
export function generateRandomKeysSync(bitlength?: number, simpleVariant?: boolean): KeyPair;
