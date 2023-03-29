import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {NavParams} from "@app/services/nav/nav-params";

export interface TitleConfig {
    label?: string;
    pagePath: NavPathEnum;
    noBreadcrumb?: boolean,
    filter?: (data: NavParams) => boolean;
    stackIndex?: number;
    paramsId?: number;
}
