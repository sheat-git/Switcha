import axios, { AxiosInstance, Method } from 'axios'

type Response<Result> = Promise<Result | {
    status: number
    errorMessage: string
}>

type CreateFriendCodeUrlParameter = {}

type CreateFriendCodeUrlResult = {
    friendCode: string
    url: string
}

type GetUserByFriendCodeParameter = {
    friendCode: string
}

type GetUserByFriendCodeResult = {
    id: number
    nsaId: string
    imageUri: string
    name: string
}

type GetUserByFriendCodeHashParameter = {
    friendCodeHash: string
    friendCode: string
}

type GetUserByFriendCodeHashResult = GetUserByFriendCodeResult

type CreateFriendRequestParameter = {
    nsaId: string
}

type CreateFriendRequestResult = {}

export class SwitchOnlineService {
    public readonly axios: AxiosInstance

    constructor(token: string) {
        this.axios = axios.create({
            baseURL: 'https://api-lp1.znc.srv.nintendo.net/v3',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
    }

    private async requestResult(method: Method, url: string, parameter: any): Response<any> {
        const data =  (await this.axios.request({
            method,
            url,
            data: { parameter }
        })).data
        if ('result' in data) {
            return data['result']
        } else {
            return {
                status: data['status'],
                errorMessage: data['errorMessage']
            }
        }
    }

    async createFriendCodeUrl(parameter: CreateFriendCodeUrlParameter = {}): Response<CreateFriendCodeUrlResult> {
        return await this.requestResult('post', '/Friend/CreateFriendCodeUrl', parameter)
    }

    async getUserByFriendCode(parameter: GetUserByFriendCodeParameter): Response<GetUserByFriendCodeResult> {
        return await this.requestResult('post', '/Friend/GetUserByFriendCode', parameter)
    }

    async getUserByFriendCodeHash(parameter: GetUserByFriendCodeHashParameter): Response<GetUserByFriendCodeHashResult> {
        return await this.requestResult('post', '/Friend/GetUserByFriendCodeHash', parameter)
    }

    async createFriendRequest(parameter: CreateFriendRequestParameter): Response<CreateFriendRequestResult> {
        return await this.requestResult('post', '/FriendRequest/Create', parameter)
    }
}
