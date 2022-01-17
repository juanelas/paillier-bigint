/**
 * Class for a Paillier public key
 */
export default class PublicKey {
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
    addition(...ciphertexts: Array<bigint>): bigint;
    /**
       * Pseudo-homomorphic addition of plaintext to chipertext
       *
       * @param ciphertext - an encryption of m1 with this public key
       * @param plaintexts - 1 or more plaintexts (m_2, ..., m_n)
       *
       * @returns The encryption of (m_1 + ... + m_n) with this public key
       */
    plaintextAddition(ciphertext: bigint, ...plaintexts: Array<bigint>): bigint;
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
//# sourceMappingURL=PublicKey.d.ts.map