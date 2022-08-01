/**
 * Absolute value. abs(a)==a if a>=0. abs(a)==-a if a<0
 *
 * @param a
 *
 * @returns The absolute value of a
 */
function abs(a) {
    return (a >= 0) ? a : -a;
}

/**
 * Returns the bitlength of a number
 *
 * @param a
 * @returns The bit length
 */
function bitLength(a) {
    if (typeof a === 'number')
        a = BigInt(a);
    if (a === 1n) {
        return 1;
    }
    let bits = 1;
    do {
        bits++;
    } while ((a >>= 1n) > 1n);
    return bits;
}

/**
 * An iterative implementation of the extended euclidean algorithm or extended greatest common divisor algorithm.
 * Take positive integers a, b as input, and return a triple (g, x, y), such that ax + by = g = gcd(a, b).
 *
 * @param a
 * @param b
 *
 * @throws {RangeError}
 * This excepction is thrown if a or b are less than 0
 *
 * @returns A triple (g, x, y), such that ax + by = g = gcd(a, b).
 */
function eGcd(a, b) {
    if (typeof a === 'number')
        a = BigInt(a);
    if (typeof b === 'number')
        b = BigInt(b);
    if (a <= 0n || b <= 0n)
        throw new RangeError('a and b MUST be > 0'); // a and b MUST be positive
    let x = 0n;
    let y = 1n;
    let u = 1n;
    let v = 0n;
    while (a !== 0n) {
        const q = b / a;
        const r = b % a;
        const m = x - (u * q);
        const n = y - (v * q);
        b = a;
        a = r;
        x = u;
        y = v;
        u = m;
        v = n;
    }
    return {
        g: b,
        x: x,
        y: y
    };
}

/**
 * Greatest-common divisor of two integers based on the iterative binary algorithm.
 *
 * @param a
 * @param b
 *
 * @returns The greatest common divisor of a and b
 */
function gcd(a, b) {
    let aAbs = (typeof a === 'number') ? BigInt(abs(a)) : abs(a);
    let bAbs = (typeof b === 'number') ? BigInt(abs(b)) : abs(b);
    if (aAbs === 0n) {
        return bAbs;
    }
    else if (bAbs === 0n) {
        return aAbs;
    }
    let shift = 0n;
    while (((aAbs | bAbs) & 1n) === 0n) {
        aAbs >>= 1n;
        bAbs >>= 1n;
        shift++;
    }
    while ((aAbs & 1n) === 0n)
        aAbs >>= 1n;
    do {
        while ((bAbs & 1n) === 0n)
            bAbs >>= 1n;
        if (aAbs > bAbs) {
            const x = aAbs;
            aAbs = bAbs;
            bAbs = x;
        }
        bAbs -= aAbs;
    } while (bAbs !== 0n);
    // rescale
    return aAbs << shift;
}

/**
 * The least common multiple computed as abs(a*b)/gcd(a,b)
 * @param a
 * @param b
 *
 * @returns The least common multiple of a and b
 */
function lcm(a, b) {
    if (typeof a === 'number')
        a = BigInt(a);
    if (typeof b === 'number')
        b = BigInt(b);
    if (a === 0n && b === 0n)
        return BigInt(0);
    // return abs(a * b) as bigint / gcd(a, b)
    return abs((a / gcd(a, b)) * b);
}

/**
 * Finds the smallest positive element that is congruent to a in modulo n
 *
 * @remarks
 * a and b must be the same type, either number or bigint
 *
 * @param a - An integer
 * @param n - The modulo
 *
 * @throws {RangeError}
 * Excpeption thrown when n is not > 0
 *
 * @returns A bigint with the smallest positive representation of a modulo n
 */
function toZn(a, n) {
    if (typeof a === 'number')
        a = BigInt(a);
    if (typeof n === 'number')
        n = BigInt(n);
    if (n <= 0n) {
        throw new RangeError('n must be > 0');
    }
    const aZn = a % n;
    return (aZn < 0n) ? aZn + n : aZn;
}

/**
 * Modular inverse.
 *
 * @param a The number to find an inverse for
 * @param n The modulo
 *
 * @throws {RangeError}
 * Excpeption thorwn when a does not have inverse modulo n
 *
 * @returns The inverse modulo n
 */
function modInv(a, n) {
    const egcd = eGcd(toZn(a, n), n);
    if (egcd.g !== 1n) {
        throw new RangeError(`${a.toString()} does not have inverse modulo ${n.toString()}`); // modular inverse does not exist
    }
    else {
        return toZn(egcd.x, n);
    }
}

/**
 * Modular exponentiation b**e mod n. Currently using the right-to-left binary method
 *
 * @param b base
 * @param e exponent
 * @param n modulo
 *
 * @throws {RangeError}
 * Excpeption thrown when n is not > 0
 *
 * @returns b**e mod n
 */
