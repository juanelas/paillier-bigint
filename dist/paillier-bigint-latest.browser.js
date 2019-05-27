var paillierBigint = (function (exports) {
    'use strict';

    const _ZERO = BigInt(0);
    const _ONE = BigInt(1);
    const _TWO = BigInt(2);


    /**
     * Absolute value. abs(a)==a if a>=0. abs(a)==-a if a<0
     *  
     * @param {number|bigint} a 
     * 
     * @returns {bigint} the absolute value of a
     */
    function abs(a) {
        a = BigInt(a);
        return (a >= _ZERO) ? a : -a;
    }

    /**
     * Returns the bitlength of a number
     * 
     * @param {number|bigint} a  
     * @returns {number} - the bit length
     */
    function bitLength(a) {
        a = BigInt(a);
        if (a === _ONE)
            return 1;
        let bits = 1;
        do {
            bits++;
        } while ((a >>= _ONE) > _ONE);
        return bits;
    }

    /**
     * @typedef {Object} egcdReturn A triple (g, x, y), such that ax + by = g = gcd(a, b).
     * @property {bigint} g
     * @property {bigint} x 
     * @property {bigint} y
     */
    /**
     * An iterative implementation of the extended euclidean algorithm or extended greatest common divisor algorithm. 
     * Take positive integers a, b as input, and return a triple (g, x, y), such that ax + by = g = gcd(a, b).
     * 
     * @param {number|bigint} a 
     * @param {number|bigint} b 
     * 
     * @returns {egcdReturn} A triple (g, x, y), such that ax + by = g = gcd(a, b).
     */
    function eGcd(a, b) {
        a = BigInt(a);
        b = BigInt(b);
        if (a <= _ZERO | b <= _ZERO)
            return NaN; // a and b MUST be positive

        let x = _ZERO;
        let y = _ONE;
        let u = _ONE;
        let v = _ZERO;

        while (a !== _ZERO) {
            let q = b / a;
            let r = b % a;
            let m = x - (u * q);
            let n = y - (v * q);
            b = a;
            a = r;
            x = u;
            y = v;
            u = m;
            v = n;
        }
        return {
            b: b,
            x: x,
            y: y
        };
    }

    /**
     * Greatest-common divisor of two integers based on the iterative binary algorithm.
     * 
     * @param {number|bigint} a 
     * @param {number|bigint} b 
     * 
     * @returns {bigint} The greatest common divisor of a and b
     */
    function gcd(a, b) {
        a = abs(a);
        b = abs(b);
        if (a === _ZERO)
            return b;
        else if (b === _ZERO)
            return a;

        let shift = _ZERO;
        while (!((a | b) & _ONE)) {
            a >>= _ONE;
            b >>= _ONE;
            shift++;
        }
        while (!(a & _ONE)) a >>= _ONE;
        do {
            while (!(b & _ONE)) b >>= _ONE;
            if (a > b) {
                let x = a;
                a = b;
                b = x;
            }
            b -= a;
        } while (b);

        // rescale
        return a << shift;
    }

    /**
     * The test first tries if any of the first 250 small primes are a factor of the input number and then passes several 
     * iterations of Miller-Rabin Probabilistic Primality Test (FIPS 186-4 C.3.1)
     * 
     * @param {number|bigint} w An integer to be tested for primality
     * @param {number} iterations The number of iterations for the primality test. The value shall be consistent with Table C.1, C.2 or C.3
     * 
     * @return {Promise} A promise that resolves to a boolean that is either true (a probably prime number) or false (definitely composite)
     */
    async function isProbablyPrime(w, iterations = 16) {
        if (typeof w === 'number') {
            w = BigInt(w);
        }
        { // browser
            return new Promise((resolve, reject) => {
                let worker = new Worker(_isProbablyPrimeWorkerUrl());

                worker.onmessage = (event) => {
                    worker.terminate();
                    resolve(event.data.isPrime);
                };

                worker.onmessageerror = (event) => {
                    reject(event);
                };

                worker.postMessage({
                    'rnd': w,
                    'iterations': iterations,
                    'id': 0
                });
            });
        }
    }

    /**
     * The least common multiple computed as abs(a*b)/gcd(a,b)
     * @param {number|bigint} a 
     * @param {number|bigint} b 
     * 
     * @returns {bigint} The least common multiple of a and b
     */
    function lcm(a, b) {
        a = BigInt(a);
        b = BigInt(b);
        if (a === _ZERO && b === _ZERO)
            return _ZERO;
        return abs(a * b) / gcd(a, b);
    }

    /**
     * Modular inverse.
     * 
     * @param {number|bigint} a The number to find an inverse for
     * @param {number|bigint} n The modulo
     * 
     * @returns {bigint} the inverse modulo n or NaN if it does not exist
     */
    function modInv(a, n) {
        if (a == _ZERO | n <= _ZERO)
            return NaN;

        let egcd = eGcd(toZn(a, n), n);
        if (egcd.b !== _ONE) {
            return NaN; // modular inverse does not exist
        } else {
            return toZn(egcd.x, n);
        }
    }

    /**
     * Modular exponentiation a**b mod n
     * @param {number|bigint} a base
     * @param {number|bigint} b exponent
     * @param {number|bigint} n modulo
     * 
     * @returns {bigint} a**b mod n
     */
    function modPow(a, b, n) {
        // See Knuth, volume 2, section 4.6.3.
        n = BigInt(n);
        if (n === _ZERO)
            return NaN;

        a = toZn(a, n);
        b = BigInt(b);
        if (b < _ZERO) {
            return modInv(modPow(a, abs(b), n), n);
        }
        let result = _ONE;
        let x = a;
        while (b > 0) {
            var leastSignificantBit = b % _TWO;
            b = b / _TWO;
            if (leastSignificantBit == _ONE) {
                result = result * x;
                result = result % n;
            }
            x = x * x;
            x = x % n;
        }
        return result;
    }

    /**
     * A probably-prime (Miller-Rabin), cryptographically-secure, random-number generator. 
     * The browser version uses web workers to parallelise prime look up. Therefore, it does not lock the UI 
     * main process, and it can be much faster (if several cores or cpu are available). 
     * The node version can also use worker_threads if they are available (enabled by default with Node 11 and 
     * and can be enabled at runtime executing node --experimental-worker with node >=10.5.0).
     * 
     * @param {number} bitLength The required bit length for the generated prime
     * @param {number} iterations The number of iterations for the Miller-Rabin Probabilistic Primality Test
     * 
     * @returns {Promise} A promise that resolves to a bigint probable prime of bitLength bits
     */
    function prime(bitLength, iterations = 16) {
        if (bitLength < 1)
            throw new RangeError(`bitLength MUST be > 0 and it is ${bitLength}`);
        return new Promise((resolve) => {
            let workerList = [];
            const _onmessage = (msg, newWorker) => {
                if (msg.isPrime) {
                    // if a prime number has been found, stop all the workers, and return it
                    for (let j = 0; j < workerList.length; j++) {
                        workerList[j].terminate();
                    }
                    while (workerList.length) {
                        workerList.pop();
                    }
                    resolve(msg.value);
                } else { // if a composite is found, make the worker test another random number
                    let buf = randBits(bitLength, true);
                    let rnd = fromBuffer(buf);
                    try {
                        newWorker.postMessage({
                            'rnd': rnd,
                            'iterations': iterations,
                            'id': msg.id
                        });
                    } catch (error) {
                        // The worker has already terminated. There is nothing to handle here
                    }
                }
            };
            { //browser
                let workerURL = _isProbablyPrimeWorkerUrl();
                for (let i = 0; i < self.navigator.hardwareConcurrency; i++) {
                    let newWorker = new Worker(workerURL);
                    newWorker.onmessage = (event) => _onmessage(event.data, newWorker);
                    workerList.push(newWorker);
                }
            }
            for (let i = 0; i < workerList.length; i++) {
                let buf = randBits(bitLength, true);
                let rnd = fromBuffer(buf);
                workerList[i].postMessage({
                    'rnd': rnd,
                    'iterations': iterations,
                    'id': i
                });
            }
        });
    }

    /**
     * Returns a cryptographically secure random integer between [min,max]
     * @param {bigint} max Returned value will be <= max
     * @param {bigint} min Returned value will be >= min
     * 
     * @returns {bigint} A cryptographically secure random bigint between [min,max]
     */
    function randBetween(max, min = _ONE) {
        if (max <= min) throw new Error('max must be > min');
        const interval = max - min;
        let bitLen = bitLength(interval);
        let rnd;
        do {
            let buf = randBits(bitLen);
            rnd = fromBuffer(buf);
        } while (rnd > interval);
        return rnd + min;
    }

    /**
     * Secure random bits for both node and browsers. Node version uses crypto.randomFill() and browser one self.crypto.getRandomValues()
     * 
     * @param {number} bitLength The desired number of random bits
     * @param {boolean} forceLength If we want to force the output to have a specific bit length. It basically forces the msb to be 1
     * 
     * @returns {Buffer|Uint8Array} A Buffer/UInt8Array (Node.js/Browser) filled with cryptographically secure random bits
     */
    function randBits(bitLength, forceLength = false) {
        if (bitLength < 1)
            throw new RangeError(`bitLength MUST be > 0 and it is ${bitLength}`);

        const byteLength = Math.ceil(bitLength / 8);
        let rndBytes = randBytesSync(byteLength, false);
        // Fill with 0's the extra bits
        rndBytes[0] = rndBytes[0] & (2 ** (bitLength % 8) - 1);
        if (forceLength) {
            let mask = (bitLength % 8) ? 2 ** ((bitLength % 8) - 1) : 128;
            rndBytes[0] = rndBytes[0] | mask;
        }
        return rndBytes;
    }

    /**
     * Secure random bytes for both node and browsers. Node version uses crypto.randomFill() and browser one self.crypto.getRandomValues()
     * 
     * @param {number} byteLength The desired number of random bytes
     * @param {boolean} forceLength If we want to force the output to have a bit length of 8*byteLength. It basically forces the msb to be 1
     * 
     * @returns {Buffer|Uint8Array} A Buffer/UInt8Array (Node.js/Browser) filled with cryptographically secure random bytes
     */
    function randBytesSync(byteLength, forceLength = false) {
        if (byteLength < 1)
            throw new RangeError(`byteLength MUST be > 0 and it is ${byteLength}`);

        let buf;
        { // browser
            buf = new Uint8Array(byteLength);
            self.crypto.getRandomValues(buf);
        }
        // If fixed length is required we put the first bit to 1 -> to get the necessary bitLength
        if (forceLength)
            buf[0] = buf[0] | 128;
        return buf;
    }

    /**
     * Finds the smallest positive element that is congruent to a in modulo n
     * @param {number|bigint} a An integer
     * @param {number|bigint} n The modulo
     * 
     * @returns {bigint} The smallest positive representation of a in modulo n
     */
    function toZn(a, n) {
        n = BigInt(n);
        if (n <= 0)
            return NaN;

        a = BigInt(a) % n;
        return (a < 0) ? a + n : a;
    }



    /* HELPER FUNCTIONS */

    function fromBuffer(buf) {
        let ret = _ZERO;
        for (let i of buf.values()) {
            let bi = BigInt(i);
            ret = (ret << BigInt(8)) + bi;
        }
        return ret;
    }

    function _isProbablyPrimeWorkerUrl() {
        // Let's us first add all the required functions
        let workerCode = `'use strict';const _ZERO = BigInt(0);const _ONE = BigInt(1);const _TWO = BigInt(2);const eGcd = ${eGcd.toString()};const modInv = ${modInv.toString()};const modPow = ${modPow.toString()};const toZn = ${toZn.toString()};const randBits = ${randBits.toString()};const randBytesSync = ${randBytesSync.toString()};const randBetween = ${randBetween.toString()};const isProbablyPrime = ${_isProbablyPrime.toString()};${bitLength.toString()}${fromBuffer.toString()}`;

        const onmessage = async function (event) { // Let's start once we are called
            // event.data = {rnd: <bigint>, iterations: <number>}
            const isPrime = await isProbablyPrime(event.data.rnd, event.data.iterations);
            postMessage({
                'isPrime': isPrime,
                'value': event.data.rnd,
                'id': event.data.id
            });
        };

        workerCode += `onmessage = ${onmessage.toString()};`;

        return _workerUrl(workerCode);
    }

    function _workerUrl(workerCode) {
        workerCode = `(() => {${workerCode}})()`; // encapsulate IIFE
        var _blob = new Blob([workerCode], { type: 'text/javascript' });
        return window.URL.createObjectURL(_blob);
    }

    function _isProbablyPrime(w, iterations = 16) {
        /*
    	PREFILTERING. Even values but 2 are not primes, so don't test. 
    	1 is not a prime and the M-R algorithm needs w>1.
    	*/
        if (w === _TWO)
            return true;
        else if ((w & _ONE) === _ZERO || w === _ONE)
            return false;

        /*
        Test if any of the first 250 small primes are a factor of w. 2 is not tested because it was already tested above.
        */
        const firstPrimes = [
            3,
            5,
            7,
            11,
            13,
            17,
            19,
            23,
            29,
            31,
            37,
            41,
            43,
            47,
            53,
            59,
            61,
            67,
            71,
            73,
            79,
            83,
            89,
            97,
            101,
            103,
            107,
            109,
            113,
            127,
            131,
            137,
            139,
            149,
            151,
            157,
            163,
            167,
            173,
            179,
            181,
            191,
            193,
            197,
            199,
            211,
            223,
            227,
            229,
            233,
            239,
            241,
            251,
            257,
            263,
            269,
            271,
            277,
            281,
            283,
            293,
            307,
            311,
            313,
            317,
            331,
            337,
            347,
            349,
            353,
            359,
            367,
            373,
            379,
            383,
            389,
            397,
            401,
            409,
            419,
            421,
            431,
            433,
            439,
            443,
            449,
            457,
            461,
            463,
            467,
            479,
            487,
            491,
            499,
            503,
            509,
            521,
            523,
            541,
            547,
            557,
            563,
            569,
            571,
            577,
            587,
            593,
            599,
            601,
            607,
            613,
            617,
            619,
            631,
            641,
            643,
            647,
            653,
            659,
            661,
            673,
            677,
            683,
            691,
            701,
            709,
            719,
            727,
            733,
            739,
            743,
            751,
            757,
            761,
            769,
            773,
            787,
            797,
            809,
            811,
            821,
            823,
            827,
            829,
            839,
            853,
            857,
            859,
            863,
            877,
            881,
            883,
            887,
            907,
            911,
            919,
            929,
            937,
            941,
            947,
            953,
            967,
            971,
            977,
            983,
            991,
            997,
            1009,
            1013,
            1019,
            1021,
            1031,
            1033,
            1039,
            1049,
            1051,
            1061,
            1063,
            1069,
            1087,
            1091,
            1093,
            1097,
            1103,
            1109,
            1117,
            1123,
            1129,
            1151,
            1153,
            1163,
            1171,
            1181,
            1187,
            1193,
            1201,
            1213,
            1217,
            1223,
            1229,
            1231,
            1237,
            1249,
            1259,
            1277,
            1279,
            1283,
            1289,
            1291,
            1297,
            1301,
            1303,
            1307,
            1319,
            1321,
            1327,
            1361,
            1367,
            1373,
            1381,
            1399,
            1409,
            1423,
            1427,
            1429,
            1433,
            1439,
            1447,
            1451,
            1453,
            1459,
            1471,
            1481,
            1483,
            1487,
            1489,
            1493,
            1499,
            1511,
            1523,
            1531,
            1543,
            1549,
            1553,
            1559,
            1567,
            1571,
            1579,
            1583,
            1597,
        ];
        for (let i = 0; i < firstPrimes.length && (BigInt(firstPrimes[i]) <= w); i++) {
            const p = BigInt(firstPrimes[i]);
            if (w === p)
                return true;
            else if (w % p === _ZERO)
                return false;
        }

        /*
    	1. Let a be the largest integer such that 2**a divides w−1.
    	2. m = (w−1) / 2**a.
    	3. wlen = len (w).
    	4. For i = 1 to iterations do
    		4.1 Obtain a string b of wlen bits from an RBG.
    		Comment: Ensure that 1 < b < w−1.
    		4.2 If ((b ≤ 1) or (b ≥ w−1)), then go to step 4.1.
    		4.3 z = b**m mod w.
    		4.4 If ((z = 1) or (z = w − 1)), then go to step 4.7.
    		4.5 For j = 1 to a − 1 do.
    		4.5.1 z = z**2 mod w.
    		4.5.2 If (z = w−1), then go to step 4.7.
    		4.5.3 If (z = 1), then go to step 4.6.
    		4.6 Return COMPOSITE.
    		4.7 Continue.
    		Comment: Increment i for the do-loop in step 4.
    	5. Return PROBABLY PRIME.
    	*/
        let a = _ZERO, d = w - _ONE;
        while (d % _TWO === _ZERO) {
            d /= _TWO;
            ++a;
        }

        let m = (w - _ONE) / (_TWO ** a);

        loop: do {
            let b = randBetween(w - _ONE, _TWO);
            let z = modPow(b, m, w);
            if (z === _ONE || z === w - _ONE)
                continue;

            for (let j = 1; j < a; j++) {
                z = modPow(z, _TWO, w);
                if (z === w - _ONE)
                    continue loop;
                if (z === _ONE)
                    break;
            }
            return false;
        } while (--iterations);

        return true;
    }

    const _ONE$1 = BigInt(1);

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
    const generateRandomKeys = async function (bitLength$1 = 4096, simpleVariant = false) {
        let p, q, n, phi, n2, g, lambda, mu;
        // if p and q are bitLength/2 long ->  2**(bitLength - 2) <= n < 2**(bitLenght) 
        do {
            p = await prime(Math.floor(bitLength$1 / 2) + 1);
            q = await prime(Math.floor(bitLength$1 / 2));
            n = p * q;
        } while (q === p || bitLength(n) != bitLength$1);

        phi = (p - _ONE$1) * (q - _ONE$1);

        n2 = n ** BigInt(2);

        if (simpleVariant === true) {
            //If using p,q of equivalent length, a simpler variant of the key
            // generation steps would be to set
            // g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n)
            g = n + _ONE$1;
            lambda = phi;
            mu = modInv(lambda, n);
        } else {
            g = getGenerator(n, n2);
            lambda = lcm(p - _ONE$1, q - _ONE$1);
            mu = modInv(L(modPow(g, lambda, n2), n), n);
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
            return bitLength(this.n);
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
            r = randBetween(this.n);
            return (modPow(this.g, m, this._n2) * modPow(r, this.n, this._n2)) % this._n2;
        }

        /**
         * Homomorphic addition
         * 
         * @param {...bigints} - 2 or more (big) numbers (m_1,..., m_n) encrypted with this public key
         * 
         * @returns {bigint} - the encryption of (m_1 + ... + m_2) with this public key
         */
        addition(...ciphertexts) { // ciphertexts of numbers
            return ciphertexts.reduce((sum, next) => sum * BigInt(next) % (this._n2), _ONE$1);
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
            return modPow(BigInt(c), k, this._n2);
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
            return bitLength(this.publicKey.n);
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
            return (L(modPow(BigInt(c), this.lambda, this.publicKey._n2), this.publicKey.n) * this.mu) % this.publicKey.n;
        }
    };

    function L(a, n) {
        return (a - _ONE$1) / n;
    }

    function getGenerator(n, n2 = modPow(n, 2)) {
        const alpha = randBetween(n);
        const beta = randBetween(n);
        return ((alpha * n + _ONE$1) * modPow(beta, n, n2)) % n2;
    }

    exports.PrivateKey = PrivateKey;
    exports.PublicKey = PublicKey;
    exports.generateRandomKeys = generateRandomKeys;

    return exports;

}({}));
