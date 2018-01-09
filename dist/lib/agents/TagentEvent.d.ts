import { Tevent } from '../../../events/Tevent';
export declare class TagentEvent extends Tevent {
    static FAILURE: string;
    constructor(type: string, eventData?: any, cancelable?: boolean);
}
