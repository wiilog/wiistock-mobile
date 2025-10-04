import {Injectable} from "@angular/core";
import {TransportRound} from '@database/transport-round';

@Injectable({
    providedIn: 'root'
})
export class TransportService {

    public treatTransport(previousRound: TransportRound, updated: TransportRound) {
        //clear the round
        (Object.keys(previousRound) as Array<keyof TransportRound>)
            .forEach((key) => {
                delete previousRound[key];
            })

        //update the round's properties
        Object.assign(previousRound, updated);
    }
}
