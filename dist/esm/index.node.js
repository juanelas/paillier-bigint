import * as bcu from 'bigint-crypto-utils';

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
        return bcu.bitLength(this.n);
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
                r = bcu.randBetween(this.n);
            } while (bcu.gcd(r, this.n) !== 1n);
        }
        return (bcu.modPow(this.g, m, this._n2) * bcu.modPow(r, this.n, this._n2)) % this._n2;
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
        return plaintexts.reduce((sum, next) => sum * bcu.modPow(this.g, next, this._n2) % this._n2, ciphertext);
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
        return bcu.modPow(c, k, this._n2);
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
        return bcu.bitLength(this.publicKey.n);
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
        return (L(bcu.modPow(c, this.lambda, this.publicKey._n2), this.publicKey.n) * this.mu) % this.publicKey.n;
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
        const nInvModPhi = bcu.modInv(this.n, phi);
        const c1 = c * (1n - m * this.n) % this.publicKey._n2;
        return bcu.modPow(c1, nInvModPhi, this.n);
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
        p = await bcu.prime(Math.floor(bitlength / 2) + 1);
        q = await bcu.prime(Math.floor(bitlength / 2));
        n = p * q;
    } while (q === p || bcu.bitLength(n) !== bitlength);
    if (simpleVariant) {
        // If using p,q of equivalent length, a simpler variant of the key
        // generation steps would be to set
        // g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n)
        g = n + 1n;
        lambda = (p - 1n) * (q - 1n);
        mu = bcu.modInv(lambda, n);
    }
    else {
        const n2 = n ** 2n;
        g = getGenerator(n, n2);
        lambda = bcu.lcm(p - 1n, q - 1n);
        mu = bcu.modInv(L(bcu.modPow(g, lambda, n2), n), n);
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
        p = bcu.primeSync(Math.floor(bitlength / 2) + 1);
        q = bcu.primeSync(Math.floor(bitlength / 2));
        n = p * q;
    } while (q === p || bcu.bitLength(n) !== bitlength);
    if (simpleVariant) {
        // If using p,q of equivalent length, a simpler variant of the key
        // generation steps would be to set
        // g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n)
        g = n + 1n;
        lambda = (p - 1n) * (q - 1n);
        mu = bcu.modInv(lambda, n);
    }
    else {
        const n2 = n ** 2n;
        g = getGenerator(n, n2);
        lambda = bcu.lcm(p - 1n, q - 1n);
        mu = bcu.modInv(L(bcu.modPow(g, lambda, n2), n), n);
    }
    const publicKey = new PublicKey(n, g);
    const privateKey = new PrivateKey(lambda, mu, publicKey, p, q);
    return { publicKey, privateKey };
}
function getGenerator(n, n2) {
    const alpha = bcu.randBetween(n);
    const beta = bcu.randBetween(n);
    return ((alpha * n + 1n) * bcu.modPow(beta, n, n2)) % n2;
}

export { PrivateKey, PublicKey, generateRandomKeys, generateRandomKeysSync };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgubm9kZS5qcyIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3RzL1B1YmxpY0tleS50cyIsIi4uLy4uL3NyYy90cy9Qcml2YXRlS2V5LnRzIiwiLi4vLi4vc3JjL3RzL2dlbmVyYXRlUmFuZG9tS2V5cy50cyJdLCJzb3VyY2VzQ29udGVudCI6bnVsbCwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7QUFFRztBQUNXLE1BQU8sU0FBUyxDQUFBO0FBTTVCOzs7O0FBSUs7SUFDTCxXQUFhLENBQUEsQ0FBUyxFQUFFLENBQVMsRUFBQTtBQUMvQixRQUFBLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ1YsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUN2QixRQUFBLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0tBQ1g7QUFFRDs7O0FBR0s7QUFDTCxJQUFBLElBQUksU0FBUyxHQUFBO1FBQ1gsT0FBTyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUM3QjtBQUVEOzs7Ozs7O0FBT0s7SUFDTCxPQUFPLENBQUUsQ0FBUyxFQUFFLENBQVUsRUFBQTtRQUM1QixJQUFJLENBQUMsS0FBSyxTQUFTLEVBQUU7WUFDbkIsR0FBRztnQkFDRCxDQUFDLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDNUIsYUFBQSxRQUFRLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUM7QUFDcEMsU0FBQTtBQUNELFFBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUs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QUUxRSxHQUFHO0FBQ0QsUUFBQSxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUNoRCxRQUFBLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDNUMsUUFBQSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNWLEtBQUEsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUyxFQUFDO0FBRW5ELElBQUEsSUFBSSxhQUFhLEVBQUU7Ozs7QUFJakIsUUFBQSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUNWLFFBQUEsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUE7UUFDNUIsRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFBO0FBQzNCLEtBQUE7QUFBTSxTQUFBO0FBQ0wsUUFBQSxNQUFNLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQ2xCLFFBQUEsQ0FBQyxHQUFHLFlBQVksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7QUFDdkIsUUFBQSxNQUFNLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQTtRQUNoQyxFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO0FBQ3BELEtBQUE7SUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFDckMsSUFBQSxNQUFNLFVBQVUsR0FBRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFDOUQsSUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxDQUFBO0FBQ2xDLENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBRSxDQUFTLEVBQUUsRUFBVSxFQUFBO0lBQzFDLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDaEMsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUMvQixPQUFPLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFBO0FBQzFEOzs7OyJ9
