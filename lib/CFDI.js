'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const convert = require('xml-js');
const xsltproc = require('node-xsltproc');
const forge = require('node-forge');
const openssl = require('./utils/openssl');
const pki = forge.pki;

const baseCFDI = require('./utils/base');
const FileSystem = require('./utils/FileSystem');

function agregarEmisor(cfdi, c) {
  cfdi.elements[0].elements.push({
    type: 'element',
    name: 'cfdi:Emisor',
    attributes: c.Factura.Emisor
  });
}

function agregarReceptor(cfdi, c) {
  cfdi.elements[0].elements.push({
    type: 'element',
    name: 'cfdi:Receptor',
    attributes: c.Factura.Receptor
  });
}

function agregarConcepto(cfdi, c) {
  // AGREGAR BASE DE CONCEPTOS
  if(cfdi.elements[0].elements.length === 2){
    cfdi.elements[0].elements.push({
      type: 'element',
      name: 'cfdi:Conceptos',
      elements: []
    });
  }
  // RUTA BASE DE CONCEPTOS
  const base = cfdi.elements[0].elements[2].elements;
  // AGREGAR CONCEPTO A CONCEPTOS
  const attrConcepto = JSON.parse(JSON.stringify(c));
  delete attrConcepto.Impuestos;
  const concepto = {
    type: 'element',
    name: 'cfdi:Concepto',
    attributes: attrConcepto,
    elements: []
  };

  // AGREGAR IMPUESTOS A CONCEPTO
  concepto.elements.push({
    type: 'element',
    name: 'cfdi:Impuestos',
    elements: []
  });

  // AGREGAR TRASLADOS A IMPUESTOS
  concepto.elements[0].elements.push({
    type: 'element',
    name: 'cfdi:Traslados',
    elements: []
  });

  // RECORRER TRASLADOS
  c.Impuestos.Traslados.forEach(traslado => {
    // AGREGAR TRASLADO A TRASLADOS
    concepto.elements[0].elements[0].elements.push({
      type: 'element',
      name: 'cfdi:Traslado',
      attributes: traslado
    });
  });

  base.push(concepto);
}

function agregarImpuestosGlobal(cfdi, i) {
  // CREANDO BASE DE IMPUESTOS GLOBALES
  const impuestos = {
    type: 'element',
    name: 'cfdi:Impuestos',
    attributes: { TotalImpuestosTrasladados: i.TotalImpuestosTrasladados },
    elements: []
  };

  // AGREGAR TRASLADOS A IMPUESTOS
  impuestos.elements.push({
    type: 'element',
    name: 'cfdi:Traslados',
    elements: []
  });

  // RECORRER TRASLADOS
  i.Traslados.forEach(traslado => {
    // AGREGAR TRASLADO A TRASLADOS
    impuestos.elements[0].elements.push({
      type: 'element',
      name: 'cfdi:Traslado',
      attributes: traslado
    });
  });

  // AGREGAR IMPUESTOS A COMPROBANTE
  cfdi.elements[0].elements.push(impuestos);
}

function certificarCFDI(cfdi, c) {
  // READ .CERT FILE
  const cer = fs.readFileSync(c.cer, 'base64');
  // CONVERTIR A PEM
  const pem = '-----BEGIN CERTIFICATE-----\n' + cer + '\n-----END CERTIFICATE-----';
  // EXTRAER SERIAL Y CONVERTIR DE HEXADECIMAL A STRING
  const serialNumber = pki
    .certificateFromPem(pem)
    .serialNumber.match(/.{1,2}/g)
    .map(function(v) {
      return String.fromCharCode(parseInt(v, 16));
    })
    .join('');

  cfdi.elements[0].attributes = c.Factura.Comprobante;
  cfdi.elements[0].attributes['xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';
  cfdi.elements[0].attributes['xsi:schemaLocation'] = 'http://www.sat.gob.mx/cfd/3 http://www.sat.gob.mx/sitio_internet/cfd/3/cfdv33.xsd';
  cfdi.elements[0].attributes['xmlns:cfdi'] = 'http://www.sat.gob.mx/cfd/3';
  cfdi.elements[0].attributes['Version'] = '3.3';
  cfdi.elements[0].attributes['NoCertificado'] = serialNumber;
  cfdi.elements[0].attributes['Certificado'] = cer;
}

exports.generarXML = d => {
  // CRER NUEVO JSON BASE
  const cfdi = new baseCFDI();
  // AGREGAR EMISOR
  agregarEmisor(cfdi, d);
  // AGREGAR RECEPTOR
  agregarReceptor(cfdi, d);
  // AGREGAR CONCEPTOS
  d.Factura.Conceptos.forEach(concepto => agregarConcepto(cfdi, concepto));
  // AGREGAR IMPUESTOS GLOBALES
  agregarImpuestosGlobal(cfdi, d.Factura.Impuestos);
  // AGREGAR NoCertificado Y Certificado
  certificarCFDI(cfdi, d);

  FileSystem.manageDirectoryTemp('create');
  const fullPath = `./tmp/${FileSystem.generateNameTemp()}.xml`;
  fs.writeFileSync(fullPath, convert.json2xml(cfdi), 'utf8');
  const stylesheet = path.join(__dirname, 'resources', 'cadenaoriginal_3_3.xslt');
  return xsltproc({ xsltproc_path: path.join(__dirname, 'libxml', 'bin') })
    .transform([stylesheet, fullPath])
    .then(cadena => {
      // ELIMINAR CARPETA TEMPORAL
      FileSystem.manageDirectoryTemp('delete');

      // CONVERTIR CER A KEY CON OPENSSL
      const pem = openssl.decryptPKCS8PrivateKey({
        openssl_path: path.join(__dirname, 'openssl', 'bin'),
        in: d.key,
        pass: d.pas
      });
      
      if(pem != false){
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(cadena.result);
        // SELLAR CADENA ORIGINAL
        const sello = sign.sign(pem.trim(), 'base64');
        // AGREGAR SELLO A XML
        cfdi.elements[0].attributes['Sello'] = sello;

        // CONVERTIR A XML
        const xml = convert.json2xml(cfdi);
        return xml;
      }else{
        reject('Error al combertir certificado');
      }
    });
};
