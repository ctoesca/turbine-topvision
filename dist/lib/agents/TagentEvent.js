"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Tevent_1 = require("../../../events/Tevent");
class TagentEvent extends Tevent_1.Tevent {
    constructor(type, eventData = null, cancelable = true) {
        super(type, eventData, cancelable);
    }
}
TagentEvent.FAILURE = "FAILURE";
exports.TagentEvent = TagentEvent;
//# sourceMappingURL=TagentEvent.js.map