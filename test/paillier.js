'use strict'

// Every test file (you can create as many as you want) should start like this
// Please, do NOT touch. They will be automatically removed for browser tests -->
const _pkg = require('../lib/index.node')
const chai = require('chai')
// <--

const bcu = require('bigint-crypto-utils')

const bitLengths = [1024, 2048, 3072]
for (const bitLength of bitLengths) {
  describe(`Testing Paillier with keys of ${bitLength} bits`, function () {
    this.timeout(90000)
    let keyPair
    const tests = 32
    const numbers = []
    const ciphertexts = []

    describe(`generateRandomKeys(${bitLength})`, function () {
      it(`it should return a publicKey and a privateKey with public modulus of ${bitLength} bits`, async function () {
        keyPair = await _pkg.generateRandomKeys(bitLength)
        chai.expect(keyPair.publicKey).to.be.an.instanceOf(_pkg.PublicKey)
        chai.expect(keyPair.privateKey).to.be.an.instanceOf(_pkg.PrivateKey)
        chai.expect(keyPair.publicKey.bitLength).to.equal(bitLength)
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
describe('Testing generateRandomKeysSync(2048) NOT RECOMMENDED', function () {
  this.timeout(90000)
  it('it should return a publicKey and a privateKey with public modulus of 2048 bits', function () {
    const keyPair = _pkg.generateRandomKeysSync(2048)
    chai.expect(keyPair.publicKey).to.be.an.instanceOf(_pkg.PublicKey)
    chai.expect(keyPair.privateKey).to.be.an.instanceOf(_pkg.PrivateKey)
    chai.expect(keyPair.publicKey.bitLength).to.equal(2048)
  })
})
