function n(n){return n>=0?n:-n}function t(n){if("number"==typeof n&&(n=BigInt(n)),1n===n)return 1;let t=1;do{t++;}while((n>>=1n)>1n);return t}function e(n,t){if("number"==typeof n&&(n=BigInt(n)),"number"==typeof t&&(t=BigInt(t)),n<=0n||t<=0n)throw new RangeError("a and b MUST be > 0");let e=0n,r=1n,o=1n,i=0n;for(;0n!==n;){const s=t/n,u=t%n,a=e-o*s,c=r-i*s;t=n,n=u,e=o,r=i,o=a,i=c;}return {g:t,x:e,y:r}}function r(n,t){if("number"==typeof n&&(n=BigInt(n)),"number"==typeof t&&(t=BigInt(t)),t<=0n)throw new RangeError("n must be > 0");const e=n%t;return e<0n?e+t:e}function o(n,t){const o=e(r(n,t),t);if(1n!==o.g)throw new RangeError(`${n.toString()} does not have inverse modulo ${t.toString()}`);return r(o.x,t)}function i(n,t,e){if(n.length!==t.length)throw new RangeError("The remainders and modulos arrays should have the same length");const i=e??t.reduce(((n,t)=>n*t),1n);return t.reduce(((t,e,s)=>{const u=i/e;return r(t+u*o(u,e)%i*n[s]%i,i)}),0n)}function s(t,e){let r="number"==typeof t?BigInt(n(t)):n(t),o="number"==typeof e?BigInt(n(e)):n(e);if(0n===r)return o;if(0n===o)return r;let i=0n;for(;0n===(1n&(r|o));)r>>=1n,o>>=1n,i++;for(;0n===(1n&r);)r>>=1n;do{for(;0n===(1n&o);)o>>=1n;if(r>o){const n=r;r=o,o=n;}o-=r;}while(0n!==o);return r<<i}function u(t,e){return "number"==typeof t&&(t=BigInt(t)),"number"==typeof e&&(e=BigInt(e)),0n===t&&0n===e?BigInt(0):n(t/s(t,e)*e)}function m(n){return n.map((n=>n[0]**(n[1]-1n)*(n[0]-1n))).reduce(((n,t)=>t*n),1n)}function d(t,e,s,u){if("number"==typeof t&&(t=BigInt(t)),"number"==typeof e&&(e=BigInt(e)),"number"==typeof s&&(s=BigInt(s)),s<=0n)throw new RangeError("n must be > 0");if(1n===s)return 0n;if(t=r(t,s),e<0n)return o(d(t,n(e),s,u),s);if(void 0!==u)return function(n,t,e,r){const o=r.map((n=>n[0]**n[1])),s=r.map((n=>m([n]))),u=s.map(((e,r)=>d(n,t%e,o[r])));return i(u,o,e)}(t,e,s,function(n){const t={};return n.forEach((n=>{if("bigint"==typeof n||"number"==typeof n){const e=String(n);void 0===t[e]?t[e]={p:BigInt(n),k:1n}:t[e].k+=1n;}else {const e=String(n[0]);void 0===t[e]?t[e]={p:BigInt(n[0]),k:BigInt(n[1])}:t[e].k+=BigInt(n[1]);}})),Object.values(t).map((n=>[n.p,n.k]))}(u));let a=1n;for(;e>0;)e%2n===1n&&(a=a*t%s),e/=2n,t=t**2n%s;return a}function l(n){let t=0n;for(const e of n.values()){t=(t<<8n)+BigInt(e);}return t}function b(n,t=!1){if(n<1)throw new RangeError("byteLength MUST be > 0");return new Promise((function(e,r){{const r=new Uint8Array(n);if(n<=65536)self.crypto.getRandomValues(r);else for(let t=0;t<Math.ceil(n/65536);t++){const e=65536*t,o=e+65535<n?e+65535:n-1;self.crypto.getRandomValues(r.subarray(e,o));}t&&(r[0]=128|r[0]),e(r);}}))}function h(n,t=!1){if(n<1)throw new RangeError("byteLength MUST be > 0");{const e=new Uint8Array(n);if(n<=65536)self.crypto.getRandomValues(e);else for(let t=0;t<Math.ceil(n/65536);t++){const r=65536*t,o=r+65535<n?r+65535:n-1;self.crypto.getRandomValues(e.subarray(r,o));}return t&&(e[0]=128|e[0]),e}}function w(n,t=!1){if(n<1)throw new RangeError("bitLength MUST be > 0");const e=Math.ceil(n/8),r=n%8;return new Promise(((n,o)=>{b(e,!1).then((function(e){if(0!==r&&(e[0]=e[0]&2**r-1),t){const n=0!==r?2**(r-1):128;e[0]=e[0]|n;}n(e);}));}))}function p(n,t=!1){if(n<1)throw new RangeError("bitLength MUST be > 0");const e=h(Math.ceil(n/8),!1),r=n%8;if(0!==r&&(e[0]=e[0]&2**r-1),t){const n=0!==r?2**(r-1):128;e[0]=e[0]|n;}return e}function y(n,e=1n){if(n<=e)throw new RangeError("Arguments MUST be: max > min");const r=n-e,o=t(r);let i;do{i=l(p(o));}while(i>r);return i+e}let B=!1;function I(n,t=16,e=!1){if("number"==typeof n&&(n=BigInt(n)),n<0n)throw RangeError("w MUST be >= 0");return new Promise(((e,r)=>{const o=new Worker($());o.onmessage=n=>{void 0!==n?.data?._bcu?.isPrime&&(o.terminate(),e(n.data._bcu.isPrime));},o.onmessageerror=n=>{r(n);};const i={_bcu:{rnd:n,iterations:t,id:0}};o.postMessage(i);}))}function S(n,t){if(2n===n)return !0;if(0n===(1n&n)||1n===n)return !1;const e=[3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n,41n,43n,47n,53n,59n,61n,67n,71n,73n,79n,83n,89n,97n,101n,103n,107n,109n,113n,127n,131n,137n,139n,149n,151n,157n,163n,167n,173n,179n,181n,191n,193n,197n,199n,211n,223n,227n,229n,233n,239n,241n,251n,257n,263n,269n,271n,277n,281n,283n,293n,307n,311n,313n,317n,331n,337n,347n,349n,353n,359n,367n,373n,379n,383n,389n,397n,401n,409n,419n,421n,431n,433n,439n,443n,449n,457n,461n,463n,467n,479n,487n,491n,499n,503n,509n,521n,523n,541n,547n,557n,563n,569n,571n,577n,587n,593n,599n,601n,607n,613n,617n,619n,631n,641n,643n,647n,653n,659n,661n,673n,677n,683n,691n,701n,709n,719n,727n,733n,739n,743n,751n,757n,761n,769n,773n,787n,797n,809n,811n,821n,823n,827n,829n,839n,853n,857n,859n,863n,877n,881n,883n,887n,907n,911n,919n,929n,937n,941n,947n,953n,967n,971n,977n,983n,991n,997n,1009n,1013n,1019n,1021n,1031n,1033n,1039n,1049n,1051n,1061n,1063n,1069n,1087n,1091n,1093n,1097n,1103n,1109n,1117n,1123n,1129n,1151n,1153n,1163n,1171n,1181n,1187n,1193n,1201n,1213n,1217n,1223n,1229n,1231n,1237n,1249n,1259n,1277n,1279n,1283n,1289n,1291n,1297n,1301n,1303n,1307n,1319n,1321n,1327n,1361n,1367n,1373n,1381n,1399n,1409n,1423n,1427n,1429n,1433n,1439n,1447n,1451n,1453n,1459n,1471n,1481n,1483n,1487n,1489n,1493n,1499n,1511n,1523n,1531n,1543n,1549n,1553n,1559n,1567n,1571n,1579n,1583n,1597n];for(let t=0;t<e.length&&e[t]<=n;t++){const r=e[t];if(n===r)return !0;if(n%r===0n)return !1}let r=0n;const o=n-1n;let i=o;for(;i%2n===0n;)i/=2n,++r;const s=o/2n**r;do{let t=d(y(o,2n),s,n);if(1n===t||t===o)continue;let e=1;for(;e<r&&(t=d(t,2n,n),t!==o);){if(1n===t)return !1;e++;}if(t!==o)return !1}while(0!=--t);return !0}function $(){let n=`\n  'use strict';\n  const ${e.name} = ${e.toString()};\n  const ${o.name} = ${o.toString()};\n  const ${d.name} = ${d.toString()};\n  const ${r.name} = ${r.toString()};\n  const ${p.name} = ${p.toString()};\n  const ${h.name} = ${h.toString()};\n  const ${y.name} = ${y.toString()};\n  const ${I.name} = ${S.toString()};\n  ${t.toString()};\n  ${l.toString()};`;return n+=`\n  onmessage = async function(msg) {\n    if (msg !== undefined && msg.data !== undefined && msg.data._bcu !== undefined && msg.data._bcu.id !== undefined && msg.data._bcu.iterations !== undefined && msg.data._bcu.rnd !== undefined) {\n      const msgToParent = {\n        _bcu: {\n          isPrime: await ${I.name}(msg.data._bcu.rnd, msg.data._bcu.iterations),\n          value: msg.data._bcu.rnd,\n          id: msg.data._bcu.id\n        }\n      };\n      postMessage(msgToParent);\n    }\n  }`,function(n){n=`(() => {${n}})()`;const t=new Blob([n],{type:"text/javascript"});return window.URL.createObjectURL(t)}(n)}function R(n,t=16){if(n<1)throw new RangeError("bitLength MUST be > 0");if(!B){let e=0n;do{e=l(p(n,!0));}while(!S(e,t));return new Promise((n=>{n(e);}))}return new Promise(((e,r)=>{const o=[],i=(r,i)=>{if(r._bcu.isPrime){for(let n=0;n<o.length;n++)o[n].terminate();for(;o.length>0;)o.pop();e(r._bcu.value);}else {const e=l(p(n,!0));try{const n={_bcu:{rnd:e,iterations:t,id:r._bcu.id}};i.postMessage(n);}catch(n){}}};{const n=$();for(let t=0;t<self.navigator.hardwareConcurrency-1;t++){const t=new Worker(n);t.onmessage=n=>i(n.data,t),o.push(t);}}for(let e=0;e<o.length;e++)w(n,!0).then((function(n){const r=l(n);o[e].postMessage({_bcu:{rnd:r,iterations:t,id:e}});})).catch(r);}))}function M(n,t=16){if(n<1)throw new RangeError("bitLength MUST be > 0");let e=0n;do{e=l(p(n,!0));}while(!S(e,t));return e}void 0!==self.Worker&&(B=!0);

