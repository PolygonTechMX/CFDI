#include "Crypto.h"

string DecodePKCS8(string path, string password)
{
    bool success;
    CkPrivateKey privKey;
    success = privKey.LoadPkcs8EncryptedFile(path.c_str(), password.c_str());
    if (success != true) {
        return "ERROR AL DECODIFICAR";
    }
    return privKey.getPkcs8Pem();
}

string CertificateSerial(string path)
{
    bool success; 
    CkCert cert;
    success = cert.LoadFromFile(path.c_str());
    if (success != true) {
        //std::cout << privKey.lastErrorText() << "\r\n";
        return "ERROR AL DECOFIGICAR";
    }
    return cert.serialNumber();
}