import {Component} from '@angular/core';
import {InventoryLocationsPage} from '@pages/stock/inventory/inventory-locations/inventory-locations.page';


@Component({
    selector: 'wii-inventory-locations-anomalies',
    templateUrl: '../inventory-locations.page.html',
    styleUrls: ['../inventory-locations.page.scss'],
})
export class InventoryLocationsAnomaliesPage extends InventoryLocationsPage {
    // sub component to facilitate navigation
    // page is same as InventoryLocationsPage with anomalyMode = true
}
