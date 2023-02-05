import {Component} from '@angular/core';
import {InventoryLocationsPage} from '@pages/stock/inventory/inventory-locations/inventory-locations.page';


@Component({
    selector: 'wii-inventory-locations-missions',
    templateUrl: '../inventory-locations.page.html',
    styleUrls: ['../inventory-locations.page.scss'],
})
export class InventoryLocationsMissionsPage extends InventoryLocationsPage {
    // sub component to facilitate navigation
    // page is same as InventoryLocationsPage
}
