import {IconConfig} from '@common/components/panel/model/icon-config';


export interface ActionConfig {
    label: string;
    action: (event: Event) => void;
    icon?: IconConfig;
}
