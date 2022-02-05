'use strict'

var crypto = require('crypto'),
	algorithm = 'aes-128-gcm'

/**
 * @param {Buffer|string} key - 16 bytes
 * @class
 */
function Cipher(key) {
	if (typeof key === 'string') {
		key = new Buffer(key, 'hex')
	}

	if (key.length !== 16) {
		throw new Error('The key should have 16 bytes (128 bits)')
	}

	/**
	 * @member {Buffer}
	 * @private
	 */
	this._key = key
}

/**
 * @param {Buffer|string} key
 * @returns {Cipher}
 */
module.exports = function (key) {
	return new Cipher(key)
}

module.exports.Cipher = Cipher

/**
 * @param {string} plaintext
 * @returns {string} - alpha numeric
 */
Cipher.prototype.encrypt = function (plaintext) {
	var iv = crypto.randomBytes(12),
		cipher = crypto.createCipheriv(algorithm, this._key, iv)
	cipher.end(new Buffer(plaintext))
	return algorithm + ' ' +
		iv.toString('hex') + ' ' +
		cipher.read().toString('hex') + ' ' +
		cipher.getAuthTag().toString('hex')
}

/**
 * @param {string} ciphertext
 * @returns {?string} - undefined if invalid
 */
Cipher.prototype.decrypt = function (ciphertext) {
	var parts = ciphertext.split(' ')
	if (parts.length !== 4 || parts[0] !== algorithm) {
		return
	}

	var iv = new Buffer(parts[1], 'hex'),
		data = new Buffer(parts[2], 'hex'),
		authTag = new Buffer(parts[3], 'hex'),
		decipher = crypto.createDecipheriv(algorithm, this._key, iv),
		ok = true

	// The 'error' event is sync
	decipher.on('error', function () {
		ok = false
	})

	decipher.setAuthTag(authTag)
	decipher.end(data)
	return ok ? decipher.read().toString() : undefined
}