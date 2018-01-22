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

let opensslPath;
let libxmlPath;

if(/^win/.test(process.platform)){
  libxmlPath = path.join(path.resolve(__dirname, '../'), 'lib', 'win','libxml', 'bin');
  opensslPath = path.join(path.resolve(__dirname, '../'), 'lib', 'win', 'openssl', 'bin');
}else if(/^linux/.test(process.platform)){
  
}

function agregarEmisor(cfdi, c) {
  cfdi.elements[0].elements.push({
    type: 'element',
    name: 'cfdi:Emisor',
    attributes: c.cfdi.Emisor
  });
}

function agregarReceptor(cfdi, c) {
  cfdi.elements[0].elements.push({
    type: 'element',
    name: 'cfdi:Receptor',
    attributes: c.cfdi.Receptor
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

  cfdi.elements[0].attributes = c.cfdi.Comprobante;
  cfdi.elements[0].attributes['xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';
  cfdi.elements[0].attributes['xsi:schemaLocation'] = 'http://www.sat.gob.mx/cfd/3 http://www.sat.gob.mx/sitio_internet/cfd/3/cfdv33.xsd';
  cfdi.elements[0].attributes['xmlns:cfdi'] = 'http://www.sat.gob.mx/cfd/3';
  cfdi.elements[0].attributes['Version'] = '3.3';
  cfdi.elements[0].attributes['NoCertificado'] = serialNumber;
  cfdi.elements[0].attributes['Certificado'] = cer;
}

/**
 * Crear nuevo CFDI
 * @class
 */
class CFDI {
  constructor() {
    this.datos = {
      cer: '',
      key: '',
      pas: '',
      cfdi: {
        Comprobante: {},
        Emisor: {},
        Receptor: {},
        Conceptos: [],
        Impuestos: {}
      }
    }
  }

  /**
  * @param {Object} comprobante
  * @param {String} comprobante.Serie
  * @param {String} comprobante.Folio
  * @param {String} comprobante.Fecha
  * @param {String} comprobante.SubTotal
  * @param {String} comprobante.Moneda
  * @param {String} comprobante.Total
  * @param {String} comprobante.TipoDeComprobante
  * @param {String} comprobante.FormaPago
  * @param {String} comprobante.MetodoPago
  * @param {String} comprobante.CondicionesDePago
  * @param {String} comprobante.Descuento
  * @param {String} comprobante.TipoCambio
  * @param {String} comprobante.LugarExpedicion
  */
  comprobante(comprobante){
    this.datos.cfdi.Comprobante = comprobante;
    return this;
  }

  /**
  * @param {Object} emisor
  * @param {String} emisor.Rfc
  * @param {String} emisor.Nombre
  * @param {String} emisor.RegimenFiscal
  */
  emisor(emisor) {
    this.datos.cfdi.Emisor = emisor;
    return this;
  }

  /**
  * @param {Object} receptor
  * @param {String} receptor.Rfc
  * @param {String} receptor.Nombre
  * @param {String} receptor.RegimenFiscal
  */
  receptor(receptor) {
    this.datos.cfdi.Receptor = receptor;
    return this;
  }

  /**
  * @param {Object} impuestos
  * @param {String} impuestos.TotalImpuestosTrasladados
  * @param {Object[]} impuestos.Traslados
  * @param {Object[]} impuestos.Retenciones
  * @param {String} impuestos.Traslados.Impuesto
  * @param {String} impuestos.Traslados.TipoFactor
  * @param {String} impuestos.Traslados.TasaOCuota
  * @param {String} impuestos.Traslados.Importe
  * @param {String} impuestos.Retenciones.Impuesto
  * @param {String} impuestos.Retenciones.TipoFactor
  * @param {String} impuestos.Retenciones.TasaOCuota
  * @param {String} impuestos.Retenciones.Importe
  */
  impuestos(impuestos) {
    this.datos.cfdi.Impuestos = impuestos;
    return this;
  }

  /**
  * @param {Object} concepto
  * @param {String} concepto.ClaveProdServ
  * @param {String} concepto.ClaveUnidad
  * @param {String} concepto.NoIdentificacion
  * @param {String} concepto.Cantidad
  * @param {String} concepto.Unidad
  * @param {String} concepto.Descripcion
  * @param {String} concepto.ValorUnitario
  * @param {String} concepto.Importe
  * @param {String} concepto.Descuento
  * @param {Object} concepto.Impuestos
  * @param {Object[]} concepto.Impuestos.Traslados
  * @param {Object[]} concepto.Impuestos.Retenciones
  * @param {String} concepto.Impuestos.Traslados.Base
  * @param {String} concepto.Impuestos.Traslados.Impuesto
  * @param {String} concepto.Impuestos.Traslados.TipoFactor
  * @param {String} concepto.Impuestos.Traslados.TasaOCuota
  * @param {String} concepto.Impuestos.Traslados.Importe
  * @param {String} concepto.Impuestos.Retenciones.Base
  * @param {String} concepto.Impuestos.Retenciones.Impuesto
  * @param {String} concepto.Impuestos.Retenciones.TipoFactor
  * @param {String} concepto.Impuestos.Retenciones.TasaOCuota
  * @param {String} concepto.Impuestos.Retenciones.Importe
  */
  agregarConcepto(concepto) {
    this.datos.cfdi.Conceptos.push(concepto);
    return this;
  }

  /**
  * @returns {Promise}
  */
  xml() {
    return new Promise((resolve, reject) => {
      try {
        const base = new baseCFDI();
        agregarEmisor(base, this.datos);
        agregarReceptor(base, this.datos);
        this.datos.cfdi.Conceptos.forEach(concepto => agregarConcepto(base, concepto));
        agregarImpuestosGlobal(base, this.datos.cfdi.Impuestos);
        base.elements[0].attributes = this.datos.cfdi.Comprobante;
        base.elements[0].attributes['xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';
        base.elements[0].attributes['xsi:schemaLocation'] = 'http://www.sat.gob.mx/cfd/3 http://www.sat.gob.mx/sitio_internet/cfd/3/cfdv33.xsd';
        base.elements[0].attributes['xmlns:cfdi'] = 'http://www.sat.gob.mx/cfd/3';
        base.elements[0].attributes['Version'] = '3.3';
        const xml = convert.json2xml(base);
        resolve(xml);
      }catch(err) {
        reject(err);
      }
    });
  }

  /**
  * @param {String} cer Directorio del certificado
  * @param {String} key Directorio de la llave
  * @param {String} pas Contraseña de la llave
  * @returns {Promise}
  */
  xmlSellado(cer, key, pas) {
    this.datos.cer = cer;
    this.datos.key = key;
    this.datos.pas = pas;

    const base = new baseCFDI();
    agregarEmisor(base, this.datos);
    agregarReceptor(base, this.datos);
    this.datos.cfdi.Conceptos.forEach(concepto => agregarConcepto(base, concepto));
    agregarImpuestosGlobal(base, this.datos.cfdi.Impuestos);
    certificarCFDI(base, this.datos);
    FileSystem.manageDirectoryTemp('create');
    const fullPath = `./tmp/${FileSystem.generateNameTemp()}.xml`;
    fs.writeFileSync(fullPath, convert.json2xml(base), 'utf8');
    const stylesheet = path.join(__dirname, 'resources', 'cadenaoriginal_3_3.xslt');
    return xsltproc({ xsltproc_path: libxmlPath })
    .transform([stylesheet, fullPath])
    .then(cadena => {
      FileSystem.manageDirectoryTemp('delete');
      const pem = openssl.decryptPKCS8PrivateKey({
        openssl_path: opensslPath,
        in: key,
        pass: pas
      });
      if(pem != false){
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(cadena.result);
        const sello = sign.sign(pem.trim(), 'base64');
        base.elements[0].attributes['Sello'] = sello;
        const xml = convert.json2xml(base);
        return xml;
      }else{
        reject('Error al combertir certificado');
      }
    });
  }
}

module.exports = CFDI;