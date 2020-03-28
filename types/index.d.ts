export type KeyPair = {
    /**
     * - a Paillier's public key
     */
    publicKey: {
        n: bigint;
        _n2: bigint;
        g: bigint;
        /**
         * Get the bit length of the public modulo
         * @return {number} - bit length of the public modulo
         */
        readonly bitLength: number;
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
    };
    /**
     * - the associated Paillier's private key
     */
    privateKey: {
        lambda: bigint;
        mu: bigint;
        _p: bigint;
        _q: bigint;
        publicKey: any;
        /**
         * Get the bit length of the public modulo
         * @return {number} - bit length of the public modulo
         */
        readonly bitLength: number;
        /**
         * Get the public modulo n=p·q
         * @returns {bigint} - the public modulo n=p·q
         */
        readonly n: bigint;
        /**
         * Paillier private-key decryption
         *
         * @param {bigint} c - a bigint encrypted with the public key
         *
         * @returns {bigint} - the decryption of c with this private key
         */
        decrypt(c: bigint): bigint;
    };
};
/**
 * Class for Paillier private keys.
 */
export const PrivateKey: {
    new (lambda: bigint, mu: bigint, publicKey: any, p?: bigint, q?: bigint): {
        lambda: bigint;
        mu: bigint;
        _p: bigint;
        _q: bigint;
        publicKey: any;
        /**
         * Get the bit length of the public modulo
         * @return {number} - bit length of the public modulo
         */
        readonly bitLength: number;
        /**
         * Get the public modulo n=p·q
         * @returns {bigint} - the public modulo n=p·q
         */
        readonly n: bigint;
        /**
         * Paillier private-key decryption
         *
         * @param {bigint} c - a bigint encrypted with the public key
         *
         * @returns {bigint} - the decryption of c with this private key
         */
        decrypt(c: bigint): bigint;
    };
};
/**
 * Class for a Paillier public key
 */
export const PublicKey: {
    new (n: bigint, g: number | bigint): {
        n: bigint;
        _n2: bigint;
        g: bigint;
        /**
         * Get the bit length of the public modulo
         * @return {number} - bit length of the public modulo
         */
        readonly bitLength: number;
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
    };
};
export function generateRandomKeys(bitLength$1?: number, simpleVariant?: boolean): Promise<KeyPair>;
export function generateRandomKeysSync(bitLength$1?: number, simpleVariant?: boolean): KeyPair;
