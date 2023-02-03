import {Injectable} from '@angular/core';
import {AlertOptions} from '@ionic/core';
import {AlertController} from '@ionic/angular';

@Injectable()
export class AlertService {

    public static readonly CSS_CLASS_MANAGED_ALERT = 'custom-managed-alert';

    private audio: HTMLAudioElement;

    private openAlert?: HTMLIonAlertElement;

    public constructor(private alertController: AlertController) {
        this.audio = new Audio('../../../assets/sounds/Error-sound.mp3');
        this.audio.load();
    }

    public async show(options: AlertOptions, onDismiss?: () => void, sound: boolean = true) {
        if(this.openAlert) {
            this.openAlert.dismiss();
        }

        const alert = await this.alertController.create(options);
        if(alert) {
            this.openAlert = alert;
            alert.onDidDismiss().then(onDismiss);

            if(sound) {
                this.audio.play();
            }
            alert.present().then((() => this.fixLinebreaks()));
        }

        return alert;
    }

    private fixLinebreaks() {
        const inputs = document.querySelectorAll(`ion-alert.${AlertService.CSS_CLASS_MANAGED_ALERT} .alert-message`);
        inputs.forEach((element: Element) => {
            element.innerHTML = element.innerHTML.replace(/\n/g, `<br>`);
        });
    }

}
