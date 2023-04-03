import { deta } from './deta'
import DetaBase from 'deta/dist/types/base'
import {
    FetchOptions,
    PutManyOptions,
    PutOptions,
    UpdateOptions
} from 'deta/dist/types/types/base/request'
import {
    CompositeType,
    ObjectType
} from 'deta/dist/types/types/basic'

export abstract class BaseStore<Entity extends ObjectType & {key: string}> {
    private readonly db: DetaBase

    protected constructor(baseName: string) {
        this.db = deta.Base(baseName)
    }

    async get(key: string): Promise<Entity | null> {
        return await this.db.get(key) as Entity | null
    }

    async put(item: Entity, options?: PutOptions) {
        await this.db.put(item, undefined, options)
    }

    async putMany(items: Entity[], options?: PutManyOptions) {
        await this.db.putMany(items, options)
    }

    async update(item: Entity, options?: UpdateOptions) {
        await this.db.update(item, item.key, options)
    }

    async delete(key: string) {
        await this.db.delete(key)
    }

    async fetch(query?: CompositeType, options?: FetchOptions): Promise<{
        items: Entity[]
        count: number
        last: string | null
    }> {
        const res = await this.db.fetch(query, options)
        return {
            items: res.items as Entity[],
            count: res.count,
            last: res.last ?? null
        }
    }
}
