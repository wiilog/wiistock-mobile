import {Injectable} from '@angular/core';
import {Reception} from "@database/reception";
import * as moment from "moment/moment";


@Injectable({
    providedIn: 'root'
})
export class ReceptionService {

    public serializeReception(reception: Reception): { [name: string]: {label: string, value?: string} } {
        return {
            status: {
                label: 'Statut',
                value: reception.status
            },
            supplier: {
                label: 'Fournisseur',
                value: reception.supplier
            },
            orderNumber: {
                label: 'Numéro de commande',
                value: reception.orderNumber?.join(', ')
            },
            expectedDate: {
                label: 'Date attendue',
                value: reception.expectedDate
                    ? moment(reception.expectedDate.date, 'YYYY-MM-DD HH:mm:ss.SSSSSS').format('DD/MM/YYYY')
                    : undefined,
            },
            user: {
                label: 'Utilisateur',
                value: reception.user
            },
            carrier: {
                label: 'Transporteur',
                value: reception.carrier
            },
            location: {
                label: 'Emplacement',
                value: reception.location
            },
            storageLocation: {
                label: 'Emplacement de stockage',
                value: reception.storageLocation
            },
            orderDate: {
                label: `Date de commande`,
                value: reception.orderDate
                    ? moment(reception.orderDate.date, 'YYYY-MM-DD HH:mm:ss.SSSSSS').format('DD/MM/YYYY')
                    : undefined,
            },
        };
    }
}