function modPow(b, e, n) {
    if (typeof b === 'number')
        b = BigInt(b);
    if (typeof e === 'number')
        e = BigInt(e);
    if (typeof n === 'number')
        n = BigInt(n);
    if (n <= 0n) {
        throw new RangeError('n must be > 0');
    }
    else if (n === 1n) {
        return 0n;
    }
    b = toZn(b, n);
    if (e < 0n) {
        return modInv(modPow(b, abs(e), n), n);
    }
    let r = 1n;
    while (e > 0) {
        if ((e % 2n) === 1n) {
            r = r * b % n;
        }
        e = e / 2n;
        b = b ** 2n % n;
    }
    return r;
}

function fromBuffer(buf) {
    let ret = 0n;
    for (const i of buf.values()) {
        const bi = BigInt(i);
        ret = (ret << 8n) + bi;
    }
    return ret;
}

/**
 * Secure random bytes for both node and browsers. Node version uses crypto.randomBytes() and browser one self.crypto.getRandomValues()
 *
 * @param byteLength - The desired number of random bytes
 * @param forceLength - If we want to force the output to have a bit length of 8*byteLength. It basically forces the msb to be 1
 *
 * @throws {RangeError}
 * byteLength MUST be > 0
 *
 * @returns A promise that resolves to a UInt8Array/Buffer (Browser/Node.js) filled with cryptographically secure random bytes
 */
function randBytes(byteLength, forceLength = false) {
    if (byteLength < 1)
        throw new RangeError('byteLength MUST be > 0');
    return new Promise(function (resolve, reject) {
        { // browser
            const buf = new Uint8Array(byteLength);
            self.crypto.getRandomValues(buf);
            // If fixed length is required we put the first bit to 1 -> to get the necessary bitLength
            if (forceLength)
                buf[0] = buf[0] | 128;
            resolve(buf);
        }
    });
}
/**
 * Secure random bytes for both node and browsers. Node version uses crypto.randomFill() and browser one self.crypto.getRandomValues()
 *
 * @param byteLength - The desired number of random bytes
 * @param forceLength - If we want to force the output to have a bit length of 8*byteLength. It basically forces the msb to be 1
 *
 * @throws {RangeError}
 * byteLength MUST be > 0
 *
 * @returns A UInt8Array/Buffer (Browser/Node.js) filled with cryptographically secure random bytes
 */
function randBytesSync(byteLength, forceLength = false) {
    if (byteLength < 1)
        throw new RangeError('byteLength MUST be > 0');
    /* eslint-disable no-lone-blocks */
    { // browser
        const buf = new Uint8Array(byteLength);
        self.crypto.getRandomValues(buf);
        // If fixed length is required we put the first bit to 1 -> to get the necessary bitLength
        if (forceLength)
            buf[0] = buf[0] | 128;
        return buf;
    }
    /* eslint-enable no-lone-blocks */
}

/**
 * Secure random bits for both node and browsers. Node version uses crypto.randomFill() and browser one self.crypto.getRandomValues()
 *
 * @param bitLength - The desired number of random bits
 * @param forceLength - If we want to force the output to have a specific bit length. It basically forces the msb to be 1
 *
 * @throws {RangeError}
 * bitLength MUST be > 0
 *
 * @returns A Promise that resolves to a UInt8Array/Buffer (Browser/Node.js) filled with cryptographically secure random bits
 */
function randBits(bitLength, forceLength = false) {
    if (bitLength < 1)
        throw new RangeError('bitLength MUST be > 0');
    const byteLength = Math.ceil(bitLength / 8);
    const bitLengthMod8 = bitLength % 8;
    return new Promise((resolve, reject) => {
        randBytes(byteLength, false).then(function (rndBytes) {
            if (bitLengthMod8 !== 0) {
                // Fill with 0's the extra bits
                rndBytes[0] = rndBytes[0] & (2 ** bitLengthMod8 - 1);
            }
            if (forceLength) {
                const mask = (bitLengthMod8 !== 0) ? 2 ** (bitLengthMod8 - 1) : 128;
                rndBytes[0] = rndBytes[0] | mask;
            }
            resolve(rndBytes);
        });
    });
}
/**
 * Secure random bits for both node and browsers. Node version uses crypto.randomFill() and browser one self.crypto.getRandomValues()
 * @param bitLength - The desired number of random bits
 * @param forceLength - If we want to force the output to have a specific bit length. It basically forces the msb to be 1
 *
 * @throws {RangeError}
 * bitLength MUST be > 0
 *
 * @returns A Uint8Array/Buffer (Browser/Node.js) filled with cryptographically secure random bits
 */
