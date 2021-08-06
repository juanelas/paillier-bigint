import PublicKey from './PublicKey';
import PrivateKey from './PrivateKey';
export interface KeyPair {
    publicKey: PublicKey;
    privateKey: PrivateKey;
}
/**
 * Generates a pair private, public key for the Paillier cryptosystem.
 *
 * @param bitlength - The bit length of the public modulo
 * @param simplevariant - Use the simple variant to compute the generator (g=n+1). This is REQUIRED if you want to be able to recover the random integer factor used when encrypting with the public key
 *
 * @returns A promise that resolves to a {@link KeyPair} of public, private keys
 */
export declare function generateRandomKeys(bitlength?: number, simpleVariant?: boolean): Promise<KeyPair>;
/**
 * Generates a pair private, public key for the Paillier cryptosystem in synchronous mode.
 * Synchronous mode is NOT RECOMMENDED since it won't use workers and thus it'll be slower and may freeze thw window in browser's javascript.
 *
 * @param bitlength - The bit length of the public modulo
 * @param simplevariant - Use the simple variant to compute the generator (g=n+1)
 *
 * @returns A pair of public, private keys
 */
export declare function generateRandomKeysSync(bitlength?: number, simpleVariant?: boolean): KeyPair;
//# sourceMappingURL=generateRandomKeys.d.ts.map