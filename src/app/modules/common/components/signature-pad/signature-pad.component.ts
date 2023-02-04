import {ChangeDetectorRef, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {ModalController, ViewWillEnter} from '@ionic/angular';


@Component({
    selector: 'wii-signature-pad',
    templateUrl: 'signature-pad.component.html',
    styleUrls: ['./signature-pad.component.scss']
})
export class SignaturePadComponent implements ViewWillEnter {

    @Input()
    public signature: string;

    @ViewChild('signatureWrapper', {static: false})
    public signatureWrapper: ElementRef;

    @ViewChild('signatureCanvas')
    public canvasElement: ElementRef<HTMLCanvasElement>;

    public canvasWidth: number;
    public canvasHeight: number;
    public deleteRequested: boolean;

    private canvasSaveX: number;
    private canvasSaveY: number;

    public constructor(private modalController: ModalController,
                       private changeDetectorRef: ChangeDetectorRef) {
        this.deleteRequested = false;
    }

    public ionViewWillEnter(): void {
        setTimeout(() => {
            const {width: wrapperWidth, height: wrapperHeight} = this.signatureWrapper.nativeElement.getBoundingClientRect();
            this.canvasWidth = wrapperWidth;
            this.canvasHeight = wrapperHeight;

            if (this.signature) {
                this.changeDetectorRef.detectChanges();
                const image = new Image();
                image.src = this.signature;
                image.onload = () => {
                    this.canvasContext.drawImage(image, 0, 0);
                };
            }
        });
    }

    public onValidate(): void {
        this.modalController.dismiss({
            signature: this.deleteRequested
                ? false
                : this.getCanvasSignatureJpeg()
        });
    }

    public onPop(): void {
        this.modalController.dismiss({});
    }

    public onClear(): void {
        this.deleteRequested = true;
        this.canvasContext.fillStyle = "#FFF";
        this.canvasContext.clearRect(0, 0, this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height);
    }

    public startDrawing(ev: TouchEvent): void {
        this.deleteRequested = false;

        const {x, y} = this.canvasElement.nativeElement.getBoundingClientRect();
        this.canvasSaveX = ev.touches[0].pageX - x;
        this.canvasSaveY = ev.touches[0].pageY - y;
    }

    public moved(ev: TouchEvent): void {
        const canvasPosition = this.canvasElement.nativeElement.getBoundingClientRect();

        const ctx = this.canvasElement.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        const currentX = ev.touches[0].pageX - canvasPosition.x;
        const currentY = ev.touches[0].pageY - canvasPosition.y;

        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(this.canvasSaveX, this.canvasSaveY);
        ctx.lineTo(currentX, currentY);
        ctx.closePath();

        ctx.stroke();

        this.canvasSaveX = currentX;
        this.canvasSaveY = currentY;
    }

    private get canvasContext(): CanvasRenderingContext2D {
        return this.canvasElement && this.canvasElement.nativeElement.getContext('2d') as CanvasRenderingContext2D;
    }

    private getCanvasSignatureJpeg(): string {
        const canvas = this.canvasElement.nativeElement;
        const newCanvas: HTMLCanvasElement = canvas.cloneNode(true) as HTMLCanvasElement;
        const ctx = newCanvas.getContext('2d') as CanvasRenderingContext2D;
        ctx.fillStyle = "#FFF";
        ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
        ctx.drawImage(canvas, 0, 0);
        return newCanvas.toDataURL('image/jpeg');
    }

}