function randBitsSync(bitLength, forceLength = false) {
    if (bitLength < 1)
        throw new RangeError('bitLength MUST be > 0');
    const byteLength = Math.ceil(bitLength / 8);
    const rndBytes = randBytesSync(byteLength, false);
    const bitLengthMod8 = bitLength % 8;
    if (bitLengthMod8 !== 0) {
        // Fill with 0's the extra bits
        rndBytes[0] = rndBytes[0] & (2 ** bitLengthMod8 - 1);
    }
    if (forceLength) {
        const mask = (bitLengthMod8 !== 0) ? 2 ** (bitLengthMod8 - 1) : 128;
        rndBytes[0] = rndBytes[0] | mask;
    }
    return rndBytes;
}

/**
 * Returns a cryptographically secure random integer between [min,max].
 * @param max Returned value will be <= max
 * @param min Returned value will be >= min
 *
 * @throws {RangeError}
 * Arguments MUST be: max > min
 *
 * @returns A cryptographically secure random bigint between [min,max]
 */
function randBetween(max, min = 1n) {
    if (max <= min)
        throw new RangeError('Arguments MUST be: max > min');
    const interval = max - min;
    const bitLen = bitLength(interval);
    let rnd;
    do {
        const buf = randBitsSync(bitLen);
        rnd = fromBuffer(buf);
    } while (rnd > interval);
    return rnd + min;
}

function _workerUrl(workerCode) {
    workerCode = `(() => {${workerCode}})()`; // encapsulate IIFE
    const _blob = new Blob([workerCode], { type: 'text/javascript' });
    return window.URL.createObjectURL(_blob);
}
let _useWorkers = false; // The following is just to check whether we can use workers
/* eslint-disable no-lone-blocks */
{ // Native JS
    if (self.Worker !== undefined)
        _useWorkers = true;
}

/**
 * The test first tries if any of the first 250 small primes are a factor of the input number and then passes several
 * iterations of Miller-Rabin Probabilistic Primality Test (FIPS 186-4 C.3.1)
 *
 * @param w - A positive integer to be tested for primality
 * @param iterations - The number of iterations for the primality test. The value shall be consistent with Table C.1, C.2 or C.3
 * @param disableWorkers - Disable the use of workers for the primality test
 *
 * @throws {RangeError}
 * w MUST be >= 0
 *
 * @returns A promise that resolves to a boolean that is either true (a probably prime number) or false (definitely composite)
 */
