import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';

import * as Leaflet from 'leaflet';
import {Map, Marker} from 'leaflet';

Leaflet.Icon.Default.imagePath = `/assets/leaflet/`;

export type LeafletOptions = {
    zoomControl: boolean,
    attributionControl: boolean
};

export type MapLocation = {
    title?: string,
    latitude: number,
    longitude: number,
    marker?: Marker,
};

@Component({
    selector: 'wii-leaflet-map',
    templateUrl: './leaflet-map.component.html',
    styleUrls: ['./leaflet-map.component.scss'],
})
export class LeafletMapComponent implements AfterViewInit {

    public static readonly DEFAULT_OPTIONS: LeafletOptions = {
        zoomControl: false,
        attributionControl: false
    };

    @Input()
    public markers: Array<MapLocation> = [];

    @Input()
    public options: LeafletOptions = LeafletMapComponent.DEFAULT_OPTIONS;

    @ViewChild('map')
    public mapElement: ElementRef;

    public id: string = `leaflet-map-${Math.floor(Math.random() * 1000000)}`;

    private map: Map;
    private locations: Array<any> = [];

    public ngAfterViewInit(): void {
        this.map = Leaflet.map(this.mapElement.nativeElement, this.options);
        this.map.setView([46.467247, 2.960474], 5);
        Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

        this.setMarkers(this.markers);
    }

    public addMarker(location: MapLocation): void {
        const existing = this.locations.find(l => l.latitude === location.latitude && l.longitude === location.longitude);
        if (existing) {
            return;
        }

        const marker = Leaflet.marker([location.latitude, location.longitude]);
        this.map.addLayer(marker);

        if (location.title) {
            marker.bindPopup(location.title, {autoClose: false}).openPopup();
        }

        location.marker = marker;
        this.locations.push(location);
    }

    public setMarkers(locations: Array<MapLocation>, fit = true) {
        for (const location of this.locations) {
            this.removeMarker(location);
        }

        for (const location of locations) {
            this.addMarker(location);
        }

        if (fit) {
            this.fitBounds();
        }
    }

    public removeMarker(location: MapLocation) {
        if (location.marker) {
            this.map.removeLayer(location.marker);
        }
        this.locations.splice(this.locations.indexOf(location), 1);
    }

    public fitBounds() {
        const bounds = [];
        for (const location of this.locations) {
            bounds.push(Leaflet.latLng(location.latitude, location.longitude));
        }

        this.map.flyToBounds(Leaflet.latLngBounds(bounds), {
            paddingTopLeft: [0, 30],
            maxZoom: 12,
        });
    }
}
