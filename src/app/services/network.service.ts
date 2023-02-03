import {Injectable} from '@angular/core';
import {Network} from '@capacitor/network';

@Injectable()
export class NetworkService {

    public async hasNetwork(): Promise<boolean> {
        const {connected, connectionType} = await Network.getStatus()

        return (
            connected
            && connectionType
            && connectionType !== 'unknown'
            && connectionType !== 'none'
        );
    }
}
