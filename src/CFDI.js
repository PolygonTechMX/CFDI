'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const convert = require('xml-js');
const _ = require('lodash');
const xsltproc = require('node-xsltproc');
const forge = require('node-forge');
const openssl = require('./utils/openssl');
const pki = forge.pki;

const baseCFDI = require('./utils/base');
const FileSystem = require('./utils/FileSystem');

function pushConcepto(cfdi, c) {
  const len = cfdi.elements[0].elements.length;
  const inconce = _.findIndex(cfdi.elements[0].elements, { name: 'cfdi:Conceptos' });
  // AGREGAR BASE DE CONCEPTOS
  if(inconce === -1){
    cfdi.elements[0].elements.push({
      order: 3,
      type: 'element',
      name: 'cfdi:Conceptos',
      elements: []
    });
  }
  // RUTA BASE DE CONCEPTOS
  const base = (inconce === -1)? cfdi.elements[0].elements[len].elements: cfdi.elements[0].elements[inconce].elements;
  // AGREGAR CONCEPTO A CONCEPTOS
  const attrConcepto = JSON.parse(JSON.stringify(c));
  delete attrConcepto.Impuestos;
  const concepto = {
    type: 'element',
    name: 'cfdi:Concepto',
    attributes: attrConcepto,
    elements: []
  };

  if(c.Impuestos.Traslados.length > 0 || c.Impuestos.Retenciones.length > 0){
    let index = 0;
    // AGREGAR IMPUESTOS A CONCEPTO
    concepto.elements.push({
      type: 'element',
      name: 'cfdi:Impuestos',
      elements: []
    });

    if(c.Impuestos.Traslados.length > 0){
      // AGREGAR TRASLADOS A IMPUESTOS
      concepto.elements[0].elements.push({
        type: 'element',
        name: 'cfdi:Traslados',
        elements: []
      });

      // RECORRER TRASLADOS
      c.Impuestos.Traslados.forEach(traslado => {
        // AGREGAR TRASLADO A TRASLADOS
        concepto.elements[0].elements[index].elements.push({
          type: 'element',
          name: 'cfdi:Traslado',
          attributes: traslado
        });
      });

      index++;
    }

    if(c.Impuestos.Retenciones.length > 0){
      // AGREGAR RETENCIONES A IMPUESTOS
      concepto.elements[0].elements.push({
        type: 'element',
        name: 'cfdi:Retenciones',
        elements: []
      });

      // RECORRER TRASLADOS
      c.Impuestos.Retenciones.forEach(retencion => {
        // AGREGAR RETENCION A RETENCIONES
        concepto.elements[0].elements[index].elements.push({
          type: 'element',
          name: 'cfdi:Retencion',
          attributes: retencion
        });
      });
    }
  }

  base.push(concepto);
}

class concept {
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
  constructor(concepto){ 
    this.concepto = concepto;
    this.concepto.Impuestos = {
      Traslados: [],
      Retenciones: []
    }

    //console.log(this.opensslDir);
  }

  /**
  * @param {Object} traslado
  * @param {String} traslado.Base
  * @param {String} traslado.Impuesto
  * @param {String} traslado.TipoFactor
  * @param {String} traslado.TasaOCuota
  * @param {String} traslado.Importe
  */
  traslado(traslado){
    this.concepto.Impuestos.Traslados.push(traslado);
    return this;
  }

  /**
  * @param {Object} retencion
  * @param {String} retencion.Base
  * @param {String} retencion.Impuesto
  * @param {String} retencion.TipoFactor
  * @param {String} retencion.TasaOCuota
  * @param {String} retencion.Importe
  */
  retencion(retencion){
    this.concepto.Impuestos.Retenciones.push(retencion);
    return this;
  }

  agregar(cfdi){
    pushConcepto(cfdi.jxml, this.concepto);
  }
}

