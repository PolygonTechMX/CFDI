import * as _ from 'lodash';
import { IConcepto, ITraslado, IRetencion } from './interfaces';

export class concept {
  constructor(private concepto: IConcepto) {
    this.concepto.Impuestos = {
      Traslados: [],
      Retenciones: []
    };
  }

  traslado(traslado: ITraslado) {
    this.concepto.Impuestos.Traslados.push(traslado);
    return this;
  }

  retencion(retencion: IRetencion) {
    this.concepto.Impuestos.Retenciones.push(retencion);
    return this;
  }

  agregar(cfdi) {
    this.pushConcepto(cfdi.jxml, this.concepto);
  }

  pushConcepto(cfdi, c) {
    const len = cfdi.elements[0].elements.length;
    const inconce = _.findIndex(cfdi.elements[0].elements, {
      name: "cfdi:Conceptos"
    });
    // AGREGAR BASE DE CONCEPTOS
    if (inconce === -1) {
      cfdi.elements[0].elements.push({
        order: 3,
        type: "element",
        name: "cfdi:Conceptos",
        elements: []
      });
    }
    // RUTA BASE DE CONCEPTOS
    const base =
      inconce === -1
        ? cfdi.elements[0].elements[len].elements
        : cfdi.elements[0].elements[inconce].elements;
    // AGREGAR CONCEPTO A CONCEPTOS
    const attrConcepto = JSON.parse(JSON.stringify(c));
    delete attrConcepto.Impuestos;
    const concepto = {
      type: "element",
      name: "cfdi:Concepto",
      attributes: attrConcepto,
      elements: []
    };
  
    if (c.Impuestos.Traslados.length > 0 || c.Impuestos.Retenciones.length > 0) {
      let index = 0;
      // AGREGAR IMPUESTOS A CONCEPTO
      concepto.elements.push({
        type: "element",
        name: "cfdi:Impuestos",
        elements: []
      });
  
      if (c.Impuestos.Traslados.length > 0) {
        // AGREGAR TRASLADOS A IMPUESTOS
        concepto.elements[0].elements.push({
          type: "element",
          name: "cfdi:Traslados",
          elements: []
        });
  
        // RECORRER TRASLADOS
        c.Impuestos.Traslados.forEach(traslado => {
          // AGREGAR TRASLADO A TRASLADOS
          concepto.elements[0].elements[index].elements.push({
            type: "element",
            name: "cfdi:Traslado",
            attributes: traslado
          });
        });
  
        index++;
      }
  
      if (c.Impuestos.Retenciones.length > 0) {
        // AGREGAR RETENCIONES A IMPUESTOS
        concepto.elements[0].elements.push({
          type: "element",
          name: "cfdi:Retenciones",
          elements: []
        });
  
        // RECORRER TRASLADOS
        c.Impuestos.Retenciones.forEach(retencion => {
          // AGREGAR RETENCION A RETENCIONES
          concepto.elements[0].elements[index].elements.push({
            type: "element",
            name: "cfdi:Retencion",
            attributes: retencion
          });
        });
      }
    }
  
    base.push(concepto);
  }
}