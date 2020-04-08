/**
 * Absolute value. abs(a)==a if a>=0. abs(a)==-a if a<0
 *
 * @param {number|bigint} a
 *
 * @returns {bigint} the absolute value of a
 */
function abs (a) {
  a = BigInt(a);
  return (a >= 0n) ? a : -a
}

/**
 * Returns the bitlength of a number
 *
 * @param {number|bigint} a
 * @returns {number} - the bit length
 */
function bitLength (a) {
  a = BigInt(a);
  if (a === 1n) { return 1 }
  let bits = 1;
  do {
    bits++;
  } while ((a >>= 1n) > 1n)
  return bits
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
function eGcd (a, b) {
  a = BigInt(a);
  b = BigInt(b);
  if (a <= 0n | b <= 0n) { return NaN } // a and b MUST be positive

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
    b: b,
    x: x,
    y: y
  }
}

/**
 * Greatest-common divisor of two integers based on the iterative binary algorithm.
 *
 * @param {number|bigint} a
 * @param {number|bigint} b
 *
 * @returns {bigint} The greatest common divisor of a and b
 */
function gcd (a, b) {
  a = abs(a);
  b = abs(b);
  if (a === 0n) { return b } else if (b === 0n) { return a }

  let shift = 0n;
  while (!((a | b) & 1n)) {
    a >>= 1n;
    b >>= 1n;
    shift++;
  }
  while (!(a & 1n)) a >>= 1n;
  do {
    while (!(b & 1n)) b >>= 1n;
    if (a > b) {
      const x = a;
      a = b;
      b = x;
    }
    b -= a;
  } while (b)

  // rescale
  return a << shift
}

/**
 * The least common multiple computed as abs(a*b)/gcd(a,b)
 * @param {number|bigint} a
 * @param {number|bigint} b
 *
 * @returns {bigint} The least common multiple of a and b
 */
function lcm (a, b) {
  a = BigInt(a);
  b = BigInt(b);
  if (a === 0n && b === 0n) { return 0n }
  return abs(a * b) / gcd(a, b)
}

/**
 * Maximum. max(a,b)==a if a>=b. max(a,b)==b if a<=b
 *
 * @param {number|bigint} a
 * @param {number|bigint} b
 *
 * @returns {bigint} maximum of numbers a and b
 */
function max (a, b) {
  a = BigInt(a);
  b = BigInt(b);
  return (a >= b) ? a : b
}

/**
 * Minimum. min(a,b)==b if a>=b. min(a,b)==a if a<=b
 *
 * @param {number|bigint} a
 * @param {number|bigint} b
 *
 * @returns {bigint} minimum of numbers a and b
 */
function min (a, b) {
  a = BigInt(a);
  b = BigInt(b);
  return (a >= b) ? b : a
}

/**
 * Modular inverse.
 *
 * @param {number|bigint} a The number to find an inverse for
 * @param {number|bigint} n The modulo
 *
 * @returns {bigint} the inverse modulo n or NaN if it does not exist
 */
function modInv (a, n) {
  const egcd = eGcd(toZn(a, n), n);
  if (egcd.b !== 1n) {
    return NaN // modular inverse does not exist
  } else {
    return toZn(egcd.x, n)
  }
}

/**
 * Modular exponentiation b**e mod n. Currently using the right-to-left binary method
 *
 * @param {number|bigint} b base
 * @param {number|bigint} e exponent
 * @param {number|bigint} n modulo
 *
 * @returns {bigint} b**e mod n
 */
function modPow (b, e, n) {
  n = BigInt(n);
  if (n === 0n) { return NaN } else if (n === 1n) { return 0n }

  b = toZn(b, n);

  e = BigInt(e);
  if (e < 0n) {
    return modInv(modPow(b, abs(e), n), n)
  }

  let r = 1n;
  while (e > 0) {
    if ((e % 2n) === 1n) {
      r = (r * b) % n;
    }
    e = e / 2n;
    b = b ** 2n % n;
  }
  return r
}

