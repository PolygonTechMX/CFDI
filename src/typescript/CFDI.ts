import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as convert from 'xml-js';
import * as _ from 'lodash';
import * as xsltproc from 'node-xsltproc';
import {
  IComprobante,
  IEmisorReceptor,
  IRelacionados,
  IImpuestos,
  IConcepto
} from './interfaces';
import { concept } from './concepto';
import { FileSystem } from './FileSystem';
const NU = require('native_utils.node');

class CFDI {
  as: IImpuestos;
  private jxml = {
    declaration: {
      attributes: {
        version: '1.0',
        encoding: 'UTF-8'
      }
    },
    elements: [
      {
        type: 'element',
        name: 'cfdi:Comprobante',
        attributes: {},
        elements: []
      }
    ]
  };

  constructor(
    private comprobante: IComprobante,
    private libxmlDir: string,
    private stylesheetDir: string
  ) {
    this.jxml.elements[0].attributes = comprobante;
    this.jxml.elements[0].attributes['xmlns:xsi'] =
      'http://www.w3.org/2001/XMLSchema-instance';
    this.jxml.elements[0].attributes['xsi:schemaLocation'] =
      'http://www.sat.gob.mx/cfd/3 http://www.sat.gob.mx/sitio_internet/cfd/3/cfdv33.xsd';
    this.jxml.elements[0].attributes['xmlns:cfdi'] =
      'http://www.sat.gob.mx/cfd/3';
    this.jxml.elements[0].attributes['Version'] = '3.3';
    this.libxmlDir =
      libxmlDir ||
      path.join(path.resolve(__dirname, '../'), 'lib', 'win', 'libxml');
    this.stylesheetDir =
      stylesheetDir ||
      path.join(__dirname, '..', 'resources', 'cadenaoriginal_3_3.xslt');
  }

  emisor(emisor: IEmisorReceptor) {
    this.jxml.elements[0].elements.push({
      order: 1,
      type: 'element',
      name: 'cfdi:Emisor',
      attributes: emisor
    });
    return this;
  }

  receptor(receptor: IEmisorReceptor) {
    this.jxml.elements[0].elements.push({
      order: 2,
      type: 'element',
      name: 'cfdi:Receptor',
      attributes: receptor
    });
    return this;
  }

  CfdiRelacionados(relacionados: IRelacionados) {
    const r = {
      order: 0,
      type: 'element',
      name: 'cfdi:CfdiRelacionados',
      attributes: { TipoRelacion: relacionados.TipoRelacion },
      elements: []
    };

    relacionados.CfdiRelacionados.forEach(rel => {
      r.elements.push({
        type: 'element',
        name: 'cfdi:CfdiRelacionado',
        attributes: { UUID: rel }
      });
    });

    this.jxml.elements[0].elements.push(r);
    return this;
  }

  impuestos(i: IImpuestos) {
    // CREANDO BASE DE IMPUESTOS GLOBALES
    const impuestos = {
      order: 4,
      type: 'element',
      name: 'cfdi:Impuestos',
      attributes: {},
      elements: []
    };

    let index = 0;
    // AGREGAR SI CONTIENE IMPUESTOS TRASLADADOS
    if (_.has(i, 'TotalImpuestosTrasladados')) {
      impuestos.attributes['TotalImpuestosTrasladados'] =
        i.TotalImpuestosTrasladados;

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
    if (_.has(i, 'TotalImpuestosRetenidos')) {
      impuestos.attributes['TotalImpuestosRetenidos'] =
        i.TotalImpuestosRetenidos;

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

  concepto(concepto: IConcepto) {
    return new concept(concepto);
  }

  certificar(certificado: string): this {
    const cer = fs.readFileSync(certificado, 'base64');
    const pem =
      '-----BEGIN CERTIFICATE-----\n' + cer + '\n-----END CERTIFICATE-----';

    const serialNumber = NU.CertificateSerial(certificado)
      .match(/.{1,2}/g)
      .map(function(v) {
        return String.fromCharCode(parseInt(v, 16));
      })
      .join('');

    this.jxml.elements[0].attributes['NoCertificado'] = serialNumber;
    this.jxml.elements[0].attributes['Certificado'] = cer;
    return this;
  }

  xml(): Promise<{}> {
    return new Promise((resolve, reject) => {
      try {
        this.jxml.elements[0].elements = _.orderBy(
          this.jxml.elements[0].elements,
          ['order']
        );
        const xml = convert.js2xml(this.jxml);
        resolve(xml);
      } catch (err) {
        reject(err);
      }
    });
  }

  xmlSellado(llave: string, password: string): Promise<string> {
    if (!fs.existsSync(this.libxmlDir))
      return Promise.reject(
        'No se encontro libxml en la ruta: ' + this.libxmlDir
      );

    const fullPath = path.join(
      os.tmpdir(),
      `${FileSystem.generateNameTemp()}.xml`
    );
    this.jxml.elements[0].elements = _.orderBy(this.jxml.elements[0].elements, [
      'order'
    ]);
    fs.writeFileSync(fullPath, convert.js2xml(this.jxml), 'utf8');

    return xsltproc({ xsltproc_path: this.libxmlDir })
      .transform([this.stylesheetDir, fullPath])
      .then(cadena => {
        fs.unlinkSync(fullPath);

        return Promise.all([cadena, NU.DecodePKCS8(llave, password)]);
      })
      .then(prm => {
        const pem = prm[1];
        const cadena = prm[0];
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(cadena.result);
        const sello = sign.sign(pem.trim(), 'base64');
        this.jxml.elements[0].attributes['Sello'] = sello;
        return convert.js2xml(this.jxml);
      });
  }
}

export = CFDI;
