import { IComprobante, IEmisorReceptor, IRelacionados, IImpuestos, IConcepto } from './interfaces';
import { concept } from './concepto';
declare class CFDI {
    private comprobante;
    private libxmlDir;
    private stylesheetDir;
    as: IImpuestos;
    private jxml;
    constructor(comprobante: IComprobante, libxmlDir: string, stylesheetDir: string);
    emisor(emisor: IEmisorReceptor): this;
    receptor(receptor: IEmisorReceptor): this;
    CfdiRelacionados(relacionados: IRelacionados): this;
    impuestos(i: IImpuestos): this;
    concepto(concepto: IConcepto): concept;
    certificar(certificado: string): this;
    xml(): Promise<{}>;
    xmlSellado(llave: string, password: string): Promise<string>;
}
export = CFDI;
