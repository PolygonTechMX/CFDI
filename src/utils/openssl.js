"use strict";
const execFile = require('child_process').execFile;
const execFileSync = require('child_process').execFileSync;
const assert = require('assert');
const path = require('path');


exports.decryptPKCS8PrivateKey = (options) => {
    process.env.OPENSSL_CONF =  path.join(options.openssl_path, 'openssl.cfg');
    let openssl_bin = path.join(options.openssl_path || '', 'openssl');
    try {
        let ans = execFileSync(openssl_bin, ['pkcs8', '-inform', 'DER', '-in', `${options.in}`, '-outform', 'PEM', '-passin', `pass:${options.pass}`]);
        return ans.toString('utf8');
	} catch (ex) {
        return false;
		throw new Error(`Error al ejecutar ${openssl_bin}`);
	}
}