/**
 * Finds the smallest positive element that is congruent to a in modulo n
 * @param {number|bigint} a An integer
 * @param {number|bigint} n The modulo
 *
 * @returns {bigint} The smallest positive representation of a in modulo n
 */
function toZn (a, n) {
  n = BigInt(n);
  if (n <= 0) { return NaN }

  a = BigInt(a) % n;
  return (a < 0) ? a + n : a
}

/**
 * The test first tries if any of the first 250 small primes are a factor of the input number and then passes several
 * iterations of Miller-Rabin Probabilistic Primality Test (FIPS 186-4 C.3.1)
 *
 * @param {number | bigint} w An integer to be tested for primality
 * @param {number} [iterations = 16] The number of iterations for the primality test. The value shall be consistent with Table C.1, C.2 or C.3
 *
 * @returns {Promise<boolean>} A promise that resolves to a boolean that is either true (a probably prime number) or false (definitely composite)
 */
function isProbablyPrime (w, iterations = 16) {
  if (typeof w === 'number') {
    w = BigInt(w);
  }
  /* eslint-disable no-lone-blocks */
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

      worker.postMessage({
        rnd: w,
        iterations: iterations,
        id: 0
      });
    })
  }
  /* eslint-enable no-lone-blocks */
}

/**
 * A probably-prime (Miller-Rabin), cryptographically-secure, random-number generator.
 * The browser version uses web workers to parallelise prime look up. Therefore, it does not lock the UI
 * main process, and it can be much faster (if several cores or cpu are available).
 * The node version can also use worker_threads if they are available (enabled by default with Node 11 and
 * and can be enabled at runtime executing node --experimental-worker with node >=10.5.0).
 *
 * @param {number} bitLength The required bit length for the generated prime
 * @param {number} [iterations = 16] The number of iterations for the Miller-Rabin Probabilistic Primality Test
 *
 * @returns {Promise<bigint>} A promise that resolves to a bigint probable prime of bitLength bits.
 */
function prime (bitLength, iterations = 16) {
  if (bitLength < 1) { throw new RangeError(`bitLength MUST be > 0 and it is ${bitLength}`) }
  return new Promise((resolve) => {
    const workerList = [];
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
        const buf = randBitsSync(bitLength, true);
        const rnd = fromBuffer(buf);
        try {
          newWorker.postMessage({
            rnd: rnd,
            iterations: iterations,
            id: msg.id
          });
        } catch (error) {
          // The worker has already terminated. There is nothing to handle here
        }
      }
    };
    /* eslint-disable no-lone-blocks */
    { // browser
      const workerURL = _isProbablyPrimeWorkerUrl();
      for (let i = 0; i < self.navigator.hardwareConcurrency - 1; i++) {
        const newWorker = new Worker(workerURL);
        newWorker.onmessage = (event) => _onmessage(event.data, newWorker);
        workerList.push(newWorker);
      }
    }
    /* eslint-enable no-lone-blocks */
    for (let i = 0; i < workerList.length; i++) {
      const buf = randBitsSync(bitLength, true);
      const rnd = fromBuffer(buf);
      workerList[i].postMessage({
        rnd: rnd,
        iterations: iterations,
        id: i
      });
    }
  })
}

/**
 * A probably-prime (Miller-Rabin), cryptographically-secure, random-number generator.
 * The sync version is NOT RECOMMENDED since it won't use workers and thus it'll be slower and may freeze thw window in browser's javascript. Please consider using prime() instead.
 *
 * @param {number} bitLength The required bit length for the generated prime
 * @param {number} [iterations = 16] The number of iterations for the Miller-Rabin Probabilistic Primality Test
 *
 * @returns {bigint} A bigint probable prime of bitLength bits.
 */
function primeSync (bitLength, iterations = 16) {
  if (bitLength < 1) { throw new RangeError(`bitLength MUST be > 0 and it is ${bitLength}`) }
  let rnd = 0n;
  do {
    rnd = fromBuffer(randBitsSync(bitLength, true));
  } while (!_isProbablyPrime(rnd, iterations))
  return rnd
}

