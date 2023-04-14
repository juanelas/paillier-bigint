import*as t from"bigint-crypto-utils";class n{constructor(t,n){this.n=t,this._n2=this.n**2n,this.g=n}get bitLength(){return t.bitLength(this.n)}encrypt(n,i){if(void 0===i)do{i=t.randBetween(this.n)}while(1n!==t.gcd(i,this.n));return t.modPow(this.g,n,this._n2)*t.modPow(i,this.n,this._n2)%this._n2}addition(...t){return t.reduce(((t,n)=>t*n%this._n2),1n)}plaintextAddition(n,...i){return i.reduce(((n,i)=>n*t.modPow(this.g,i,this._n2)%this._n2),n)}multiply(n,i){return t.modPow(n,i,this._n2)}}class i{constructor(t,n,i,e,o){this.lambda=t,this.mu=n,this._p=e,this._q=o,this.publicKey=i}get bitLength(){return t.bitLength(this.publicKey.n)}get n(){return this.publicKey.n}decrypt(n){return e(t.modPow(n,this.lambda,this.publicKey._n2),this.publicKey.n)*this.mu%this.publicKey.n}getRandomFactor(n){if(this.publicKey.g!==this.n+1n)throw RangeError("Cannot recover the random factor if publicKey.g != publicKey.n + 1. You should generate yout keys using the simple variant, e.g. generateRandomKeys(3072, true) )");if(void 0===this._p||void 0===this._q)throw Error("Cannot get random factor without knowing p and q");const i=this.decrypt(n),e=(this._p-1n)*(this._q-1n),o=t.modInv(this.n,e),r=n*(1n-i*this.n)%this.publicKey._n2;return t.modPow(r,o,this.n)}}function e(t,n){return(t-1n)/n}async function o(o=3072,r=!1){let h,c,u,d,a,l;do{h=await t.prime(Math.floor(o/2)+1),c=await t.prime(Math.floor(o/2)),u=h*c}while(c===h||t.bitLength(u)!==o);if(r)d=u+1n,a=(h-1n)*(c-1n),l=t.modInv(a,u);else{const n=u**2n;d=s(u,n),a=t.lcm(h-1n,c-1n),l=t.modInv(e(t.modPow(d,a,n),u),u)}const m=new n(u,d);return{publicKey:m,privateKey:new i(a,l,m,h,c)}}function r(o=3072,r=!1){let h,c,u,d,a,l;do{h=t.primeSync(Math.floor(o/2)+1),c=t.primeSync(Math.floor(o/2)),u=h*c}while(c===h||t.bitLength(u)!==o);if(r)d=u+1n,a=(h-1n)*(c-1n),l=t.modInv(a,u);else{const n=u**2n;d=s(u,n),a=t.lcm(h-1n,c-1n),l=t.modInv(e(t.modPow(d,a,n),u),u)}const m=new n(u,d);return{publicKey:m,privateKey:new i(a,l,m,h,c)}}function s(n,i){const e=t.randBetween(n),o=t.randBetween(n);return(e*n+1n)*t.modPow(o,n,i)%i}export{i as PrivateKey,n as PublicKey,o as generateRandomKeys,r as generateRandomKeysSync};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgubm9kZS5lc20uanMiLCJzb3VyY2VzIjpbIi4uL3NyYy90cy9QdWJsaWNLZXkudHMiLCIuLi9zcmMvdHMvUHJpdmF0ZUtleS50cyIsIi4uL3NyYy90cy9nZW5lcmF0ZVJhbmRvbUtleXMudHMiXSwic291cmNlc0NvbnRlbnQiOm51bGwsIm5hbWVzIjpbIlB1YmxpY0tleSIsImNvbnN0cnVjdG9yIiwibiIsImciLCJ0aGlzIiwiX24yIiwiYml0TGVuZ3RoIiwiYmN1IiwiZW5jcnlwdCIsIm0iLCJyIiwidW5kZWZpbmVkIiwicmFuZEJldHdlZW4iLCJnY2QiLCJtb2RQb3ciLCJhZGRpdGlvbiIsImNpcGhlcnRleHRzIiwicmVkdWNlIiwic3VtIiwibmV4dCIsInBsYWludGV4dEFkZGl0aW9uIiwiY2lwaGVydGV4dCIsInBsYWludGV4dHMiLCJtdWx0aXBseSIsImMiLCJrIiwiUHJpdmF0ZUtleSIsImxhbWJkYSIsIm11IiwicHVibGljS2V5IiwicCIsInEiLCJfcCIsIl9xIiwiZGVjcnlwdCIsIkwiLCJnZXRSYW5kb21GYWN0b3IiLCJSYW5nZUVycm9yIiwiRXJyb3IiLCJwaGkiLCJuSW52TW9kUGhpIiwibW9kSW52IiwiYzEiLCJhIiwiYXN5bmMiLCJnZW5lcmF0ZVJhbmRvbUtleXMiLCJiaXRsZW5ndGgiLCJzaW1wbGVWYXJpYW50IiwicHJpbWUiLCJNYXRoIiwiZmxvb3IiLCJuMiIsImdldEdlbmVyYXRvciIsImxjbSIsInByaXZhdGVLZXkiLCJnZW5lcmF0ZVJhbmRvbUtleXNTeW5jIiwicHJpbWVTeW5jIiwiYWxwaGEiLCJiZXRhIl0sIm1hcHBpbmdzIjoic0NBS2MsTUFBT0EsRUFXbkJDLFlBQWFDLEVBQVdDLEdBQ3RCQyxLQUFLRixFQUFJQSxFQUNURSxLQUFLQyxJQUFNRCxLQUFLRixHQUFLLEdBQ3JCRSxLQUFLRCxFQUFJQSxDQUNWLENBTUdHLGdCQUNGLE9BQU9DLEVBQUlELFVBQVVGLEtBQUtGLEVBQzNCLENBVURNLFFBQVNDLEVBQVdDLEdB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
