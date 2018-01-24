const fs = require('fs');
const path = require('path');
const CFDI = require('../src/CFDI');

const key = path.join(__dirname, 'LAN7008173R5.key');
const cer = path.join(__dirname, 'LAN7008173R5.cer');

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
}).CfdiRelacionados({
    TipoRelacion: '',
    CfdiRelacionados: ['UUID_____________1', 'UUID_____________2', 'UUID_____________3']
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
}).traslado({
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