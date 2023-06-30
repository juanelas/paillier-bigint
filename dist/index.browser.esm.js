import*as t from"bigint-crypto-utils";class n{constructor(t,n){this.n=t,this._n2=this.n**2n,this.g=n}get bitLength(){return t.bitLength(this.n)}encrypt(n,i){if(void 0===i)do{i=t.randBetween(this.n)}while(1n!==t.gcd(i,this.n));return t.modPow(this.g,n,this._n2)*t.modPow(i,this.n,this._n2)%this._n2}addition(...t){return t.reduce(((t,n)=>t*n%this._n2),1n)}plaintextAddition(n,...i){return i.reduce(((n,i)=>n*t.modPow(this.g,i,this._n2)%this._n2),n)}multiply(n,i){return t.modPow(n,i,this._n2)}}class i{constructor(t,n,i,e,o){this.lambda=t,this.mu=n,this._p=e,this._q=o,this.publicKey=i}get bitLength(){return t.bitLength(this.publicKey.n)}get n(){return this.publicKey.n}decrypt(n){return void 0!==this._p&&void 0!==this._q?e(t.modPow(n,this.lambda,this.publicKey._n2,[[this._p,2],[this._q,2]]),this.publicKey.n)*this.mu%this.publicKey.n:e(t.modPow(n,this.lambda,this.publicKey._n2),this.publicKey.n)*this.mu%this.publicKey.n}getRandomFactor(n){if(this.publicKey.g!==this.n+1n)throw RangeError("Cannot recover the random factor if publicKey.g != publicKey.n + 1. You should generate yout keys using the simple variant, e.g. generateRandomKeys(3072, true) )");if(void 0===this._p||void 0===this._q)throw Error("Cannot get random factor without knowing p and q");const i=this.decrypt(n),e=(this._p-1n)*(this._q-1n),o=t.modInv(this.n,e),s=n*(1n-i*this.n)%this.publicKey._n2;return t.modPow(s,o,this.n,[[this._p,1],[this._q,1]])}}function e(t,n){return(t-1n)/n}async function o(o=3072,s=!1){let h,c,u,d,a,l;do{h=await t.prime(Math.floor(o/2)+1),c=await t.prime(Math.floor(o/2)),u=h*c}while(c===h||t.bitLength(u)!==o);if(s)d=u+1n,a=(h-1n)*(c-1n),l=t.modInv(a,u);else{const n=u**2n;d=r(u,n),a=t.lcm(h-1n,c-1n),l=t.modInv(e(t.modPow(d,a,n),u),u)}const p=new n(u,d);return{publicKey:p,privateKey:new i(a,l,p,h,c)}}function s(o=3072,s=!1){let h,c,u,d,a,l;do{h=t.primeSync(Math.floor(o/2)+1),c=t.primeSync(Math.floor(o/2)),u=h*c}while(c===h||t.bitLength(u)!==o);if(s)d=u+1n,a=(h-1n)*(c-1n),l=t.modInv(a,u);else{const n=u**2n;d=r(u,n),a=t.lcm(h-1n,c-1n),l=t.modInv(e(t.modPow(d,a,n),u),u)}const p=new n(u,d);return{publicKey:p,privateKey:new i(a,l,p,h,c)}}function r(n,i){const e=t.randBetween(n),o=t.randBetween(n);return(e*n+1n)*t.modPow(o,n,i)%i}export{i as PrivateKey,n as PublicKey,o as generateRandomKeys,s as generateRandomKeysSync};