class CFDI {
  /**
  * @param {String} opensslDir
  * @param {String} libxmlDir
  * @param {String} stylesheetDir
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
  * @param {String} comprobante.Confirmacion,
  */
  constructor(comprobante, opensslDir, libxmlDir, stylesheetDir) {
    this.jxml = new baseCFDI();
    this.jxml.elements[0].attributes = comprobante;
    this.jxml.elements[0].attributes['xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';
    this.jxml.elements[0].attributes['xsi:schemaLocation'] = 'http://www.sat.gob.mx/cfd/3 http://www.sat.gob.mx/sitio_internet/cfd/3/cfdv33.xsd';
    this.jxml.elements[0].attributes['xmlns:cfdi'] = 'http://www.sat.gob.mx/cfd/3';
    this.jxml.elements[0].attributes['Version'] = '3.3';
    this.opensslDir = opensslDir || path.join(path.resolve(__dirname, '../'), 'lib', 'win', 'openssl');
    this.libxmlDir = libxmlDir ||  path.join(path.resolve(__dirname, '../'), 'lib', 'win','libxml');
    this.stylesheetDir = stylesheetDir ||  path.join(__dirname, 'resources', 'cadenaoriginal_3_3.xslt');
  }

  /**
  * @param {Object} relacionados
  * @param {String} relacionados.TipoRelacion
  * @param {String[]} relacionados.CfdiRelacionados
  */
  CfdiRelacionados(relacionados){
    const r =  {
      order: 0,
      type: 'element',
      name: 'cfdi:CfdiRelacionados',
      attributes: { TipoRelacion: relacionados.TipoRelacion },
      elements: []
    };

    (relacionados.CfdiRelacionados).forEach(rel => {
      r.elements.push({
        type: 'element',
        name: 'cfdi:CfdiRelacionado',
        attributes: { UUID: rel }
      });
    });

    this.jxml.elements[0].elements.push(r);
    return this;
  }

  /**
  * @param {Object} emisor
  * @param {String} emisor.Rfc
  * @param {String} emisor.Nombre
  * @param {String} emisor.RegimenFiscal
  */
  emisor(emisor) {
    this.jxml.elements[0].elements.push({
      order: 1,
      type: 'element',
      name: 'cfdi:Emisor',
      attributes: emisor
    });
    return this;
  }

  /**
  * @param {Object} receptor
  * @param {String} receptor.Rfc
  * @param {String} receptor.Nombre
  * @param {String} receptor.RegimenFiscal
  */
  receptor(receptor) {
    this.jxml.elements[0].elements.push({
      order: 2,
      type: 'element',
      name: 'cfdi:Receptor',
      attributes: receptor
    });
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
  impuestos(i) {
    // CREANDO BASE DE IMPUESTOS GLOBALES
    const impuestos = {
      order: 4,
      type: 'element',
      name: 'cfdi:Impuestos',
      attributes: { },
      elements: []
    };

    let index = 0;
    // AGREGAR SI CONTIENE IMPUESTOS TRASLADADOS
    if(_.has(i, 'TotalImpuestosTrasladados')){
      impuestos.attributes['TotalImpuestosTrasladados'] = i.TotalImpuestosTrasladados;

      // AGREGAR TRASLADOS A IMPUESTOS
      impuestos.elements.push({
        type: 'element',
        name: 'cfdi:Traslados',
        elements: []
      });

      // RECORRER TRASLADOS
      i.Traslados.forEach(traslado => {
        // AGREGAR TRASLADO A TRASLADOS
        impuestos.elements[index].elements.push({
          type: 'element',
          name: 'cfdi:Traslado',
          attributes: traslado
        });
      });
      index++;
    }

    // AGREGAR SI CONTIENE IMPUESTOS RETENIDOS
    if(_.has(i, 'TotalImpuestosRetenidos')){
      impuestos.attributes['TotalImpuestosRetenidos'] = i.TotalImpuestosRetenidos;

      // AGREGAR RETENCIONES A IMPUESTOS
      impuestos.elements.push({
        type: 'element',
        name: 'cfdi:Retenciones',
        elements: []
      });

      // RECORRER TRASLADOS
      i.Retenciones.forEach(retencion => {
        // AGREGAR TRASLADO A TRASLADOS
        impuestos.elements[index].elements.push({
          type: 'element',
          name: 'cfdi:Retencion',
          attributes: retencion
        });
      });
    }

    // AGREGAR IMPUESTOS A COMPROBANTE
    this.jxml.elements[0].elements.push(impuestos);
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
  concepto(concepto) {
    return new concept(concepto);
  }

  /**
  * @param {String} certificado
  */
  certificar(certificado) {
    const cer = fs.readFileSync(certificado, 'base64');
    const pem = '-----BEGIN CERTIFICATE-----\n' + cer + '\n-----END CERTIFICATE-----';
    const serialNumber = pki
    .certificateFromPem(pem)
    .serialNumber.match(/.{1,2}/g)
    .map(function(v) {
      return String.fromCharCode(parseInt(v, 16));
    })
    .join('');

    this.jxml.elements[0].attributes['NoCertificado'] = serialNumber;
    this.jxml.elements[0].attributes['Certificado'] = cer;
    return this;
  }

  /**
  * @returns {Promise}
  */
  xml() {
    return new Promise((resolve, reject) => {
      try {
        this.jxml.elements[0].elements =  _.orderBy(this.jxml.elements[0].elements, ['order']);
        const xml = convert.json2xml(this.jxml);
        resolve(xml);
      }catch(err) {
        reject(err);
      }
    });
  }

  /**
  * @param {String} llave Directorio de la llave
  * @param {String} password Contraseña de la llave
  * @returns {Promise}
  */
  xmlSellado(llave, password) {
    if(!fs.existsSync(this.libxmlDir)) return Promise.reject("No se encontro libxml en la ruta: "+ this.libxmlDir);
    if(!fs.existsSync(this.opensslDir)) return Promise.reject("No se encontro openss en la ruta: "+ this.opensslDir);

    const fullPath = path.join(os.tmpdir(), `${FileSystem.generateNameTemp()}.xml`);
    this.jxml.elements[0].elements =  _.orderBy(this.jxml.elements[0].elements, ['order']);
    fs.writeFileSync(fullPath, convert.json2xml(this.jxml), 'utf8');
    return xsltproc({ xsltproc_path: this.libxmlDir })
    .transform([this.stylesheetDir, fullPath])
    .then(cadena => {
      fs.unlinkSync(fullPath);

      return Promise.all([
        cadena,
        openssl.decryptPKCS8PrivateKey({
          openssl_path: this.opensslDir,
          in: llave,
          pass: password
        })
      ]);
    })
    .then((prm) => {
      const pem = prm[1];
      const cadena = prm[0];
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(cadena.result);
      const sello = sign.sign(pem.trim(), 'base64');
      this.jxml.elements[0].attributes['Sello'] = sello;
      return convert.json2xml(this.jxml);
    });
  }
}

module.exports = CFDI;