"use strict";

const spawn = require('child_process').spawn;
const path = require('path');


exports.decryptPKCS8PrivateKey = (options) => {
    return new Promise((resolve, reject) => {
        process.env.OPENSSL_CONF =  path.join(options.openssl_path, 'openssl.cfg');
        const openssl_pms = ['pkcs8', '-inform', 'DER', '-in', `${options.in}`, '-outform', 'PEM', '-passin', `pass:${options.pass}`];
        const openssl_bin = path.join(options.openssl_path || '', 'openssl');
        const openssl_spw = spawn(openssl_bin, openssl_pms);

        const outResult = [];
        let outLength = 0;
        const errResult = [];
        let errLength = 0;
    
        openssl_spw.stdout.on('data', data => {
            outLength += data.length;
            outResult.push(data);
        });
        
        openssl_spw.stderr.on('data', data => {
            errLength += data.length;
            errResult.push(data);
        });

        openssl_spw.on('error', err => {
            reject(err.message);
        });

        openssl_spw.on('close', code => {
            const stdout = Buffer.concat(outResult, outLength);
            const stderr = Buffer.concat(errResult, errLength).toString('utf8');
            
            if(stdout.toString('utf8') != ''){
                resolve(stdout.toString('utf8'));
            }
            reject(stderr.toString('utf8'));
        });
    });
}