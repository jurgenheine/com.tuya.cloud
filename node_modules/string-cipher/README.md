# String-Cipher

[![unit test](https://github.com/limplash/string-cipher/actions/workflows/unit-test.yml/badge.svg)](https://github.com/limplash/string-cipher/actions/workflows/unit-test.yml)
[![eslint](https://github.com/limplash/string-cipher/actions/workflows/eslint.yml/badge.svg)](https://github.com/limplash/string-cipher/actions/workflows/eslint.yml)

Simple set of crypto function for encrypting and decrypting UTF-8/ACSII strings. The module uses AES-GCM (128, 192 and 256) bases on Node crypto module.  Solution used is based on this [gist](https://gist.github.com/AndiDittrich/4629e7db04819244e843). By using AES-GCM encryption chiper text is authenticated as well. Base of this module are the make functions that generate desired encrypt and decrypt functions. 

Written in Typescript as an ES6 module, all functions are provided in Sync and Async versions. In order to imporve over all security scheme, user supplied `Password` and random `Salt` is used to drive a key using pbkdf2 (with default iterations of 1, for speed but this can be changed using options). The key length depends on the AES-GCM version (128/192/256 use 16/24/32 bit keys) other values are defaulted to values specified by [RFC 5288](https://tools.ietf.org/html/rfc5288)

## Contents

- [Installation and Usage](#installation-and-usage)
- [Customization](#customization)
- [Make functions Option](#make-functions-option)

## Installation and Usage

```sh
npm install --save string-cipher

```
#### Async Api usage
Using async api for string inputs
```javascript
import { encryptString, decryptString } from 'string-cipher';

const fetchedPassword = 'password'; // fetched from secure location not to placed in code like this 
const plainText = 'test string'; // utf-8 strings
const cipherText = await encryptString(plainText, fetchedPassword);
const retrivedText = await decryptString(cipherText, fetchedPassword);
```
Using async api for JSON inputs
```javascript
import { encryptJson, decryptJson } from 'string-cipher';

const fetchedPassword = 'password'; // fetched from secure location not to placed in code like this 
const plainJson = { "field": "value" }; // any object that can be stringifed by JSON.stringify
const cipherJson = await encryptJson(plainJson, fetchedPassword);
const retrivedJson = await decryptJson(cipherJson, fetchedPassword);
```
#### Sync Api usage
Using sync api for string inputs
```javascript
import { encryptStringSync, decryptStringSync } from 'string-cipher';

const fetchedPassword = 'password'; // fetched from secure location not to placed in code like this 
const plainText = 'test string'; // utf-8 strings
const cipherText = encryptStringSync(plainText, fetchedPassword);
const retrivedText = decryptStringSync(cipherText, fetchedPassword);
```
Using sync api for JSON inputs
```javascript
import { encryptJsonSync, decryptJsonSync } from 'string-cipher';

const fetchedPassword = 'password'; // fetched from secure location not to placed in code like this 
const plainJson = { "field": "value" }; // any object that can be stringifed by JSON.stringify
const cipherJson = encryptJsonSync(plainJson, fetchedPassword);
const retrivedJson = decryptJsonSync(cipherJson, fetchedPassword);
```
## Customization
With the help of make functions provided by the module you can customize the encryption and decrption setting. Note that same configuration should be appiled to both  `makeStringEncrypter` and `makeStringDecrypter` 

```javascript
import { makeStringEncrypter, makeStringDecrypter } from 'string-cipher';

const commonOptions = {
  algorithm: 'aes-128-gcm',
  stringEncoding = 'ascii',
  authTagLength = 8,
  ivLength = 8,
  saltLength = 8,
  iterations = 10,
  digest = 'sha256'
}

const customEncrypt = makeStringEncrypter({
  outputEncoding = 'hex',
  ...commonOptions
});
const customEncryptJson = (payload, password) => customEncrypt(JSON.stringify(payload), password);

const customDecrypt = makeStringDecrypter({
  inputEncoding = 'hex',
  ...commonOptions
});
const customDecryptJson = async (payload, password) => JSON.parse(await customDecrypt(payload, password));

const fetchedPassword = 'password'; // fetched from secure location not to placed in code like this 
const plainText = 'test string';
const cipherText = await customEncrypt(plainText, fetchedPassword);
const retrivedText = await customDecrypt(cipherText, fetchedPassword);

```
`makeStringEncrypterSync` and `makeStringDecrypterSync` functions can used to generate Sync versions of cutomized encrypt and decrypt functions.
## Make Functions Option
|Option|Type|Required|Values|Default|Notes|
|------|----|--------|------|-------|-----|
|algorithm|CipherGCMTypes|Yes|`aes-256-gcm`,`aes-128-gcm`,`aes-192-gcm`|none||
|stringEncoding|string|No|`utf8`,`ascii`|`utf8`|encoding format of the input string|
|outputEncoding|string|No|`base64`,`hex`|`base64`|only for encryption function output format|
|inputEncoding|string|No|`base64`,`hex`|`base64`|only for decryption function input format|
|ivLength|number|No|any number|12|Security of encryption depends on this 12 is recomemded|  
|authTagLength|number|No|any number|16|Security of encryption depends on this 16 is recomemded|
|saltLength|number|No|any number|32|Used for password generation|
|iterations|number|No|any number|1|Used by pbkdf2 to drive key, main factor is speed|
|digest|string|No|`sha25`,`sha512`|`sha256`|Used by pbkdf2 to drive key|

