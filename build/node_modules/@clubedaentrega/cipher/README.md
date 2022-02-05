# @clubedaentrega/cipher
Encrypt/decrypt data using [AES-128-GCM](https://en.wikipedia.org/wiki/Galois/Counter_Mode) easily

## Install
`npm install @clubedaentrega/cipher --save`

## Usage
```js
// `key` is either a Buffer with 16 bytes or a hex-encoded-string
var key = '<a 128 bit key = 32 hex-chars>'
var cipher = require('@clubedaentrega/cipher')(key)

var cipherText = cipher.encrypt('some data')

var plainText = cipher.decrypt(cipherText) // 'some data'
var invalid = cipher.decrypt('invalid cipher text') // undefined
```

Create your encryption key with something like `crypto.randomBytes(16)`
