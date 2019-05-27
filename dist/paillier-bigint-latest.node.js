'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var bcu = require('bigint-crypto-utils');

const _ONE = BigInt(1);

/**
 * @typedef {Object} KeyPair
 * @property {PublicKey} publicKey - a Paillier's public key
 * @property {PrivateKey} privateKey - the associated Paillier's private key
 */

/**
 * Generates a pair private, public key for the Paillier cryptosystem in synchronous mode
 * 
 * @param {number} bitLength - the bit lenght of the public modulo
 * @param {boolean} simplevariant - use the simple variant to compute the generator
 * 
 * @returns {Promise} - a promise that resolves to a {@link KeyPair} of public, private keys
 */
const generateRandomKeys = async function (bitLength = 4096, simpleVariant = false) {
    let p, q, n, phi, n2, g, lambda, mu;
    // if p and q are bitLength/2 long ->  2**(bitLength - 2) <= n < 2**(bitLenght) 
    do {
        p = await bcu.prime(Math.floor(bitLength / 2) + 1);
        q = await bcu.prime(Math.floor(bitLength / 2));
        n = p * q;
    } while (q === p || bcu.bitLength(n) != bitLength);

    phi = (p - _ONE) * (q - _ONE);

    n2 = n ** BigInt(2);

    if (simpleVariant === true) {
        //If using p,q of equivalent length, a simpler variant of the key
        // generation steps would be to set
        // g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n)
        g = n + _ONE;
        lambda = phi;
        mu = bcu.modInv(lambda, n);
    } else {
        g = getGenerator(n, n2);
        lambda = bcu.lcm(p - _ONE, q - _ONE);
        mu = bcu.modInv(L(bcu.modPow(g, lambda, n2), n), n);
    }

    const publicKey = new PublicKey(n, g);
    const privateKey = new PrivateKey(lambda, mu, p, q, publicKey);
    return { publicKey: publicKey, privateKey: privateKey };
};

/**
 * Class for a Paillier public key
 */
const PublicKey = class PublicKey {
    /**
    * Creates an instance of class PaillierPublicKey
    * @param {bigint | stringBase10 | number} n - the public modulo
    * @param {bigint | stringBase10 | number} g - the public generator
     */
    constructor(n, g) {
        this.n = BigInt(n);
        this._n2 = this.n ** BigInt(2); // cache n^2
        this.g = BigInt(g);
    }

    /**
     * Get the bit length of the public modulo
     * @return {number} - bit length of the public modulo
     */
    get bitLength() {
        return bcu.bitLength(this.n);
    }

    /**
     * Paillier public-key encryption
     * 
     * @param {bigint | stringBase10 | number} m - a cleartext number
     * 
     * @returns {bigint} - the encryption of m with this public key
     */
    encrypt(m) {
        let r;
        r = bcu.randBetween(this.n);
        return (bcu.modPow(this.g, m, this._n2) * bcu.modPow(r, this.n, this._n2)) % this._n2;
    }

    /**
     * Homomorphic addition
     * 
     * @param {...bigints} - 2 or more (big) numbers (m_1,..., m_n) encrypted with this public key
     * 
     * @returns {bigint} - the encryption of (m_1 + ... + m_2) with this public key
     */
    addition(...ciphertexts) { // ciphertexts of numbers
        return ciphertexts.reduce((sum, next) => sum * BigInt(next) % (this._n2), _ONE);
    }

    /**
     * Pseudo-homomorphic paillier multiplication
     * 
     * @param {bigint} c - a number m encrypted with this public key
     * @param {bigint | stringBase10 | number} k - either a cleartext message (number) or a scalar
     * 
     * @returns {bigint} - the ecnryption of k·m with this public key
     */
    multiply(c, k) { // c is ciphertext. k is either a cleartext message (number) or a scalar
        if (typeof k === 'string')
            k = BigInt(k);
        return bcu.modPow(BigInt(c), k, this._n2);
    }
};

/**
 * Class for Paillier private keys.
 */
const PrivateKey = class PrivateKey {
    /**
     * Creates an instance of class PaillierPrivateKey
     * 
     * @param {bigint | stringBase10 | number} lambda 
     * @param {bigint | stringBase10 | number} mu 
     * @param {bigint | stringBase10 | number} p - a big prime
     * @param {bigint | stringBase10 | number} q - a big prime
     * @param {PaillierPublicKey} publicKey
     */
    constructor(lambda, mu, p, q, publicKey) {
        this.lambda = BigInt(lambda);
        this.mu = BigInt(mu);
        this._p = BigInt(p);
        this._q = BigInt(q);
        this.publicKey = publicKey;
    }

    /**
     * Get the bit length of the public modulo
     * @return {number} - bit length of the public modulo
     */
    get bitLength() {
        return bcu.bitLength(this.publicKey.n);
    }

    /**
     * Get the public modulo n=p·q
     * @returns {bigint} - the public modulo n=p·q
     */
    get n() {
        return this.publicKey.n;
    }

    /**
     * Paillier private-key decryption
     * 
     * @param {bigint | stringBase10} c - a (big) number encrypted with the public key
     * 
     * @returns {bigint} - the decryption of c with this private key
     */
    decrypt(c) {
        return (L(bcu.modPow(BigInt(c), this.lambda, this.publicKey._n2), this.publicKey.n) * this.mu) % this.publicKey.n;
    }
};

function L(a, n) {
    return (a - _ONE) / n;
}

function getGenerator(n, n2 = bcu.modPow(n, 2)) {
    const alpha = bcu.randBetween(n);
    const beta = bcu.randBetween(n);
    return ((alpha * n + _ONE) * bcu.modPow(beta, n, n2)) % n2;
}

exports.PrivateKey = PrivateKey;
exports.PublicKey = PublicKey;
exports.generateRandomKeys = generateRandomKeys;
