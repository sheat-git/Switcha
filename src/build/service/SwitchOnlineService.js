"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwitchOnlineService = void 0;
const axios_1 = __importDefault(require("axios"));
class SwitchOnlineService {
    constructor(token) {
        this.axios = axios_1.default.create({
            baseURL: 'https://api-lp1.znc.srv.nintendo.net/v3',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
    }
    async requestResult(method, url, parameter) {
        const data = (await this.axios.request({
            method,
            url,
            data: { parameter }
        })).data;
        if ('result' in data) {
            return data['result'];
        }
        else {
            return {
                status: data['status'],
                errorMessage: data['errorMessage']
            };
        }
    }
    async createFriendCodeUrl(parameter = {}) {
        return await this.requestResult('post', '/Friend/CreateFriendCodeUrl', parameter);
    }
    async getUserByFriendCode(parameter) {
        return await this.requestResult('post', '/Friend/GetUserByFriendCode', parameter);
    }
    async getUserByFriendCodeHash(parameter) {
        return await this.requestResult('post', '/Friend/GetUserByFriendCodeHash', parameter);
    }
    async createFriendRequest(parameter) {
        return await this.requestResult('post', '/FriendRequest/Create', parameter);
    }
}
exports.SwitchOnlineService = SwitchOnlineService;