class PublicKey {
    constructor(n, g) {
        this.n = n;
        this._n2 = this.n ** 2n;
        this.g = g;
    }
    get bitLength() {
        return t(this.n);
    }
    encrypt(m, r) {
        if (r === undefined) {
            do {
                r = y(this.n);
            } while (s(r, this.n) !== 1n);
        }
        return (d(this.g, m, this._n2) * d(r, this.n, this._n2)) % this._n2;
    }
    addition(...ciphertexts) {
        return ciphertexts.reduce((sum, next) => sum * next % this._n2, 1n);
    }
    plaintextAddition(ciphertext, ...plaintexts) {
        return plaintexts.reduce((sum, next) => sum * d(this.g, next, this._n2) % this._n2, ciphertext);
    }
    multiply(c, k) {
        return d(c, k, this._n2);
    }
}

class PrivateKey {
    constructor(lambda, mu, publicKey, p, q) {
        this.lambda = lambda;
        this.mu = mu;
        this._p = p;
        this._q = q;
        this.publicKey = publicKey;
    }
    get bitLength() {
        return t(this.publicKey.n);
    }
    get n() {
        return this.publicKey.n;
    }
    decrypt(c) {
        if (this._p !== undefined && this._q !== undefined) {
            return (L(d(c, this.lambda, this.publicKey._n2, [[this._p, 2], [this._q, 2]]), this.publicKey.n) * this.mu) % this.publicKey.n;
        }
        return (L(d(c, this.lambda, this.publicKey._n2), this.publicKey.n) * this.mu) % this.publicKey.n;
    }
    getRandomFactor(c) {
        if (this.publicKey.g !== this.n + 1n)
            throw RangeError('Cannot recover the random factor if publicKey.g != publicKey.n + 1. You should generate yout keys using the simple variant, e.g. generateRandomKeys(3072, true)');
        if (this._p === undefined || this._q === undefined) {
            throw Error('Cannot get random factor without knowing p and q');
        }
        const m = this.decrypt(c);
        const phi = (this._p - 1n) * (this._q - 1n);
        const nInvModPhi = o(this.n, phi);
        const c1 = c * (1n - m * this.n) % this.publicKey._n2;
        return d(c1, nInvModPhi, this.n, [[this._p, 1], [this._q, 1]]);
    }
}
function L(a, n) {
    return (a - 1n) / n;
}

