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
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n["default"] = e;
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
       * @returns The encryption of (m_1 + ... + m_n) with this public key
       */
    addition(...ciphertexts) {
        return ciphertexts.reduce((sum, next) => sum * next % this._n2, 1n);
    }
    /**
       * Pseudo-homomorphic addition of plaintext to chipertext
       *
       * @param ciphertext - an encryption of m1 with this public key
       * @param plaintexts - 1 or more plaintexts (m_2, ..., m_n)
       *
       * @returns The encryption of (m_1 + ... + m_n) with this public key
       */
    plaintextAddition(ciphertext, ...plaintexts) {
        return plaintexts.reduce((sum, next) => sum * bcu__namespace.modPow(this.g, next, this._n2) % this._n2, ciphertext);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgubm9kZS5janMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cy9QdWJsaWNLZXkudHMiLCIuLi8uLi9zcmMvdHMvUHJpdmF0ZUtleS50cyIsIi4uLy4uL3NyYy90cy9nZW5lcmF0ZVJhbmRvbUtleXMudHMiXSwic291cmNlc0NvbnRlbnQiOm51bGwsIm5hbWVzIjpbImJjdSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQTs7QUFFRztBQUNXLE1BQU8sU0FBUyxDQUFBO0FBTTVCOzs7O0FBSUs7SUFDTCxXQUFhLENBQUEsQ0FBUyxFQUFFLENBQVMsRUFBQTtBQUMvQixRQUFBLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ1YsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUN2QixRQUFBLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0tBQ1g7QUFFRDs7O0FBR0s7QUFDTCxJQUFBLElBQUksU0FBUyxHQUFBO1FBQ1gsT0FBT0EsY0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7S0FDN0I7QUFFRDs7Ozs7OztBQU9LO0lBQ0wsT0FBTyxDQUFFLENBQVMsRUFBRSxDQUFVLEVBQUE7UUFDNUIsSUFBSSxDQUFDLEtBQUssU0FBUyxFQUFFO1lBQ25CLEdBQUc7Z0JBQ0QsQ0FBQyxHQUFHQSxjQUFHLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUM1QixhQUFBLFFBQVFBLGNBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUM7QUFDcEMsU0FBQTtBQUNELFFBQUEsT0FBTyxDQUFDQSxjQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBR0EsY0FBRyxDQUFDLE1BQU0s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RSxDQUFDLENBQUMsQ0FBQTtBQUNwRCxLQUFBO0lBRUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO0FBQ3JDLElBQUEsTUFBTSxVQUFVLEdBQUcsSUFBSSxVQUFVLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO0FBQzlELElBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsQ0FBQTtBQUNsQyxDQUFDO0FBRUQsU0FBUyxZQUFZLENBQUUsQ0FBUyxFQUFFLEVBQVUsRUFBQTtJQUMxQyxNQUFNLEtBQUssR0FBR0EsY0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNoQyxNQUFNLElBQUksR0FBR0EsY0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUMvQixPQUFPLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSUEsY0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUMxRDs7Ozs7OzsifQ==
