#include <napi.h>
#include <assert.h>
#include <string>

#include "Crypto.h"
#include "XSLT.h"

using namespace std;

Napi::Value DecodeEncryptedPrivateKey(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  string key = info[0].As<Napi::String>().Utf8Value();
  string pwd = info[1].As<Napi::String>().Utf8Value();
  string decoded = DecodePKCS8(key, pwd);
  Napi::String dec = Napi::String::New(env, decoded);
  return dec;
}

Napi::Value ExtractCertificateSerial(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  string cer = info[0].As<Napi::String>().Utf8Value();
  string serial = CertificateSerial(cer);
  Napi::String dec = Napi::String::New(env, serial);
  return dec;
}

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
  exports.Set(Napi::String::New(env, "DecodePKCS8"),
              Napi::Function::New(env, DecodeEncryptedPrivateKey));
  exports.Set(Napi::String::New(env, "CertificateSerial"),
              Napi::Function::New(env, ExtractCertificateSerial));
  return exports;
}

NODE_API_MODULE(hello, Init)