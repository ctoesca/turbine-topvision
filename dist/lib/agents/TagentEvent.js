"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const turbine = require("turbine");
var Tevent = turbine.events.Tevent;
class TagentEvent extends Tevent {
    constructor(type, eventData = null, cancelable = true) {
        super(type, eventData, cancelable);
    }
}
TagentEvent.FAILURE = "FAILURE";
exports.TagentEvent = TagentEvent;
//# sourceMappingURL=TagentEvent.js.map