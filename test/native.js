const native_utils = require('../dist/native_utils.node');

const key = './test/LAN7008173R5.key';
const cer = './test/LAN7008173R5.cer';
const pwd = '12345678a';

console.log(native_utils.DecodePKCS8(key, pwd));
console.log('--------------------------------');
console.log(native_utils.CertificateSerial(cer));