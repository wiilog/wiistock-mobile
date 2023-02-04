import {mergeMap, take} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {from, Observable, ReplaySubject} from 'rxjs';
import {ToastController} from '@ionic/angular';
import {ToastOptions} from '@ionic/core';


@Injectable({
    providedIn: 'root'
})
export class ToastService {

    public static readonly LONG_DURATION: number = 5000;
    public static readonly DEFAULT_DURATION: number = 2000;

    private static readonly TOAST_OPTIONS: ToastOptions = {
        position: 'bottom'
    };
    private audio: HTMLAudioElement;

    public constructor(private toastController: ToastController) {
        this.audio = new Audio('../../assets/sounds/Error-sound.mp3');
        this.audio.load();
    }

    /**
     * @return Returns an observable which is resolved when the Toast transition has completed.
     */
    public presentToast(message: string,
                        {duration, audio}: { duration?: number; audio?: boolean; } = {duration: ToastService.DEFAULT_DURATION, audio: false }): Observable<void> {
        duration = duration !== undefined ? duration : ToastService.DEFAULT_DURATION;
        audio = audio !== undefined ? audio : false;

        const res$ = new ReplaySubject<void>(1);

        // if we return observable directly, toast is not trigger
        from(this.toastController.create({
            ...(ToastService.TOAST_OPTIONS),
            message,
            duration,
        }))
            .pipe(
                mergeMap((toast: HTMLIonToastElement) => from(toast.present())),
                take(1)
            )
            .subscribe({
                next: () => {
                    res$.next();
                    if (audio) {
                        this.audio.play();
                    }
                },
                error: (error) => res$.error(error),
                complete: () => res$.complete()
            });

        return res$;
    }
}