async function generateRandomKeys(bitlength = 3072, simpleVariant = false) {
    let p, q, n, g, lambda, mu;
    do {
        p = await R(Math.floor(bitlength / 2) + 1);
        q = await R(Math.floor(bitlength / 2));
        n = p * q;
    } while (q === p || t(n) !== bitlength);
    if (simpleVariant) {
        g = n + 1n;
        lambda = (p - 1n) * (q - 1n);
        mu = o(lambda, n);
    }
    else {
        const n2 = n ** 2n;
        g = getGenerator(n, n2);
        lambda = u(p - 1n, q - 1n);
        mu = o(L(d(g, lambda, n2), n), n);
    }
    const publicKey = new PublicKey(n, g);
    const privateKey = new PrivateKey(lambda, mu, publicKey, p, q);
    return { publicKey, privateKey };
}
function generateRandomKeysSync(bitlength = 3072, simpleVariant = false) {
    let p, q, n, g, lambda, mu;
    do {
        p = M(Math.floor(bitlength / 2) + 1);
        q = M(Math.floor(bitlength / 2));
        n = p * q;
    } while (q === p || t(n) !== bitlength);
    if (simpleVariant) {
        g = n + 1n;
        lambda = (p - 1n) * (q - 1n);
        mu = o(lambda, n);
    }
    else {
        const n2 = n ** 2n;
        g = getGenerator(n, n2);
        lambda = u(p - 1n, q - 1n);
        mu = o(L(d(g, lambda, n2), n), n);
    }
    const publicKey = new PublicKey(n, g);
    const privateKey = new PrivateKey(lambda, mu, publicKey, p, q);
    return { publicKey, privateKey };
}
function getGenerator(n, n2) {
    const alpha = y(n);
    const beta = y(n);
    return ((alpha * n + 1n) * d(beta, n, n2)) % n2;
}

export { PrivateKey, PublicKey, generateRandomKeys, generateRandomKeysSync };
