export interface IComprobante {
    Serie: string;
    Folio: string;
    Fecha: string;
    SubTotal: string;
    Moneda: string;
    Total: string;
    TipoDeComprobante: string;
    FormaPago: string;
    MetodoPago: string;
    CondicionesDePago: string;
    Descuento: string;
    TipoCambio: string;
    LugarExpedicion: string;
    Confirmacion: string;
}
export interface IEmisorReceptor {
    Rfc: string;
    Nombre: string;
    RegimenFiscal: 601 | 603 | 605 | 606 | 608 | 609 | 610 | 611 | 612 | 614 | 616 | 620 | 621 | 622 | 623 | 624 | 628 | 607 | 629 | 630 | 615;
}
export interface IRelacionados {
    TipoRelacion: string;
    CfdiRelacionados: string[];
}
export interface ITraslado {
    Base?: string;
    Impuesto: string;
    TipoFactor: string;
    TasaOCuota: string;
    Importe: string;
}
export interface IRetencion {
    Base?: string;
    Impuesto: string;
    TipoFactor: string;
    TasaOCuota: string;
    Importe: string;
}
export interface IImpuestos {
    TotalImpuestosTrasladados: string;
    TotalImpuestosRetenidos: string;
    Traslados: ITraslado[];
    Retenciones: IRetencion[];
}
export interface IConcepto {
    ClaveProdServ: string;
    ClaveUnidad: string;
    NoIdentificacion: string;
    Cantidad: string;
    Unidad: string;
    Descripcion: string;
    ValorUnitario: string;
    Importe: string;
    Descuento: string;
    Impuestos: {
        Traslados: ITraslado[];
        Retenciones: IRetencion[];
    };
}