/**
 * Returns a cryptographically secure random integer between [min,max]
 * @param {bigint} max Returned value will be <= max
 * @param {bigint} [min = BigInt(1)] Returned value will be >= min
 *
 * @returns {bigint} A cryptographically secure random bigint between [min,max]
 */
function randBetween (max, min = 1n) {
  if (max <= min) throw new Error('max must be > min')
  const interval = max - min;
  const bitLen = bitLength(interval);
  let rnd;
  do {
    const buf = randBitsSync(bitLen);
    rnd = fromBuffer(buf);
  } while (rnd > interval)
  return rnd + min
}

/**
 * Secure random bits for both node and browsers. Node version uses crypto.randomFill() and browser one self.crypto.getRandomValues()
 *
 * Since version 3.0.0 this is an async function and a new randBitsSync function has been added. If you are migrating from version 2 call randBitsSync instead.
 * @since 3.0.0
 * @param {number} bitLength The desired number of random bits
 * @param {boolean} [forceLength = false] If we want to force the output to have a specific bit length. It basically forces the msb to be 1
 *
 * @returns {Promise<Buffer | Uint8Array>} A Promise that resolves to a Buffer/UInt8Array (Node.js/Browser) filled with cryptographically secure random bits
 */
async function randBits (bitLength, forceLength = false) {
  if (bitLength < 1) {
    throw new RangeError(`bitLength MUST be > 0 and it is ${bitLength}`)
  }

  const byteLength = Math.ceil(bitLength / 8);
  const bitLengthMod8 = bitLength % 8;

  const rndBytes = await randBytes(byteLength, false);
  if (bitLengthMod8) {
    // Fill with 0's the extra bits
    rndBytes[0] = rndBytes[0] & (2 ** bitLengthMod8 - 1);
  }
  if (forceLength) {
    const mask = bitLengthMod8 ? 2 ** (bitLengthMod8 - 1) : 128;
    rndBytes[0] = rndBytes[0] | mask;
  }
  return rndBytes
}

/**
 * Secure random bits for both node and browsers. Node version uses crypto.randomFill() and browser one self.crypto.getRandomValues()
 * @since 3.0.0
 * @param {number} bitLength The desired number of random bits
 * @param {boolean} [forceLength = false] If we want to force the output to have a specific bit length. It basically forces the msb to be 1
 *
 * @returns {Buffer | Uint8Array} A Buffer/UInt8Array (Node.js/Browser) filled with cryptographically secure random bits
 */
function randBitsSync (bitLength, forceLength = false) {
  if (bitLength < 1) {
    throw new RangeError(`bitLength MUST be > 0 and it is ${bitLength}`)
  }

  const byteLength = Math.ceil(bitLength / 8);
  const rndBytes = randBytesSync(byteLength, false);
  const bitLengthMod8 = bitLength % 8;
  if (bitLengthMod8) {
    // Fill with 0's the extra bits
    rndBytes[0] = rndBytes[0] & (2 ** bitLengthMod8 - 1);
  }
  if (forceLength) {
    const mask = bitLengthMod8 ? 2 ** (bitLengthMod8 - 1) : 128;
    rndBytes[0] = rndBytes[0] | mask;
  }
  return rndBytes
}

/**
 * Secure random bytes for both node and browsers. Node version uses crypto.randomFill() and browser one self.crypto.getRandomValues()
 *
 * @param {number} byteLength The desired number of random bytes
 * @param {boolean} [forceLength = false] If we want to force the output to have a bit length of 8*byteLength. It basically forces the msb to be 1
 *
 * @returns {Promise<Buffer | Uint8Array>} A promise that resolves to a Buffer/UInt8Array (Node.js/Browser) filled with cryptographically secure random bytes
 */
function randBytes (byteLength, forceLength = false) {
  if (byteLength < 1) { throw new RangeError(`byteLength MUST be > 0 and it is ${byteLength}`) }

  /* eslint-disable no-lone-blocks */
  { // browser
    return new Promise(function (resolve) {
      const buf = new Uint8Array(byteLength);
      self.crypto.getRandomValues(buf);
      // If fixed length is required we put the first bit to 1 -> to get the necessary bitLength
      if (forceLength) { buf[0] = buf[0] | 128; }
      resolve(buf);
    })
  }
  /* eslint-enable no-lone-blocks */
}

