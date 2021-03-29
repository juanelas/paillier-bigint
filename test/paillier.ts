import * as bcu from 'bigint-crypto-utils'

const bitLengths = [511, 1024, undefined]
for (const _bitLength of bitLengths) {
  const bitLength = (_bitLength !== undefined) ? _bitLength : 3072
  describe(`Testing Paillier with keys of ${bitLength} bits`, function () {
    this.timeout(200000)
    let keyPair: _pkgTypes.KeyPair
    const tests = 16
    const numbers: Array<bigint> = []
    const ciphertexts: Array<bigint> = []

    describe(`generateRandomKeys(${bitLength})`, function () {
      it(`should return a publicKey and a privateKey with public modulus of ${bitLength} bits`, async function () {
        keyPair = await _pkg.generateRandomKeys(_bitLength)
        chai.expect(keyPair.publicKey).to.be.an.instanceOf(_pkg.PublicKey)
        chai.expect(keyPair.privateKey).to.be.an.instanceOf(_pkg.PrivateKey)
        chai.expect(keyPair.publicKey.bitLength).to.equal(bitLength)
        if (_bitLength !== undefined) {
          keyPair = await _pkg.generateRandomKeys(_bitLength, true)
          chai.expect(keyPair.publicKey).to.be.an.instanceOf(_pkg.PublicKey)
          chai.expect(keyPair.privateKey).to.be.an.instanceOf(_pkg.PrivateKey)
          chai.expect(keyPair.publicKey.bitLength).to.equal(bitLength)
        }
      })
    })

    describe('privateKey constructor', function () {
      it('should create a privateKey from known parameters', function () {
        const privateKey = new _pkg.PrivateKey(keyPair.privateKey.lambda, keyPair.privateKey.mu, keyPair.publicKey)
        chai.expect(privateKey).to.be.an.instanceOf(_pkg.PrivateKey)
        chai.expect(privateKey.bitLength).to.equal(bitLength)
        chai.expect(privateKey.n).to.equal(keyPair.publicKey.n)
      })
    })

    describe(`Correctness. For ${tests} random r in (1,n), encrypt r with publicKey and then decrypt with privateKey: D(E(r))`, function () {
      it('all should return r', function () {
        let testPassed = true
        for (let i = 0; i < tests; i++) {
          numbers[i] = bcu.randBetween(keyPair.publicKey.n)
          ciphertexts[i] = keyPair.publicKey.encrypt(numbers[i])
          const decrypted = keyPair.privateKey.decrypt(ciphertexts[i])
          if (numbers[i] !== decrypted) {
            testPassed = false
            break
          }
        }
        chai.expect(testPassed).equals(true)
      })
    })

    describe('Homomorphic properties', function () {
      describe(`Homomorphic addtion: D( E(m1)·...·E(m${tests})) mod n^2 )`, function () {
        it(`should return m1+...+m${tests} mod n`, function () {
          const encSum = keyPair.publicKey.addition(...ciphertexts)
          const d = keyPair.privateKey.decrypt(encSum)
          const sumNumbers = numbers.reduce((sum, next) => (sum + next) % keyPair.publicKey.n)
          chai.expect(d === sumNumbers)
        })
      })
      describe(`For all the ${tests} random r, the (pseudo-)homomorphic multiplication: D( E(r)^r mod n^2 )`, function () {
        it('should return r^2 mod n', function () {
          let testPassed = true
          for (let i = 0; i < numbers.length; i++) {
            const encMul = keyPair.publicKey.multiply(ciphertexts[i], numbers[i])
            const d = keyPair.privateKey.decrypt(encMul)
            if (d !== bcu.modPow(numbers[i], 2, keyPair.publicKey.n)) {
              testPassed = false
              break
            }
          }
          chai.expect(testPassed).equals(true)
        })
      })
    })
  })
}
describe('Testing generateRandomKeysSync() NOT RECOMMENDED', function () {
  this.timeout(120000)
  it('it should return a publicKey and a privateKey of the expected bitlength', function () {
    const keyPair = _pkg.generateRandomKeysSync(2048, true)
    chai.expect(keyPair.publicKey).to.be.an.instanceOf(_pkg.PublicKey)
    chai.expect(keyPair.privateKey).to.be.an.instanceOf(_pkg.PrivateKey)
    chai.expect(keyPair.publicKey.bitLength).to.equal(2048)
    const keyPair2 = _pkg.generateRandomKeysSync()
    chai.expect(keyPair2.publicKey).to.be.an.instanceOf(_pkg.PublicKey)
    chai.expect(keyPair2.privateKey).to.be.an.instanceOf(_pkg.PrivateKey)
    chai.expect(keyPair2.publicKey.bitLength).to.equal(3072)
  })
})
describe('recover encryption random factor from cryptogram', function () {
  this.timeout(120000)
  const tests = 50
  it(`should return r in all the ${tests} test with random cleartext msg and random number`, async function () {
    let testPassed = true
    const keyPair = await _pkg.generateRandomKeys(512, true)
    for (let i = 0; i < tests; i++) {
      const m = bcu.randBetween(keyPair.publicKey.n)
      const r = bcu.randBetween(keyPair.publicKey.n)
      const c = keyPair.publicKey.encrypt(m, r)
      testPassed = r === keyPair.privateKey.getRandomFactor(c)
      if (!testPassed) {
        console.log('r = ', r)
        console.log('recoverd r = ', keyPair.privateKey.getRandomFactor(c))
        break
      }
    }
    chai.expect(testPassed).equals(true)
  })
  describe('If g != n + 1', function () {
    it('should throw RangeError', async function () {
      const keyPair = await _pkg.generateRandomKeys(512)
      const m = bcu.randBetween(keyPair.publicKey.n)
      const r = bcu.randBetween(keyPair.publicKey.n)
      const c = keyPair.publicKey.encrypt(m, r)
      chai.expect(() => keyPair.privateKey.getRandomFactor(c)).to.throw(RangeError)
    })
  })
  describe('If no p or q in the private key', function () {
    it('should throw Error', async function () {
      const keyPair = await _pkg.generateRandomKeys(512, true)
      const privKey = new _pkg.PrivateKey(keyPair.privateKey.lambda, keyPair.privateKey.mu, keyPair.publicKey)
      const m = bcu.randBetween(keyPair.publicKey.n)
      const r = bcu.randBetween(keyPair.publicKey.n)
      const c = keyPair.publicKey.encrypt(m, r)
      chai.expect(() => privKey.getRandomFactor(c)).to.throw(Error)
    })
  })
})