function isProbablyPrime(w, iterations = 16, disableWorkers = false) {
    if (typeof w === 'number') {
        w = BigInt(w);
    }
    if (w < 0n)
        throw RangeError('w MUST be >= 0');
    { // browser
        return new Promise((resolve, reject) => {
            const worker = new Worker(_isProbablyPrimeWorkerUrl());
            worker.onmessage = (event) => {
                worker.terminate();
                resolve(event.data.isPrime);
            };
            worker.onmessageerror = (event) => {
                reject(event);
            };
            const msg = {
                rnd: w,
                iterations: iterations,
                id: 0
            };
            worker.postMessage(msg);
        });
    }
}
function _isProbablyPrime(w, iterations) {
    /*
    PREFILTERING. Even values but 2 are not primes, so don't test.
    1 is not a prime and the M-R algorithm needs w>1.
    */
    if (w === 2n)
        return true;
    else if ((w & 1n) === 0n || w === 1n)
        return false;
    /*
      Test if any of the first 250 small primes are a factor of w. 2 is not tested because it was already tested above.
      */
    const firstPrimes = [
        3n,
        5n,
        7n,
        11n,
        13n,
        17n,
        19n,
        23n,
        29n,
        31n,
        37n,
        41n,
        43n,
        47n,
        53n,
        59n,
        61n,
        67n,
        71n,
        73n,
        79n,
        83n,
        89n,
        97n,
        101n,
        103n,
        107n,
        109n,
        113n,
        127n,
        131n,
        137n,
        139n,
        149n,
        151n,
        157n,
        163n,
        167n,
        173n,
        179n,
        181n,
        191n,
        193n,
        197n,
        199n,
        211n,
        223n,
        227n,
        229n,
        233n,
        239n,
        241n,
        251n,
        257n,
        263n,
        269n,
        271n,
        277n,
        281n,
        283n,
        293n,
        307n,
        311n,
        313n,
        317n,
        331n,
        337n,
        347n,
        349n,
        353n,
        359n,
        367n,
        373n,
        379n,
        383n,
        389n,
        397n,
        401n,
        409n,
        419n,
        421n,
        431n,
        433n,
        439n,
        443n,
        449n,
        457n,
        461n,
        463n,
        467n,
        479n,
        487n,
        491n,
        499n,
        503n,
        509n,
        521n,
        523n,
        541n,
        547n,
        557n,
        563n,
        569n,
        571n,
        577n,
        587n,
        593n,
        599n,
        601n,
        607n,
        613n,
        617n,
        619n,
        631n,
        641n,
        643n,
        647n,
        653n,
        659n,
        661n,
        673n,
        677n,
        683n,
        691n,
        701n,
        709n,
        719n,
        727n,
        733n,
        739n,
        743n,
        751n,
        757n,
        761n,
        769n,
        773n,
        787n,
        797n,
        809n,
        811n,
        821n,
        823n,
        827n,
        829n,
        839n,
        853n,
        857n,
        859n,
        863n,
        877n,
        881n,
        883n,
        887n,
        907n,
        911n,
        919n,
        929n,
        937n,
        941n,
        947n,
        953n,
        967n,
        971n,
        977n,
        983n,
        991n,
        997n,
        1009n,
        1013n,
        1019n,
        1021n,
        1031n,
        1033n,
        1039n,
        1049n,
        1051n,
        1061n,
        1063n,
        1069n,
        1087n,
        1091n,
        1093n,
        1097n,
        1103n,
        1109n,
        1117n,
        1123n,
        1129n,
        1151n,
        1153n,
        1163n,
        1171n,
        1181n,
        1187n,
        1193n,
        1201n,
        1213n,
        1217n,
        1223n,
        1229n,
        1231n,
        1237n,
        1249n,
        1259n,
        1277n,
        1279n,
        1283n,
        1289n,
        1291n,
        1297n,
        1301n,
        1303n,
        1307n,
        1319n,
        1321n,
        1327n,
        1361n,
        1367n,
        1373n,
        1381n,
        1399n,
        1409n,
        1423n,
        1427n,
        1429n,
        1433n,
        1439n,
        1447n,
        1451n,
        1453n,
        1459n,
        1471n,
        1481n,
        1483n,
        1487n,
        1489n,
        1493n,
        1499n,
        1511n,
        1523n,
        1531n,
        1543n,
        1549n,
        1553n,
        1559n,
        1567n,
        1571n,
        1579n,
        1583n,
        1597n
    ];
    for (let i = 0; i < firstPrimes.length && (firstPrimes[i] <= w); i++) {
        const p = firstPrimes[i];
        if (w === p)
            return true;
        else if (w % p === 0n)
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
    let a = 0n;
    const d = w - 1n;
    let aux = d;
    while (aux % 2n === 0n) {
        aux /= 2n;
        ++a;
    }
    const m = d / (2n ** a);
    do {
        const b = randBetween(d, 2n);
        let z = modPow(b, m, w);
        if (z === 1n || z === d)
            continue;
        let j = 1;
        while (j < a) {
            z = modPow(z, 2n, w);
            if (z === d)
                break;
            if (z === 1n)
                return false;
            j++;
        }
        if (z !== d)
            return false;
    } while (--iterations !== 0);
    return true;
}
function _isProbablyPrimeWorkerUrl() {
    // Let's us first add all the required functions
    let workerCode = `'use strict';const ${eGcd.name}=${eGcd.toString()};const ${modInv.name}=${modInv.toString()};const ${modPow.name}=${modPow.toString()};const ${toZn.name}=${toZn.toString()};const ${randBitsSync.name}=${randBitsSync.toString()};const ${randBytesSync.name}=${randBytesSync.toString()};const ${randBetween.name}=${randBetween.toString()};const ${isProbablyPrime.name}=${_isProbablyPrime.toString()};${bitLength.toString()};${fromBuffer.toString()};`;
    workerCode += `onmessage=async function(_e){const _m={isPrime:await ${isProbablyPrime.name}(_e.data.rnd,_e.data.iterations),value:_e.data.rnd,id:_e.data.id};postMessage(_m);}`;
    return _workerUrl(workerCode);
}

/**
 * A probably-prime (Miller-Rabin), cryptographically-secure, random-number generator.
 * The browser version uses web workers to parallelise prime look up. Therefore, it does not lock the UI
 * main process, and it can be much faster (if several cores or cpu are available).
 * The node version can also use worker_threads if they are available (enabled by default with Node 11 and
 * and can be enabled at runtime executing node --experimental-worker with node >=10.5.0).
 *
 * @param bitLength - The required bit length for the generated prime
 * @param iterations - The number of iterations for the Miller-Rabin Probabilistic Primality Test
 *
 * @throws {RangeError}
 * bitLength MUST be > 0
 *
 * @returns A promise that resolves to a bigint probable prime of bitLength bits.
 */
function prime(bitLength, iterations = 16) {
    if (bitLength < 1)
        throw new RangeError('bitLength MUST be > 0');
    /* c8 ignore start */
    if (!_useWorkers) { // If there is no support for workers
        let rnd = 0n;
        do {
            rnd = fromBuffer(randBitsSync(bitLength, true));
        } while (!_isProbablyPrime(rnd, iterations));
        return new Promise((resolve) => { resolve(rnd); });
    }
    /* c8 ignore stop */
    return new Promise((resolve, reject) => {
        const workerList = [];
        const _onmessage = (msg, newWorker) => {
            if (msg.isPrime) {
                // if a prime number has been found, stop all the workers, and return it
                for (let j = 0; j < workerList.length; j++) {
                    workerList[j].terminate(); // eslint-disable-line @typescript-eslint/no-floating-promises
                }
                while (workerList.length > 0) {
                    workerList.pop();
                }
                resolve(msg.value);
            }
            else { // if a composite is found, make the worker test another random number
                const buf = randBitsSync(bitLength, true);
                const rnd = fromBuffer(buf);
                try {
                    const msgToWorker = {
                        rnd: rnd,
                        iterations: iterations,
                        id: msg.id
                    };
                    newWorker.postMessage(msgToWorker);
                }
                catch (error) {
                    // The worker has already terminated. There is nothing to handle here
                }
            }
        };
        { // browser
            const workerURL = _isProbablyPrimeWorkerUrl();
            for (let i = 0; i < self.navigator.hardwareConcurrency - 1; i++) {
                const newWorker = new Worker(workerURL);
                newWorker.onmessage = (event) => _onmessage(event.data, newWorker);
                workerList.push(newWorker);
            }
        }
        for (let i = 0; i < workerList.length; i++) {
            randBits(bitLength, true).then(function (buf) {
                const rnd = fromBuffer(buf);
                workerList[i].postMessage({
                    rnd: rnd,
                    iterations: iterations,
                    id: i
                });
            }).catch(reject);
        }
    });
}
/**
 * A probably-prime (Miller-Rabin), cryptographically-secure, random-number generator.
 * The sync version is NOT RECOMMENDED since it won't use workers and thus it'll be slower and may freeze thw window in browser's javascript. Please consider using prime() instead.
 *
 * @param bitLength - The required bit length for the generated prime
 * @param iterations - The number of iterations for the Miller-Rabin Probabilistic Primality Test
 *
 * @throws {RangeError}
 * bitLength MUST be > 0
 *
 * @returns A bigint probable prime of bitLength bits.
 */
function primeSync(bitLength, iterations = 16) {
    if (bitLength < 1)
        throw new RangeError('bitLength MUST be > 0');
    let rnd = 0n;
    do {
        rnd = fromBuffer(randBitsSync(bitLength, true));
    } while (!_isProbablyPrime(rnd, iterations));
    return rnd;
}

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
        return bitLength(this.n);
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
                r = randBetween(this.n);
            } while (gcd(r, this.n) !== 1n);
        }
        return (modPow(this.g, m, this._n2) * modPow(r, this.n, this._n2)) % this._n2;
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
        return plaintexts.reduce((sum, next) => sum * modPow(this.g, next, this._n2) % this._n2, ciphertext);
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
        return modPow(c, k, this._n2);
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
        return bitLength(this.publicKey.n);
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
        return (L(modPow(c, this.lambda, this.publicKey._n2), this.publicKey.n) * this.mu) % this.publicKey.n;
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
        const nInvModPhi = modInv(this.n, phi);
        const c1 = c * (1n - m * this.n) % this.publicKey._n2;
        return modPow(c1, nInvModPhi, this.n);
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
        p = await prime(Math.floor(bitlength / 2) + 1);
        q = await prime(Math.floor(bitlength / 2));
        n = p * q;
    } while (q === p || bitLength(n) !== bitlength);
    if (simpleVariant) {
        // If using p,q of equivalent length, a simpler variant of the key
        // generation steps would be to set
        // g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n)
        g = n + 1n;
        lambda = (p - 1n) * (q - 1n);
        mu = modInv(lambda, n);
    }
    else {
        const n2 = n ** 2n;
        g = getGenerator(n, n2);
        lambda = lcm(p - 1n, q - 1n);
        mu = modInv(L(modPow(g, lambda, n2), n), n);
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
        p = primeSync(Math.floor(bitlength / 2) + 1);
        q = primeSync(Math.floor(bitlength / 2));
        n = p * q;
    } while (q === p || bitLength(n) !== bitlength);
    if (simpleVariant) {
        // If using p,q of equivalent length, a simpler variant of the key
        // generation steps would be to set
        // g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n)
        g = n + 1n;
        lambda = (p - 1n) * (q - 1n);
        mu = modInv(lambda, n);
    }
    else {
        const n2 = n ** 2n;
        g = getGenerator(n, n2);
        lambda = lcm(p - 1n, q - 1n);
        mu = modInv(L(modPow(g, lambda, n2), n), n);
    }
    const publicKey = new PublicKey(n, g);
    const privateKey = new PrivateKey(lambda, mu, publicKey, p, q);
    return { publicKey, privateKey };
}
function getGenerator(n, n2) {
    const alpha = randBetween(n);
    const beta = randBetween(n);
    return ((alpha * n + 1n) * modPow(beta, n, n2)) % n2;
}

