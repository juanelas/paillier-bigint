import*as t from"bigint-crypto-utils";class n{constructor(t,n){this.n=t,this._n2=this.n**2n,this.g=n}get bitLength(){return t.bitLength(this.n)}encrypt(n,i){if(void 0===i)do{i=t.randBetween(this.n)}while(1n!==t.gcd(i,this.n));return t.modPow(this.g,n,this._n2)*t.modPow(i,this.n,this._n2)%this._n2}addition(...t){return t.reduce(((t,n)=>t*n%this._n2),1n)}plaintextAddition(n,...i){return i.reduce(((n,i)=>n*t.modPow(this.g,i,this._n2)%this._n2),n)}multiply(n,i){return t.modPow(n,i,this._n2)}}class i{constructor(t,n,i,e,o){this.lambda=t,this.mu=n,this._p=e,this._q=o,this.publicKey=i}get bitLength(){return t.bitLength(this.publicKey.n)}get n(){return this.publicKey.n}decrypt(n){return void 0!==this._p&&void 0!==this._q?e(t.modPow(n,this.lambda,this.publicKey._n2,[[this._p,2],[this._q,2]]),this.publicKey.n)*this.mu%this.publicKey.n:e(t.modPow(n,this.lambda,this.publicKey._n2),this.publicKey.n)*this.mu%this.publicKey.n}getRandomFactor(n){if(this.publicKey.g!==this.n+1n)throw RangeError("Cannot recover the random factor if publicKey.g != publicKey.n + 1. You should generate yout keys using the simple variant, e.g. generateRandomKeys(3072, true) )");if(void 0===this._p||void 0===this._q)throw Error("Cannot get random factor without knowing p and q");const i=this.decrypt(n),e=(this._p-1n)*(this._q-1n),o=t.modInv(this.n,e),s=n*(1n-i*this.n)%this.publicKey._n2;return t.modPow(s,o,this.n,[[this._p,1],[this._q,1]])}}function e(t,n){return(t-1n)/n}async function o(o=3072,s=!1){let h,c,u,d,a,l;do{h=await t.prime(Math.floor(o/2)+1),c=await t.prime(Math.floor(o/2)),u=h*c}while(c===h||t.bitLength(u)!==o);if(s)d=u+1n,a=(h-1n)*(c-1n),l=t.modInv(a,u);else{const n=u**2n;d=r(u,n),a=t.lcm(h-1n,c-1n),l=t.modInv(e(t.modPow(d,a,n),u),u)}const p=new n(u,d);return{publicKey:p,privateKey:new i(a,l,p,h,c)}}function s(o=3072,s=!1){let h,c,u,d,a,l;do{h=t.primeSync(Math.floor(o/2)+1),c=t.primeSync(Math.floor(o/2)),u=h*c}while(c===h||t.bitLength(u)!==o);if(s)d=u+1n,a=(h-1n)*(c-1n),l=t.modInv(a,u);else{const n=u**2n;d=r(u,n),a=t.lcm(h-1n,c-1n),l=t.modInv(e(t.modPow(d,a,n),u),u)}const p=new n(u,d);return{publicKey:p,privateKey:new i(a,l,p,h,c)}}function r(n,i){const e=t.randBetween(n),o=t.randBetween(n);return(e*n+1n)*t.modPow(o,n,i)%i}export{i as PrivateKey,n as PublicKey,o as generateRandomKeys,s as generateRandomKeysSync};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgubm9kZS5lc20uanMiLCJzb3VyY2VzIjpbIi4uL3NyYy90cy9QdWJsaWNLZXkudHMiLCIuLi9zcmMvdHMvUHJpdmF0ZUtleS50cyIsIi4uL3NyYy90cy9nZW5lcmF0ZVJhbmRvbUtleXMudHMiXSwic291cmNlc0NvbnRlbnQiOm51bGwsIm5hbWVzIjpbIlB1YmxpY0tleSIsImNvbnN0cnVjdG9yIiwibiIsImciLCJ0aGlzIiwiX24yIiwiYml0TGVuZ3RoIiwiYmN1IiwiZW5jcnlwdCIsIm0iLCJyIiwidW5kZWZpbmVkIiwicmFuZEJldHdlZW4iLCJnY2QiLCJtb2RQb3ciLCJhZGRpdGlvbiIsImNpcGhlcnRleHRzIiwicmVkdWNlIiwic3VtIiwibmV4dCIsInBsYWludGV4dEFkZGl0aW9uIiwiY2lwaGVydGV4dCIsInBsYWludGV4dHMiLCJtdWx0aXBseSIsImMiLCJrIiwiUHJpdmF0ZUtleSIsImxhbWJkYSIsIm11IiwicHVibGljS2V5IiwicCIsInEiLCJfcCIsIl9xIiwiZGVjcnlwdCIsIkwiLCJnZXRSYW5kb21GYWN0b3IiLCJSYW5nZUVycm9yIiwiRXJyb3IiLCJwaGkiLCJuSW52TW9kUGhpIiwibW9kSW52IiwiYzEiLCJhIiwiYXN5bmMiLCJnZW5lcmF0ZVJhbmRvbUtleXMiLCJiaXRsZW5ndGgiLCJzaW1wbGVWYXJpYW50IiwicHJpbWUiLCJNYXRoIiwiZmxvb3IiLCJuMiIsImdldEdlbmVyYXRvciIsImxjbSIsInByaXZhdGVLZXkiLCJnZW5lcmF0ZVJhbmRvbUtleXNTeW5jIiwicHJpbWVTeW5jIiwiYWxwaGEiLCJiZXRhIl0sIm1hcHBpbmdzIjoic0NBS2MsTUFBT0EsRUFXbkJDLFlBQWFDLEVBQVdDLEdBQ3RCQyxLQUFLRixFQUFJQSxFQUNURSxLQUFLQyxJQUFNRCxLQUFLRixHQUFLLEdBQ3JCRSxLQUFLRCxFQUFJQSxDQUNWLENBTUdHLGdCQUNGLE9BQU9DLEVBQUlELFVBQVVGLEtBQUtGLEVBQzNCLENBVURNLFFBQVNDLEVBQVdDLEdB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