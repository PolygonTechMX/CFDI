# CFDI

[![MIT License][license-image]][license-url]
[![Greenkeeper badge][green-image]][green-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![NPM version][npm-version-image]][npm-url] 
[![NPM downloads][npm-downloads-image]][npm-url] 

[green-image]: https://badges.greenkeeper.io/PolygonTechMX/CFDI.svg
[green-url]: https://greenkeeper.io/
[snyk-image]: https://snyk.io/test/github/polygontechmx/cfdi/badge.svg?targetFile=package.json
[snyk-url]: https://snyk.io/test/github/polygontechmx/cfdi?targetFile=package.json
[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE
[npm-url]: https://npmjs.org/package/cfdi
[npm-version-image]: http://img.shields.io/npm/v/cfdi.svg?style=flat
[npm-downloads-image]: http://img.shields.io/npm/dm/cfdi..svg?style=flat

[![npm package](https://nodei.co/npm/cfdi.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/cfdi/)

Libreria para crear y sellar documendos xml cfdi version 3.3

## Instalacion

CON NPM:

* npm install cfdi --save

CON YARN:

* yarn add cfdi

## Ejemplo

```javascript
const fs = require('fs');
const path = require('path');
const CFDI = require('../lib/CFDI');

// PATH DE LLAVE Y CERTIFICADO
const key = path.join(__dirname, 'SAT.key');
const cer = path.join(__dirname, 'SAT.cer');

CFDI.generarXML({
  cer: cer,
  key: key,
  pas: 'CONTRASEÑA KEY',
  Factura: {
    Comprobante: {
      	Serie: 'A',
      	Folio: '167ABC',
      	Fecha: '2018-01-16T09:33:43',
      	SubTotal: '369.83',
      	Moneda: 'MXN',
      	Total: '429.00',
      	TipoDeComprobante: 'I',
      	FormaPago: '01',
      	MetodoPago: 'PUE',
      	CondicionesDePago: 'CONDICIONES',
      	Descuento: '0.00',
      	TipoCambio: '1',
      	LugarExpedicion: '45079'
    },
    Emisor: {
      	Rfc: 'SAT',
      	Nombre: 'SAT SA DE CV',
      	RegimenFiscal: '601'
    },
    Receptor: {
      	Rfc: 'MALD930428US2',
      	Nombre: 'DAVID ISAAC MARTINEZ LOPEZ',
      	UsoCFDI: 'G01'
    },
    Conceptos: [
      {
        ClaveProdServ: '52121500',
        ClaveUnidad: 'E48',
        NoIdentificacion: '3031130179',
        Cantidad: '1',
        Unidad: 'PZ',
        Descripcion: 'BATITA UNICORNIO',
        ValorUnitario: '369.83',
        Importe: '369.83',
        Impuestos: {
			Traslados: [
				{
					Base: '369.83',
					Impuesto: '002',
					TipoFactor: 'Tasa',
					TasaOCuota: '0.16',
					Importe: '59.17'
				}
			]
        }
      }
    ],
    Impuestos: {
      TotalImpuestosTrasladados: '59.17',
      Traslados: [
        {
          Impuesto: '002',
          TipoFactor: 'Tasa',
          TasaOCuota: '0.16',
          Importe: '59.17'
        }
      ]
      //TotalImpuestosRetenidos: "",
      //Retenciones: []
    }
  }
})
  .then(xml => fs.writeFileSync('./factura.xml', xml, 'utf8'))
  .catch(err => console.log(err));
```

## Utilidades

Instaler build tools

* npm install --global windows-build-tools

Instalar openssl

* https://slproweb.com/download/Win64OpenSSL-1_0_2n.exe
