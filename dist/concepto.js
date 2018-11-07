"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
class concept {
    constructor(concepto) {
        this.concepto = concepto;
        this.concepto.Impuestos = {
            Traslados: [],
            Retenciones: []
        };
    }
    traslado(traslado) {
        this.concepto.Impuestos.Traslados.push(traslado);
        return this;
    }
    retencion(retencion) {
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
        if (inconce === -1) {
            cfdi.elements[0].elements.push({
                order: 3,
                type: "element",
                name: "cfdi:Conceptos",
                elements: []
            });
        }
        const base = inconce === -1
            ? cfdi.elements[0].elements[len].elements
            : cfdi.elements[0].elements[inconce].elements;
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
            concepto.elements.push({
                type: "element",
                name: "cfdi:Impuestos",
                elements: []
            });
            if (c.Impuestos.Traslados.length > 0) {
                concepto.elements[0].elements.push({
                    type: "element",
                    name: "cfdi:Traslados",
                    elements: []
                });
                c.Impuestos.Traslados.forEach(traslado => {
                    concepto.elements[0].elements[index].elements.push({
                        type: "element",
                        name: "cfdi:Traslado",
                        attributes: traslado
                    });
                });
                index++;
            }
            if (c.Impuestos.Retenciones.length > 0) {
                concepto.elements[0].elements.push({
                    type: "element",
                    name: "cfdi:Retenciones",
                    elements: []
                });
                c.Impuestos.Retenciones.forEach(retencion => {
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
exports.concept = concept;
//# sourceMappingURL=concepto.js.map