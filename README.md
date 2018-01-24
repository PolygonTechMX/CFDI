# CFDI 3.3

[![MIT License][license-image]][license-url]
[![Greenkeeper badge][green-image]][green-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![dependencies status][dev-image]][dev-url]

[green-image]: https://badges.greenkeeper.io/PolygonTechMX/CFDI.svg
[green-url]: https://greenkeeper.io/
[snyk-image]: https://snyk.io/test/github/polygontechmx/cfdi/badge.svg?targetFile=package.json
[snyk-url]: https://snyk.io/test/github/polygontechmx/cfdi?targetFile=package.json
[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE
[npm-url]: https://npmjs.org/package/cfdi
[npm-version-image]: http://img.shields.io/npm/v/cfdi.svg?style=flat
[npm-downloads-image]: http://img.shields.io/npm/dt/cfdi..svg?style=flat
[dev-image]: https://img.shields.io/david/mgcrea/node-openssl-wrapper.svg?style=flat
[dev-url]: https://david-dm.org/mgcrea/node-openssl-wrapper

Libreria para crear y sellar documendos xml cfdi.

Por el momento solo funciona para windows y no requiere instalacion de OpenSSL ni Libxml2 ya que vienen integrados en el paquete.

<!-- toc -->
- [Instalación](#Instalación)
- [Glosario](#Glosario)
  * [`Init`](#init)
  * [`Comprobante`](#comprobante)
    * [`Traslados`](#concepto.traslado)
    * [`Retenciones`](#concepto.retencion)
    * [`Agregar`](#concepto.agregar)
  * [`CFDI Relacionados`](#relacionados)
  * [`Emisor`](#emisor)
  * [`Receptor`](#receptor)
  * [`Concepto`](#concepto)
  * [`Impuestos`](#impuestos)
  * [`Certificar`](#certificar)
  * [`Generar XML`](#xml)
  * [`Generar XML Sellado`](#xmlSellado)
- [Ejemplos]()
  * [`Ejemplo básico`](#Ejemplo básico)
  * [`Ejemplo simplificado`](#Ejemplo simplificado)
<!-- tocstop -->

## Instalación

NPM:

* npm install cfdi --save

YARN:

* yarn add cfdi

## Glosario

### `init`
```javascript
const CFDI = require('cfdi');

const key = './LAN7008173R5.key';
const cer = './LAN7008173R5.cer';
const cfdi = new CFDI()
```

### `comprobante`
```javascript
cfdi.comprobante({
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
});
```

### `relacionados`
```javascript
cfdi.CfdiRelacionados({
    TipoRelacion: '',
    CfdiRelacionados: ['UUID_____________1', 'UUID_____________2', 'UUID_____________3']
});
```

### `emisor`
```javascript
cfdi.emisor({
    Rfc: 'SAT',
    Nombre: 'SAT SA DE CV',
    RegimenFiscal: '601'
});
```

### `receptor`
```javascript
cfdi.receptor({
    Rfc: 'MALD930428US2',
    Nombre: 'DAVID ISAAC MARTINEZ LOPEZ',
    UsoCFDI: 'G01'
});
```

### `concepto`
```javascript
const concepto = cfdi.concepto({
    ClaveProdServ: '52121500',
    ClaveUnidad: 'E48',
    NoIdentificacion: '3031130179',
    Cantidad: '1',
    Unidad: 'PZ',
    Descripcion: 'BATITA UNICORNIO',
    ValorUnitario: '369.83',
    Importe: '369.83'
});
```

### `concepto.traslado`
```javascript
concepto.traslado({
    Base: '369.83',
    Impuesto: '002',
    TipoFactor: 'Tasa',
    TasaOCuota: '0.16',
    Importe: '59.17'
});
```

### `concepto.retencion`
```javascript
concepto.retencion({
    Base: '369.83',
    Impuesto: '002',
    TipoFactor: 'Tasa',
    TasaOCuota: '0.16',
    Importe: '59.17'
});
```

### `concepto.agregar`
```javascript
concepto.agregar(cfdi),
```

### `impuestos`
```javascript
cfdi.impuestos({
    TotalImpuestosTrasladados: '59.17',
    Traslados: [
      {
        Impuesto: '002',
        TipoFactor: 'Tasa',
        TasaOCuota: '0.16',
        Importe: '59.17'
      }
    ]
});
```

### `certificar`
```javascript
const cer = path.join(__dirname, 'LAN7008173R5.cer');
cfdi.certificar(cer);
```

### xml
```javascript
cfdi
.xml()
.then(xml => console.log(xml))
.catch(err => console.log(err));
```

### `xmlSellado`
```javascript
const key = path.join(__dirname, 'LAN7008173R5.key');
cfdi.xmlSellado(key, '12345678a')
.then(xml => console.log(xml))
.catch(err => console.log(err));
```

## Ejemplo básico
```javascript
const fs = require('fs');
const CFDI = require('../src/CFDI');

const key = './LAN7008173R5.key';
const cer = './LAN7008173R5.cer';

const cfdi = new CFDI({
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
});

cfdi.emisor({
    Rfc: 'SAT',
    Nombre: 'SAT SA DE CV',
    RegimenFiscal: '601'
});

cfdi.receptor({
    Rfc: 'MALD930428US2',
    Nombre: 'DAVID ISAAC MARTINEZ LOPEZ',
    UsoCFDI: 'G01'
});

const concepto = cfdi.concepto({
    ClaveProdServ: '52121500',
    ClaveUnidad: 'E48',
    NoIdentificacion: '3031130179',
    Cantidad: '1',
    Unidad: 'PZ',
    Descripcion: 'BATITA UNICORNIO',
    ValorUnitario: '369.83',
    Importe: '369.83'
});

concepto.traslado({
    Base: '369.83',
    Impuesto: '002',
    TipoFactor: 'Tasa',
    TasaOCuota: '0.16',
    Importe: '59.17'
});

concepto.agregar(cfdi);

cfdi.impuestos({
    TotalImpuestosTrasladados: '59.17',
    Traslados: [
      {
        Impuesto: '002',
        TipoFactor: 'Tasa',
        TasaOCuota: '0.16',
        Importe: '59.17'
      }
    ]
});

cfdi.certificar(cer);

cfdi.xmlSellado(key, '12345678a')
.then(xml => console.log(xml))
.catch(err => console.log(err));
```

## Ejemplo simplificado
```javascript
const fs = require('fs');
const CFDI = require('../src/CFDI');

const key = './LAN7008173R5.key';
const cer = './LAN7008173R5.cer';

const cfdi = new CFDI({
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
}).emisor({
    Rfc: 'SAT',
    Nombre: 'SAT SA DE CV',
    RegimenFiscal: '601'
}).receptor({
    Rfc: 'MALD930428US2',
    Nombre: 'DAVID ISAAC MARTINEZ LOPEZ',
    UsoCFDI: 'G01'
}).impuestos({
    TotalImpuestosTrasladados: '59.17',
    Traslados: [
      {
        Impuesto: '002',
        TipoFactor: 'Tasa',
        TasaOCuota: '0.16',
        Importe: '59.17'
      }
    ]
});

cfdi.concepto({
    ClaveProdServ: '52121500',
    ClaveUnidad: 'E48',
    NoIdentificacion: '3031130179',
    Cantidad: '1',
    Unidad: 'PZ',
    Descripcion: 'BATITA UNICORNIO',
    ValorUnitario: '369.83',
    Importe: '369.83'
}).retencion({
    Base: '369.83',
    Impuesto: '002',
    TipoFactor: 'Tasa',
    TasaOCuota: '0.16',
    Importe: '59.17'
}).agregar(cfdi);


cfdi
.certificar(cer)
.xmlSellado(key, '12345678a')
.then(xml => console.log(xml))
.catch(err => console.log(err));
```

## Utilidades

Windows build tools

* npm install --global windows-build-tools

OpenSSL Windows X64

* https://slproweb.com/download/Win64OpenSSL-1_0_2n.exe