/**
 * Secure random bytes for both node and browsers. Node version uses crypto.randomFill() and browser one self.crypto.getRandomValues()
 *
 * @param {number} byteLength The desired number of random bytes
 * @param {boolean} [forceLength = false] If we want to force the output to have a bit length of 8*byteLength. It basically forces the msb to be 1
 *
 * @returns {Buffer | Uint8Array} A Buffer/UInt8Array (Node.js/Browser) filled with cryptographically secure random bytes
 */
function randBytesSync (byteLength, forceLength = false) {
  if (byteLength < 1) { throw new RangeError(`byteLength MUST be > 0 and it is ${byteLength}`) }

  /* eslint-disable no-lone-blocks */
  { // browser
    const buf = new Uint8Array(byteLength);
    self.crypto.getRandomValues(buf);
    // If fixed length is required we put the first bit to 1 -> to get the necessary bitLength
    if (forceLength) { buf[0] = buf[0] | 128; }
    return buf
  }
  /* eslint-enable no-lone-blocks */
}

/* HELPER FUNCTIONS */

function fromBuffer (buf) {
  let ret = 0n;
  for (const i of buf.values()) {
    const bi = BigInt(i);
    ret = (ret << BigInt(8)) + bi;
  }
  return ret
}

function _isProbablyPrimeWorkerUrl () {
  // Let's us first add all the required functions
  let workerCode = `'use strict';const ${eGcd.name}=${eGcd.toString()};const ${modInv.name}=${modInv.toString()};const ${modPow.name}=${modPow.toString()};const ${toZn.name}=${toZn.toString()};const ${randBitsSync.name}=${randBitsSync.toString()};const ${randBytesSync.name}=${randBytesSync.toString()};const ${randBetween.name}=${randBetween.toString()};const ${isProbablyPrime.name}=${_isProbablyPrime.toString()};${bitLength.toString()}${fromBuffer.toString()}`;

  const onmessage = async function (event) { // Let's start once we are called
    // event.data = {rnd: <bigint>, iterations: <number>}
    const isPrime = await isProbablyPrime(event.data.rnd, event.data.iterations);
    postMessage({
      isPrime: isPrime,
      value: event.data.rnd,
      id: event.data.id
    });
  };

  workerCode += `onmessage = ${onmessage.toString()};`;

  return _workerUrl(workerCode)
}

function _workerUrl (workerCode) {
  workerCode = `(() => {${workerCode}})()`; // encapsulate IIFE
  const _blob = new Blob([workerCode], { type: 'text/javascript' });
  return window.URL.createObjectURL(_blob)
}

function _isProbablyPrime (w, iterations = 16) {
  /*
  PREFILTERING. Even values but 2 are not primes, so don't test.
  1 is not a prime and the M-R algorithm needs w>1.
  */
  if (w === 2n) { return true } else if ((w & 1n) === 0n || w === 1n) { return false }

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
    if (w === p) {
      return true
    } else if (w % p === 0n) {
      return false
    }
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

  // /* eslint-disable no-labels */
  // loop: do {
  //   const b = randBetween(w - 1n, 2n)
  //   let z = modPow(b, m, w)
  //   if (z === 1n || z === w - 1n) { continue }
  //   for (let j = 1; j < a; j++) {
  //     z = modPow(z, 2n, w)
  //     if (z === w - 1n) { continue loop }
  //     if (z === 1n) { break }
  //   }
  //   return false
  // } while (--iterations)
  // /* eslint-enable no-labels */

  // return true

  do {
    const b = randBetween(d, 2n);
    let z = modPow(b, m, w);
    if (z === 1n || z === d) { continue }
    let j = 1;
    while (j < a) {
      z = modPow(z, 2n, w);
      if (z === d) { break }
      if (z === 1n) { return false }
      j++;
    }
    if (z !== d) {
      return false
    }
  } while (--iterations)
  return true
}

