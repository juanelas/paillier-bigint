/**
 * Class for a Paillier public key
 */
declare class PublicKey {
    readonly n: bigint;
    readonly g: bigint;
    readonly _n2: bigint;
    /**
       * Creates an instance of class PublicKey
       * @param n - The public modulo
       * @param g - The public generator
       */
    constructor(n: bigint, g: bigint);
    /**
       * Get the bit length of the public modulo
       * @returns The bit length of the public modulo
       */
    get bitLength(): number;
    /**
       * Paillier public-key encryption
       *
       * @param m - A bigint representation of a plaintext message
       * @param r - The random integer factor for encryption. By default is a random in (1,n)
       *
       * @returns The encryption of m with this public key
       */
    encrypt(m: bigint, r?: bigint): bigint;
    /**
       * Homomorphic addition
       *
       * @param ciphertexts - n >= 2 ciphertexts (c_1,..., c_n) that are the encryption of (m_1, ..., m_n) with this public key
       *
       * @returns The encryption of (m_1 + ... + m_n) with this public key
       */
    addition(...ciphertexts: bigint[]): bigint;
    /**
       * Pseudo-homomorphic addition of plaintext to chipertext
       *
       * @param ciphertext - an encryption of m1 with this public key
       * @param plaintexts - 1 or more plaintexts (m_2, ..., m_n)
       *
       * @returns The encryption of (m_1 + ... + m_n) with this public key
       */
    plaintextAddition(ciphertext: bigint, ...plaintexts: bigint[]): bigint;
    /**
       * Pseudo-homomorphic Paillier multiplication
       *
       * @param {bigint} c - a number m encrypted with this public key
       * @param {bigint | number} k - either a bigint or a number
       *
       * @returns {bigint} - the encryption of k·m with this public key
       */
    multiply(c: bigint, k: bigint | number): bigint;
}

/**
 * Class for Paillier private keys.
 */
declare class PrivateKey {
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
     * g = 1 + n (see {@link generateRandomKeys})
     * It is also necessary to know p and q (usually stored in the private key)
     *
     * @param c - The encryption of message m using a Paillier's {@link PublicKey} and random factor r
     *
     * @returns The random factor r (mod n)
     *
     * @throws {@link RangeError}
     * Cannot recover the random factor if publicKey.g != publicKey.n + 1. You should generate yout keys using the simple variant, e.g. generateRandomKeys(3072, true)  (see {@link generateRandomKeys})
     *
     * @throws {@link Error}
     * Cannot get random factor without knowing p and q
     *
     */
    getRandomFactor(c: bigint): bigint;
}

interface KeyPair {
    publicKey: PublicKey;
    privateKey: PrivateKey;
}
/**
 * Generates a pair of private and public key for the Paillier cryptosystem.
 *
 * @param bitlength - The bit length of the public modulo
 * @param simpleVariant - Since generated p and q are of equivalent length, a simpler variant of the key generation steps would be to set g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n). This is REQUIRED if you want to be able to recover the random integer factor used when encrypting with the public key using the {@link PrivateKey.getRandomFactor} method
 *
 * @returns A promise that resolves to a {@link KeyPair} holding a public and a private key
 */
declare function generateRandomKeys(bitlength?: number, simpleVariant?: boolean): Promise<KeyPair>;
/**
 * Generates a pair of private and public key for the Paillier cryptosystem in synchronous mode.
 * Synchronous mode is NOT RECOMMENDED since it won't use workers and thus it'll be slower and may freeze thw window in browser's javascript.
 *
 * @param bitlength - The bit length of the public modulo
 * @param simpleVariant - Since generated p and q are of equivalent length, a simpler variant of the key generation steps would be to set g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n). This is REQUIRED if you want to be able to recover the random integer factor used when encrypting with the public key using the {@link PrivateKey.getRandomFactor} method.
 *
 * @returns A {@link KeyPair} with a public and a private key
 */
declare function generateRandomKeysSync(bitlength?: number, simpleVariant?: boolean): KeyPair;

export { KeyPair, PrivateKey, PublicKey, generateRandomKeys, generateRandomKeysSync };
