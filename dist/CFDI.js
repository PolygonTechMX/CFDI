"use strict";
const os = require("os");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const convert = require("xml-js");
const _ = require("lodash");
const xsltproc = require("node-xsltproc");
const concepto_1 = require("./concepto");
const FileSystem_1 = require("./FileSystem");
const NU = require('native_utils.node');
class CFDI {
    constructor(comprobante, libxmlDir, stylesheetDir) {
        this.comprobante = comprobante;
        this.libxmlDir = libxmlDir;
        this.stylesheetDir = stylesheetDir;
        this.jxml = {
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
    emisor(emisor) {
        this.jxml.elements[0].elements.push({
            order: 1,
            type: 'element',
            name: 'cfdi:Emisor',
            attributes: emisor
        });
        return this;
    }
    receptor(receptor) {
        this.jxml.elements[0].elements.push({
            order: 2,
            type: 'element',
            name: 'cfdi:Receptor',
            attributes: receptor
        });
        return this;
    }
    CfdiRelacionados(relacionados) {
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
    impuestos(i) {
        const impuestos = {
            order: 4,
            type: 'element',
            name: 'cfdi:Impuestos',
            attributes: {},
            elements: []
        };
        let index = 0;
        if (_.has(i, 'TotalImpuestosTrasladados')) {
            impuestos.attributes['TotalImpuestosTrasladados'] =
                i.TotalImpuestosTrasladados;
            impuestos.elements.push({
                type: 'element',
                name: 'cfdi:Traslados',
                elements: []
            });
            i.Traslados.forEach(traslado => {
                impuestos.elements[index].elements.push({
                    type: 'element',
                    name: 'cfdi:Traslado',
                    attributes: traslado
                });
            });
            index++;
        }
        if (_.has(i, 'TotalImpuestosRetenidos')) {
            impuestos.attributes['TotalImpuestosRetenidos'] =
                i.TotalImpuestosRetenidos;
            impuestos.elements.push({
                type: 'element',
                name: 'cfdi:Retenciones',
                elements: []
            });
            i.Retenciones.forEach(retencion => {
                impuestos.elements[index].elements.push({
                    type: 'element',
                    name: 'cfdi:Retencion',
                    attributes: retencion
                });
            });
        }
        this.jxml.elements[0].elements.push(impuestos);
        return this;
    }
    concepto(concepto) {
        return new concepto_1.concept(concepto);
    }
    certificar(certificado) {
        const cer = fs.readFileSync(certificado, 'base64');
        const pem = '-----BEGIN CERTIFICATE-----\n' + cer + '\n-----END CERTIFICATE-----';
        const serialNumber = NU.CertificateSerial(certificado)
            .match(/.{1,2}/g)
            .map(function (v) {
            return String.fromCharCode(parseInt(v, 16));
        })
            .join('');
        this.jxml.elements[0].attributes['NoCertificado'] = serialNumber;
        this.jxml.elements[0].attributes['Certificado'] = cer;
        return this;
    }
    xml() {
        return new Promise((resolve, reject) => {
            try {
                this.jxml.elements[0].elements = _.orderBy(this.jxml.elements[0].elements, ['order']);
                const xml = convert.js2xml(this.jxml);
                resolve(xml);
            }
            catch (err) {
                reject(err);
            }
        });
    }
    xmlSellado(llave, password) {
        if (!fs.existsSync(this.libxmlDir))
            return Promise.reject('No se encontro libxml en la ruta: ' + this.libxmlDir);
        const fullPath = path.join(os.tmpdir(), `${FileSystem_1.FileSystem.generateNameTemp()}.xml`);
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
module.exports = CFDI;
//# sourceMappingURL=CFDI.js.map