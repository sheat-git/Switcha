"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwitchOnlineApi = void 0;
const axios_1 = __importDefault(require("axios"));
const const_1 = require("./const");
class SwitchOnlineApi {
    constructor(token) {
        this.token = token;
    }
    async getUserByFeriendCode(friendCode) {
        await axios_1.default.post(const_1.NintendoUrl.getUserByFriendCode, {
            'parameter': {
                'friendCode': friendCode
            }
        }, {
            headers: {
                'Authorization': 'Bearer ' + this.token
            }
        });
    }
}
exports.SwitchOnlineApi = SwitchOnlineApi;
