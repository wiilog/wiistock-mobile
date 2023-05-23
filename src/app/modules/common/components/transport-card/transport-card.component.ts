import {Component, Input, OnInit} from '@angular/core';
import {TransportRoundLine} from '@entities/transport-round-line';
import {SimpleCardTitle} from '@common/components/simple-card/simple-card.component';
import {Platform} from '@ionic/angular';
import {TranslationService} from "@app/services/translations.service";

export enum TransportCardMode {
    VIEW,
    STARTABLE,
}

@Component({
    selector: 'wii-transport-card',
    templateUrl: './transport-card.component.html',
    styleUrls: ['./transport-card.component.scss'],
})
export class TransportCardComponent implements OnInit {

    public modeViewOnly = TransportCardMode.VIEW;

    @Input()
    public transport: TransportRoundLine;

    @Input()
    public mode: TransportCardMode;

    public titles: Array<SimpleCardTitle> = [];

    public notRejectedPacks: number;

    public livraisonTrad: string;

    public constructor(private platform: Platform,
                       private translationService: TranslationService) {}

    public ngOnInit(): void {
        this.notRejectedPacks = this.transport.packs.filter(pack => !pack.rejected).length;

        this.translationService.get(null, `Ordre`, `Livraison`).subscribe((ordreTranslations) => {
            this.livraisonTrad = TranslationService.Translate(ordreTranslations, 'Livraison');
        });

        this.titles.push({
            title: `${this.transport.priority}. ${this.transport.contact.name}`,
            position: `left`,
        });

        this.titles.push({
            title: this.transport.type,
            image: this.transport.type_icon,
            position: `right`,
        });

        if(this.transport.collect) {
            this.titles.push({
                title: this.transport.collect.type,
                image: this.transport.collect.type_icon,
                position: `right`,
            });
        }
    }

    public navigate(event: any) {
        if(this.mode === this.modeViewOnly || this.transport.cancelled) {
            return;
        }

        const contact = this.transport.contact;

        if (this.platform.is(`android`)) {
            window.location.href = `geo:${contact.latitude},${contact.longitude}?q=${contact.address}`;
        } else {
            window.location.href = `maps://maps.apple.com/?q=${contact.address}`;
        }

        event.stopPropagation();
    }

}