var index_browser_mod = /*#__PURE__*/Object.freeze({
  __proto__: null,
  abs: abs,
  bitLength: bitLength,
  eGcd: eGcd,
  gcd: gcd,
  isProbablyPrime: isProbablyPrime,
  lcm: lcm,
  max: max,
  min: min,
  modInv: modInv,
  modPow: modPow,
  prime: prime,
  primeSync: primeSync,
  randBetween: randBetween,
  randBits: randBits,
  randBitsSync: randBitsSync,
  randBytes: randBytes,
  randBytesSync: randBytesSync,
  toZn: toZn
});

// Every test file (you can create as many as you want) should start like this
// Please, do NOT touch. They will be automatically removed for browser tests -->


// <--



const bitLengths = [1024, 2048, 3072];
for (const bitLength of bitLengths) {
  describe(`Testing Paillier with keys of ${bitLength} bits`, function () {
    this.timeout(90000);
    let keyPair;
    const tests = 32;
    const numbers = [];
    const ciphertexts = [];

    describe(`generateRandomKeys(${bitLength})`, function () {
      it(`it should return a publicKey and a privateKey with public modulus of ${bitLength} bits`, async function () {
        keyPair = await _pkg.generateRandomKeys(bitLength);
        chai.expect(keyPair.publicKey).to.be.an.instanceOf(_pkg.PublicKey);
        chai.expect(keyPair.privateKey).to.be.an.instanceOf(_pkg.PrivateKey);
        chai.expect(keyPair.publicKey.bitLength).to.equal(bitLength);
      });
    });

    describe(`Correctness. For ${tests} random r in (1,n), encrypt r with publicKey and then decrypt with privateKey: D(E(r))`, function () {
      it('all should return r', function () {
        let testPassed = true;
        for (let i = 0; i < tests; i++) {
          numbers[i] = index_browser_mod.randBetween(keyPair.publicKey.n);
          ciphertexts[i] = keyPair.publicKey.encrypt(numbers[i]);
          const decrypted = keyPair.privateKey.decrypt(ciphertexts[i]);
          if (numbers[i] !== decrypted) {
            testPassed = false;
            break
          }
        }
        chai.expect(testPassed).equals(true);
      });
    });

    describe('Homomorphic properties', function () {
      describe(`Homomorphic addtion: D( E(m1)·...·E(m${tests})) mod n^2 )`, function () {
        it(`should return m1+...+m${tests} mod n`, function () {
          const encSum = keyPair.publicKey.addition(...ciphertexts);
          const d = keyPair.privateKey.decrypt(encSum);
          const sumNumbers = numbers.reduce((sum, next) => (sum + next) % keyPair.publicKey.n);
          chai.expect(d === sumNumbers);
        });
      });
      describe(`For all the ${tests} random r, the (pseudo-)homomorphic multiplication: D( E(r)^r mod n^2 )`, function () {
        it('should return r^2 mod n', function () {
          let testPassed = true;
          for (let i = 0; i < numbers.length; i++) {
            const encMul = keyPair.publicKey.multiply(ciphertexts[i], numbers[i]);
            const d = keyPair.privateKey.decrypt(encMul);
            if (d !== index_browser_mod.modPow(numbers[i], 2, keyPair.publicKey.n)) {
              testPassed = false;
              break
            }
          }
          chai.expect(testPassed).equals(true);
        });
      });
    });
  });
}
describe('Testing generateRandomKeysSync(2048) NOT RECOMMENDED', function () {
  this.timeout(90000);
  it('it should return a publicKey and a privateKey with public modulus of 2048 bits', function () {
    const keyPair = _pkg.generateRandomKeysSync(2048);
    chai.expect(keyPair.publicKey).to.be.an.instanceOf(_pkg.PublicKey);
    chai.expect(keyPair.privateKey).to.be.an.instanceOf(_pkg.PrivateKey);
    chai.expect(keyPair.publicKey.bitLength).to.equal(2048);
  });
});
