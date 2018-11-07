#ifndef CRYPTO_H    // To make sure you don't declare the function more than once by including the header multiple times.
#define CRYPTO_H 

#include <stdio.h>
#include <iostream>
#include <string>
#include <chilkat/CkCert.h>
#include <chilkat/CkPrivateKey.h>

using namespace std;

string DecodePKCS8(const string path, const string password);
string CertificateSerial(const string path);

#endif