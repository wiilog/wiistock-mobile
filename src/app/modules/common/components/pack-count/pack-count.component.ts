import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {HeaderConfig} from '@common/components/panel/model/header-config';
import {FormPanelParam} from '@common/directives/form-panel/form-panel-param';
import {FormViewerParam} from '@common/directives/form-viewer/form-viewer-param';
import {FormPanelComponent} from '@common/components/panel/form-panel/form-panel.component';
import {NatureWithQuantity} from '@common/components/panel/model/form-viewer/form-viewer-table-config';
import {FormViewerTableComponent} from '@common/components/panel/form-panel/form-viewer-table/form-viewer-table.component';
import {TransportRoundLine} from '@database/transport-round-line';

@Component({
    selector: 'wii-pack-count',
    templateUrl: './pack-count.component.html',
    styleUrls: ['./pack-count.component.scss'],
})
export class PackCountComponent implements OnInit {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    @Input()
    public mode: "actual" | "expected";

    @Input()
    public title: string;

    @Input()
    public icon: string;

    @Input()
    public transport: TransportRoundLine;

    @Input()
    public body: Array<FormPanelParam>;

    public headerConfig: HeaderConfig;
    public detailsConfig: Array<FormViewerParam>;

    constructor() {
    }

    ngOnInit() {
        let packsCount = 0;
        const natures: {[name: string]: NatureWithQuantity} = {};

        if(this.transport.kind === `delivery`) {
            for (const pack of this.transport.packs) {
                if(pack.rejected) {
                    continue;
                }

                if (!natures[pack.nature]) {
                    natures[pack.nature] = {
                        color: pack.color,
                        title: pack.nature,
                        label: `Quantité`,
                        value: 0,
                    }
                }

                natures[pack.nature].value = natures[pack.nature].value as number + 1;
                packsCount += 1;
            }
        } else {
            for(const nature of this.transport.natures_to_collect) {
                let value = this.mode === `expected` ? nature.quantity_to_collect : nature.collected_quantity;
                natures[nature.nature] = {
                    color: nature.color,
                    title: nature.nature,
                    label: `Quantité`,
                    value: value || `/`,
                }

                packsCount += value;
            }

        }

        this.headerConfig = {
            title: this.title,
            subtitle: this.transport.kind === `delivery` ? [`${packsCount} colis`] : undefined,
            leftIcon: {
                name: this.icon ?? 'scanned-pack.svg',
            }
        };

        this.detailsConfig = [{
            item: FormViewerTableComponent,
            config: {
                label: ``,
                value: Object.values(natures),
            }
        }];
    }

}
