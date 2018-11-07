import { IConcepto, ITraslado, IRetencion } from './interfaces';
export declare class concept {
    private concepto;
    constructor(concepto: IConcepto);
    traslado(traslado: ITraslado): this;
    retencion(retencion: IRetencion): this;
    agregar(cfdi: any): void;
    pushConcepto(cfdi: any, c: any): void;
}
