declare class PublicKey {
    readonly n: bigint;
    readonly g: bigint;
    readonly _n2: bigint;
    constructor(n: bigint, g: bigint);
    get bitLength(): number;
    encrypt(m: bigint, r?: bigint): bigint;
    addition(...ciphertexts: bigint[]): bigint;
    plaintextAddition(ciphertext: bigint, ...plaintexts: bigint[]): bigint;
    multiply(c: bigint, k: bigint | number): bigint;
}

declare class PrivateKey {
    readonly lambda: bigint;
    readonly mu: bigint;
    readonly publicKey: PublicKey;
    private readonly _p?;
    private readonly _q?;
    constructor(lambda: bigint, mu: bigint, publicKey: PublicKey, p?: bigint, q?: bigint);
    get bitLength(): number;
    get n(): bigint;
    decrypt(c: bigint): bigint;
    getRandomFactor(c: bigint): bigint;
}

interface KeyPair {
    publicKey: PublicKey;
    privateKey: PrivateKey;
}
declare function generateRandomKeys(bitlength?: number, simpleVariant?: boolean): Promise<KeyPair>;
declare function generateRandomKeysSync(bitlength?: number, simpleVariant?: boolean): KeyPair;

export { KeyPair, PrivateKey, PublicKey, generateRandomKeys, generateRandomKeysSync };
