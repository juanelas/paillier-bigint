'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var bcu = require('bigint-crypto-utils');

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () {
                        return e[k];
                    }
                });
            }
        });
    }
    n['default'] = e;
    return Object.freeze(n);
}

var bcu__namespace = /*#__PURE__*/_interopNamespace(bcu);

/**
 * Class for a Paillier public key
 */
class PublicKey {
    /**
       * Creates an instance of class PublicKey
       * @param n - The public modulo
       * @param g - The public generator
       */
    constructor(n, g) {
        this.n = n;
        this._n2 = this.n ** 2n; // cache n^2
        this.g = g;
    }
    /**
       * Get the bit length of the public modulo
       * @returns The bit length of the public modulo
       */
    get bitLength() {
        return bcu__namespace.bitLength(this.n);
    }
    /**
       * Paillier public-key encryption
       *
       * @param m - A bigint representation of a plaintext message
       * @param r - The random integer factor for encryption. By default is a random in (1,n)
       *
       * @returns The encryption of m with this public key
       */
    encrypt(m, r) {
        if (r === undefined) {
            do {
                r = bcu__namespace.randBetween(this.n);
            } while (bcu__namespace.gcd(r, this.n) !== 1n);
        }
        return (bcu__namespace.modPow(this.g, m, this._n2) * bcu__namespace.modPow(r, this.n, this._n2)) % this._n2;
    }
    /**
       * Homomorphic addition
       *
       * @param ciphertexts - n >= 2 ciphertexts (c_1,..., c_n) that are the encryption of (m_1, ..., m_n) with this public key
       *
       * @returns The encryption of (m_1 + ... + m_2) with this public key
       */
    addition(...ciphertexts) {
        return ciphertexts.reduce((sum, next) => sum * next % (this._n2), 1n);
    }
    /**
       * Pseudo-homomorphic Paillier multiplication
       *
       * @param {bigint} c - a number m encrypted with this public key
       * @param {bigint | number} k - either a bigint or a number
       *
       * @returns {bigint} - the encryption of k·m with this public key
       */
    multiply(c, k) {
        return bcu__namespace.modPow(c, k, this._n2);
    }
}

/**
 * Class for Paillier private keys.
 */
