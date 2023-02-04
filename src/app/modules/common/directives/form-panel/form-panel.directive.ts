import {
    Directive,
    Input,
    OnInit,
    ViewContainerRef
} from '@angular/core';
import {FormPanelParam} from './form-panel-param';
import {FormPanelItemComponent} from '@common/components/panel/model/form-panel/form-panel-item.component';

@Directive({
    selector: '[wiiFormPanel]'
})
export class FormPanelDirective implements OnInit {

    @Input()
    public param: FormPanelParam;

    public instance: FormPanelItemComponent<any>;

    public constructor(private viewContainerRef: ViewContainerRef) {}

    public ngOnInit(): void {
        const {item} = this.param;

        const {instance} = this.viewContainerRef.createComponent<FormPanelItemComponent<any>>(item);
        this.instance = instance;

        this.reloadInstance(true);
    }

    public reloadInstance(instanceCreation: boolean = false): void {
        const {config} = this.param;

        this.instance.inputConfig = config.inputConfig;
        this.instance.label = config.label;
        this.instance.name = config.name;
        this.instance.errors = config.errors;
        this.instance.group = config.group;
        this.instance.inline = config.inline;
        this.instance.value = config.value;
        if (instanceCreation) {
            this.instance.value = config.value;
        }
    }
}
