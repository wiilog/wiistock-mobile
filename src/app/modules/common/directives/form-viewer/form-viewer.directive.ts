import {
    Directive,
    Input,
    OnInit,
    ViewContainerRef
} from '@angular/core';
import {FormViewerParam} from './form-viewer-param';
import {FormViewerDetailsConfig} from '@common/components/panel/model/form-viewer/form-viewer-details-config';

@Directive({
    selector: '[wiiFormViewer]'
})
export class FormViewerDirective implements OnInit {

    @Input()
    public param: FormViewerParam;

    public instance: FormViewerDetailsConfig;

    public constructor(private viewContainerRef: ViewContainerRef) {}

    public ngOnInit(): void {
        const {config, item} = this.param;

        const {instance} = this.viewContainerRef.createComponent<FormViewerDetailsConfig>(item);

        instance.label = config.label;
        instance.value = config.value;
        instance.inline = config.inline;

        this.instance = instance;
    }
}