class PrivateKey {
    /**
       * Creates an instance of class PrivateKey
       *
       * @param lambda
       * @param mu
       * @param publicKey
       * @param p - a big prime
       * @param q- a big prime
       */
    constructor(lambda, mu, publicKey, p, q) {
        this.lambda = lambda;
        this.mu = mu;
        this._p = p;
        this._q = q;
        this.publicKey = publicKey;
    }
    /**
     * Get the bit length of the public modulo
     * @returns The bit length of the public modulo
     */
    get bitLength() {
        return bcu__namespace.bitLength(this.publicKey.n);
    }
    /**
     * Get the public modulo n=p·q
     * @returns The public modulo n=p·q
     */
    get n() {
        return this.publicKey.n;
    }
    /**
     * Paillier private-key decryption
     *
     * @param c - A bigint encrypted with the public key
     *
     * @returns The decryption of c with this private key
     */
    decrypt(c) {
        return (L(bcu__namespace.modPow(c, this.lambda, this.publicKey._n2), this.publicKey.n) * this.mu) % this.publicKey.n;
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
    getRandomFactor(c) {
        if (this.publicKey.g !== this.n + 1n)
            throw RangeError('Cannot recover the random factor if publicKey.g != publicKey.n + 1. You should generate yout keys using the simple variant, e.g. generateRandomKeys(3072, true) )');
        if (this._p === undefined || this._q === undefined) {
            throw Error('Cannot get random factor without knowing p and q');
        }
        const m = this.decrypt(c);
        const phi = (this._p - 1n) * (this._q - 1n);
        const nInvModPhi = bcu__namespace.modInv(this.n, phi);
        const c1 = c * (1n - m * this.n) % this.publicKey._n2;
        return bcu__namespace.modPow(c1, nInvModPhi, this.n);
    }
}
function L(a, n) {
    return (a - 1n) / n;
}

/**
 * Generates a pair private, public key for the Paillier cryptosystem.
 *
 * @param bitlength - The bit length of the public modulo
 * @param simplevariant - Use the simple variant to compute the generator (g=n+1). This is REQUIRED if you want to be able to recover the random integer factor used when encrypting with the public key
 *
 * @returns A promise that resolves to a {@link KeyPair} of public, private keys
 */
async function generateRandomKeys(bitlength = 3072, simpleVariant = false) {
    let p, q, n, g, lambda, mu;
    // if p and q are bitLength/2 long ->  2**(bitLength - 2) <= n < 2**(bitLength)
    do {
        p = await bcu__namespace.prime(Math.floor(bitlength / 2) + 1);
        q = await bcu__namespace.prime(Math.floor(bitlength / 2));
        n = p * q;
    } while (q === p || bcu__namespace.bitLength(n) !== bitlength);
    if (simpleVariant) {
        // If using p,q of equivalent length, a simpler variant of the key
        // generation steps would be to set
        // g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n)
        g = n + 1n;
        lambda = (p - 1n) * (q - 1n);
        mu = bcu__namespace.modInv(lambda, n);
    }
    else {
        const n2 = n ** 2n;
        g = getGenerator(n, n2);
        lambda = bcu__namespace.lcm(p - 1n, q - 1n);
        mu = bcu__namespace.modInv(L(bcu__namespace.modPow(g, lambda, n2), n), n);
    }
    const publicKey = new PublicKey(n, g);
    const privateKey = new PrivateKey(lambda, mu, publicKey, p, q);
    return { publicKey, privateKey };
}
/**
 * Generates a pair private, public key for the Paillier cryptosystem in synchronous mode.
 * Synchronous mode is NOT RECOMMENDED since it won't use workers and thus it'll be slower and may freeze thw window in browser's javascript.
 *
 * @param bitlength - The bit length of the public modulo
 * @param simplevariant - Use the simple variant to compute the generator (g=n+1)
 *
 * @returns A pair of public, private keys
 */
function generateRandomKeysSync(bitlength = 3072, simpleVariant = false) {
    let p, q, n, g, lambda, mu;
    // if p and q are bitLength/2 long ->  2**(bitLength - 2) <= n < 2**(bitLength)
    do {
        p = bcu__namespace.primeSync(Math.floor(bitlength / 2) + 1);
        q = bcu__namespace.primeSync(Math.floor(bitlength / 2));
        n = p * q;
    } while (q === p || bcu__namespace.bitLength(n) !== bitlength);
    if (simpleVariant) {
        // If using p,q of equivalent length, a simpler variant of the key
        // generation steps would be to set
        // g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n)
        g = n + 1n;
        lambda = (p - 1n) * (q - 1n);
        mu = bcu__namespace.modInv(lambda, n);
    }
    else {
        const n2 = n ** 2n;
        g = getGenerator(n, n2);
        lambda = bcu__namespace.lcm(p - 1n, q - 1n);
        mu = bcu__namespace.modInv(L(bcu__namespace.modPow(g, lambda, n2), n), n);
    }
    const publicKey = new PublicKey(n, g);
    const privateKey = new PrivateKey(lambda, mu, publicKey, p, q);
    return { publicKey, privateKey };
}
function getGenerator(n, n2) {
    const alpha = bcu__namespace.randBetween(n);
    const beta = bcu__namespace.randBetween(n);
    return ((alpha * n + 1n) * bcu__namespace.modPow(beta, n, n2)) % n2;
}

exports.PrivateKey = PrivateKey;
exports.PublicKey = PublicKey;
exports.generateRandomKeys = generateRandomKeys;
exports.generateRandomKeysSync = generateRandomKeysSync;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgubm9kZS5janMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cy9QdWJsaWNLZXkudHMiLCIuLi8uLi9zcmMvdHMvUHJpdmF0ZUtleS50cyIsIi4uLy4uL3NyYy90cy9nZW5lcmF0ZVJhbmRvbUtleXMudHMiXSwic291cmNlc0NvbnRlbnQiOm51bGwsIm5hbWVzIjpbImJjdSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBOzs7TUFHcUIsU0FBUzs7Ozs7O0lBVzVCLFlBQWEsQ0FBUyxFQUFFLENBQVM7UUFDL0IsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDVixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0tBQ1g7Ozs7O0lBTUQsSUFBSSxTQUFTO1FBQ1gsT0FBT0EsY0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7S0FDN0I7Ozs7Ozs7OztJQVVELE9BQU8sQ0FBRSxDQUFTLEVBQUUsQ0FBVTtRQUM1QixJQUFJLENBQUMsS0FBSyxTQUFTLEVBQUU7WUFDbkIsR0FBRztnQkFDRCxDQUFDLEdBQUdBLGNBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO2FBQzVCLFFBQVFBLGNBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUM7U0FDcEM7UUFDRCxPQUFPLENBQUNBLGNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHQSxjQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFBO0tBQ3RG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