export { PrivateKey, PublicKey, generateRandomKeys, generateRandomKeysSync };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguYnJvd3Nlci5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL2JpZ2ludC1jcnlwdG8tdXRpbHMvZGlzdC9lc20vaW5kZXguYnJvd3Nlci5qcyIsIi4uLy4uL3NyYy90cy9QdWJsaWNLZXkudHMiLCIuLi8uLi9zcmMvdHMvUHJpdmF0ZUtleS50cyIsIi4uLy4uL3NyYy90cy9nZW5lcmF0ZVJhbmRvbUtleXMudHMiXSwic291cmNlc0NvbnRlbnQiOm51bGwsIm5hbWVzIjpbImJjdS5iaXRMZW5ndGgiLCJiY3UucmFuZEJldHdlZW4iLCJiY3UuZ2NkIiwiYmN1Lm1vZFBvdyIsImJjdS5tb2RJbnYiLCJiY3UucHJpbWUiLCJiY3UubGNtIiwiYmN1LnByaW1lU3luYyJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLEdBQUcsQ0FBQyxDQUFDLEVBQUU7QUFDaEIsSUFBSSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDN0IsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxTQUFTLENBQUMsQ0FBQyxFQUFFO0FBQ3RCLElBQUksSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRO0FBQzdCLFFBQVEsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QixJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRTtBQUNsQixRQUFRLE9BQU8sQ0FBQyxDQUFDO0FBQ2pCLEtBQUs7QUFDTCxJQUFJLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztBQUNqQixJQUFJLEdBQUc7QUFDUCxRQUFRLElBQUksRUFBRSxDQUFDO0FBQ2YsS0FBSyxRQUFRLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUU7QUFDOUIsSUFBSSxPQUFPLElBQUksQ0FBQztBQUNoQixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ3BCLElBQUksSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRO0FBQzdCLFFBQVEsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QixJQUFJLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUTtBQUM3QixRQUFRLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEIsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDMUIsUUFBUSxNQUFNLElBQUksVUFBVSxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFDcEQsSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDZixJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNmLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ2YsSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDZixJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRTtBQUNyQixRQUFRLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDeEIsUUFBUSxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3hCLFFBQVEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM5QixRQUFRLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDOUIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2QsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2QsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2QsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2QsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2QsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2QsS0FBSztBQUNMLElBQUksT0FBTztBQUNYLFFBQVEsQ0FBQyxFQUFFLENBQUM7QUFDWixRQUFRLENBQUMsRUFBRSxDQUFDO0FBQ1osUUFBUSxDQUFDLEVBQUUsQ0FBQztBQUNaLEtBQUssQ0FBQztBQUNOLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ25CLElBQUksSUFBSSxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxRQUFRLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqRSxJQUFJLElBQUksSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssUUFBUSxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakUsSUFBSSxJQUFJLElBQUksS0FBSyxFQUFFLEVBQUU7QUFDckIsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0wsU0FBUyxJQUFJLElBQUksS0FBSyxFQUFFLEVBQUU7QUFDMUIsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0wsSUFBSSxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7QUFDbkIsSUFBSSxPQUFPLENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUU7QUFDeEMsUUFBUSxJQUFJLEtBQUssRUFBRSxDQUFDO0FBQ3BCLFFBQVEsSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUNwQixRQUFRLEtBQUssRUFBRSxDQUFDO0FBQ2hCLEtBQUs7QUFDTCxJQUFJLE9BQU8sQ0FBQyxJQUFJLEdBQUcsRUFBRSxNQUFNLEVBQUU7QUFDN0IsUUFBUSxJQUFJLEtBQUssRUFBRSxDQUFDO0FBQ3BCLElBQUksR0FBRztBQUNQLFFBQVEsT0FBTyxDQUFDLElBQUksR0FBRyxFQUFFLE1BQU0sRUFBRTtBQUNqQyxZQUFZLElBQUksS0FBSyxFQUFFLENBQUM7QUFDeEIsUUFBUSxJQUFJLElBQUksR0FBRyxJQUFJLEVBQUU7QUFDekIsWUFBWSxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDM0IsWUFBWSxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ3hCLFlBQVksSUFBSSxHQUFHLENBQUMsQ0FBQztBQUNyQixTQUFTO0FBQ1QsUUFBUSxJQUFJLElBQUksSUFBSSxDQUFDO0FBQ3JCLEtBQUssUUFBUSxJQUFJLEtBQUssRUFBRSxFQUFFO0FBQzFCO0FBQ0EsSUFBSSxPQUFPLElBQUksSUFBSSxLQUFLLENBQUM7QUFDekIsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ25CLElBQUksSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRO0FBQzdCLFFBQVEsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QixJQUFJLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUTtBQUM3QixRQUFRLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEIsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDNUIsUUFBUSxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6QjtBQUNBLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBeUJEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDcEIsSUFBSSxJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVE7QUFDN0IsUUFBUSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RCLElBQUksSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRO0FBQzdCLFFBQVEsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QixJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRTtBQUNqQixRQUFRLE1BQU0sSUFBSSxVQUFVLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDOUMsS0FBSztBQUNMLElBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN0QixJQUFJLE9BQU8sQ0FBQyxHQUFHLEdBQUcsRUFBRSxJQUFJLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ3RDLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ3RCLElBQUksTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDckMsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO0FBQ3ZCLFFBQVEsTUFBTSxJQUFJLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLDhCQUE4QixFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3RixLQUFLO0FBQ0wsU0FBUztBQUNULFFBQVEsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUMvQixLQUFLO0FBQ0wsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDekIsSUFBSSxJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVE7QUFDN0IsUUFBUSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RCLElBQUksSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRO0FBQzdCLFFBQVEsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QixJQUFJLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUTtBQUM3QixRQUFRLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEIsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUU7QUFDakIsUUFBUSxNQUFNLElBQUksVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQzlDLEtBQUs7QUFDTCxTQUFTLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRTtBQUN2QixRQUFRLE9BQU8sRUFBRSxDQUFDO0FBQ2xCLEtBQUs7QUFDTCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ25CLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFO0FBQ2hCLFFBQVEsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDL0MsS0FBSztBQUNMLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ2YsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDbEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLEVBQUU7QUFDN0IsWUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDMUIsU0FBUztBQUNULFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDbkIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDeEIsS0FBSztBQUNMLElBQUksT0FBTyxDQUFDLENBQUM7QUFDYixDQUFDO0FBQ0Q7QUFDQSxTQUFTLFVBQVUsQ0FBQyxHQUFHLEVBQUU7QUFDekIsSUFBSSxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDakIsSUFBSSxLQUFLLE1BQU0sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRTtBQUNsQyxRQUFRLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QixRQUFRLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDO0FBQy9CLEtBQUs7QUFDTCxJQUFJLE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsU0FBUyxDQUFDLFVBQVUsRUFBRSxXQUFXLEdBQUcsS0FBSyxFQUFFO0FBQ3BELElBQUksSUFBSSxVQUFVLEdBQUcsQ0FBQztBQUN0QixRQUFRLE1BQU0sSUFBSSxVQUFVLENBQUMsd0JBQXdCLENBQUMsQ0FBQztBQUN2RCxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBVSxPQUFPLEVBQUUsTUFBTSxFQUFFO0FBQ2xELFFBQVE7QUFDUixZQUFZLE1BQU0sR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ25ELFlBQVksSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDN0M7QUFDQSxZQUFZLElBQUksV0FBVztBQUMzQixnQkFBZ0IsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDdEMsWUFBWSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDekIsU0FBUztBQUNULEtBQUssQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLGFBQWEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxHQUFHLEtBQUssRUFBRTtBQUN4RCxJQUFJLElBQUksVUFBVSxHQUFHLENBQUM7QUFDdEIsUUFBUSxNQUFNLElBQUksVUFBVSxDQUFDLHdCQUF3QixDQUFDLENBQUM7QUFDdkQ7QUFDQSxJQUFJO0FBQ0osUUFBUSxNQUFNLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMvQyxRQUFRLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3pDO0FBQ0EsUUFBUSxJQUFJLFdBQVc7QUFDdkIsWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUNsQyxRQUFRLE9BQU8sR0FBRyxDQUFDO0FBQ25CLEtBQUs7QUFDTDtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLFFBQVEsQ0FBQyxTQUFTLEVBQUUsV0FBVyxHQUFHLEtBQUssRUFBRTtBQUNsRCxJQUFJLElBQUksU0FBUyxHQUFHLENBQUM7QUFDckIsUUFBUSxNQUFNLElBQUksVUFBVSxDQUFDLHVCQUF1QixDQUFDLENBQUM7QUFDdEQsSUFBSSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNoRCxJQUFJLE1BQU0sYUFBYSxHQUFHLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFDeEMsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sS0FBSztBQUM1QyxRQUFRLFNBQVMsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsUUFBUSxFQUFFO0FBQzlELFlBQVksSUFBSSxhQUFhLEtBQUssQ0FBQyxFQUFFO0FBQ3JDO0FBQ0EsZ0JBQWdCLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNyRSxhQUFhO0FBQ2IsWUFBWSxJQUFJLFdBQVcsRUFBRTtBQUM3QixnQkFBZ0IsTUFBTSxJQUFJLEdBQUcsQ0FBQyxhQUFhLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxhQUFhLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ3BGLGdCQUFnQixRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNqRCxhQUFhO0FBQ2IsWUFBWSxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDOUIsU0FBUyxDQUFDLENBQUM7QUFDWCxLQUFLLENBQUMsQ0FBQztBQUNQLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsWUFBWSxDQUFDLFNBQVMsRUFBRSxXQUFXLEdBQUcsS0FBSyxFQUFFO0FBQ3RELElBQUksSUFBSSxTQUFTLEdBQUcsQ0FBQztBQUNyQixRQUFRLE1BQU0sSUFBSSxVQUFVLENBQUMsdUJBQXVCLENBQUMsQ0FBQztBQUN0RCxJQUFJLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2hELElBQUksTUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN0RCxJQUFJLE1BQU0sYUFBYSxHQUFHLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFDeEMsSUFBSSxJQUFJLGFBQWEsS0FBSyxDQUFDLEVBQUU7QUFDN0I7QUFDQSxRQUFRLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM3RCxLQUFLO0FBQ0wsSUFBSSxJQUFJLFdBQVcsRUFBRTtBQUNyQixRQUFRLE1BQU0sSUFBSSxHQUFHLENBQUMsYUFBYSxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssYUFBYSxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUM1RSxRQUFRLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ3pDLEtBQUs7QUFDTCxJQUFJLE9BQU8sUUFBUSxDQUFDO0FBQ3BCLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsR0FBRyxFQUFFLEVBQUU7QUFDcEMsSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHO0FBQ2xCLFFBQVEsTUFBTSxJQUFJLFVBQVUsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0FBQzdELElBQUksTUFBTSxRQUFRLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQztBQUMvQixJQUFJLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN2QyxJQUFJLElBQUksR0FBRyxDQUFDO0FBQ1osSUFBSSxHQUFHO0FBQ1AsUUFBUSxNQUFNLEdBQUcsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDekMsUUFBUSxHQUFHLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzlCLEtBQUssUUFBUSxHQUFHLEdBQUcsUUFBUSxFQUFFO0FBQzdCLElBQUksT0FBTyxHQUFHLEdBQUcsR0FBRyxDQUFDO0FBQ3JCLENBQUM7QUFDRDtBQUNBLFNBQVMsVUFBVSxDQUFDLFVBQVUsRUFBRTtBQUNoQyxJQUFJLFVBQVUsR0FBRyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0MsSUFBSSxNQUFNLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQztBQUN0RSxJQUFJLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDN0MsQ0FBQztBQUNELElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztBQUN4QjtBQUNBO0FBQ0EsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssU0FBUztBQUNqQyxRQUFRLFdBQVcsR0FBRyxJQUFJLENBQUM7QUFDM0IsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLGVBQWUsQ0FBQyxDQUFDLEVBQUUsVUFBVSxHQUFHLEVBQUUsRUFBRSxjQUFjLEdBQUcsS0FBSyxFQUFFO0FBQ3JFLElBQUksSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRLEVBQUU7QUFDL0IsUUFBUSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RCLEtBQUs7QUFDTCxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUU7QUFDZCxRQUFRLE1BQU0sVUFBVSxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDM0MsSUFBSTtBQUNKLFFBQVEsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEtBQUs7QUFDaEQsWUFBWSxNQUFNLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyx5QkFBeUIsRUFBRSxDQUFDLENBQUM7QUFDbkUsWUFBWSxNQUFNLENBQUMsU0FBUyxHQUFHLENBQUMsS0FBSyxLQUFLO0FBQzFDLGdCQUFnQixNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDbkMsZ0JBQWdCLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzVDLGFBQWEsQ0FBQztBQUNkLFlBQVksTUFBTSxDQUFDLGNBQWMsR0FBRyxDQUFDLEtBQUssS0FBSztBQUMvQyxnQkFBZ0IsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzlCLGFBQWEsQ0FBQztBQUNkLFlBQVksTUFBTSxHQUFHLEdBQUc7QUFDeEIsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO0FBQ3RCLGdCQUFnQixVQUFVLEVBQUUsVUFBVTtBQUN0QyxnQkFBZ0IsRUFBRSxFQUFFLENBQUM7QUFDckIsYUFBYSxDQUFDO0FBQ2QsWUFBWSxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3BDLFNBQVMsQ0FBQyxDQUFDO0FBQ1gsS0FBSztBQUNMLENBQUM7QUFDRCxTQUFTLGdCQUFnQixDQUFDLENBQUMsRUFBRSxVQUFVLEVBQUU7QUFDekM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDaEIsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixTQUFTLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRTtBQUN4QyxRQUFRLE9BQU8sS0FBSyxDQUFDO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLElBQUksTUFBTSxXQUFXLEdBQUc7QUFDeEIsUUFBUSxFQUFFO0FBQ1YsUUFBUSxFQUFFO0FBQ1YsUUFBUSxFQUFFO0FBQ1YsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxHQUFHO0FBQ1gsUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsUUFBUSxLQUFLO0FBQ2IsS0FBSyxDQUFDO0FBQ04sSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxDQUFDLE1BQU0sS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDMUUsUUFBUSxNQUFNLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakMs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
