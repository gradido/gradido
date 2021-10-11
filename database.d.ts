/// <reference types="node" />
declare module "entity/0001-init_db/Balance" {
    import { BaseEntity } from 'typeorm';
    export class Balance extends BaseEntity {
        id: number;
        userId: number;
        modified: Date;
        recordDate: Date;
        amount: number;
    }
}
declare module "entity/Balance" {
    export { Balance } from "entity/0001-init_db/Balance";
}
declare module "entity/0001-init_db/Migration" {
    import { BaseEntity } from 'typeorm';
    export class Migration extends BaseEntity {
        version: number;
        fileName: string;
        date: Date;
    }
}
declare module "entity/Migration" {
    export { Migration } from "entity/0001-init_db/Migration";
}
declare module "entity/0001-init_db/TransactionCreation" {
    import { BaseEntity, Timestamp } from 'typeorm';
    import { Transaction } from "entity/0001-init_db/Transaction";
    export class TransactionCreation extends BaseEntity {
        id: number;
        transactionId: number;
        userId: number;
        amount: number;
        targetDate: Timestamp;
        transaction: Transaction;
    }
}
declare module "entity/0001-init_db/TransactionSendCoin" {
    import { BaseEntity } from 'typeorm';
    import { Transaction } from "entity/0001-init_db/Transaction";
    export class TransactionSendCoin extends BaseEntity {
        id: number;
        transactionId: number;
        senderPublic: Buffer;
        userId: number;
        recipiantPublic: Buffer;
        recipiantUserId: number;
        amount: number;
        transaction: Transaction;
    }
}
declare module "entity/0001-init_db/Transaction" {
    import { BaseEntity } from 'typeorm';
    import { TransactionCreation } from "entity/0001-init_db/TransactionCreation";
    import { TransactionSendCoin } from "entity/0001-init_db/TransactionSendCoin";
    export class Transaction extends BaseEntity {
        id: number;
        transactionTypeId: number;
        txHash: Buffer;
        memo: string;
        received: Date;
        blockchainTypeId: number;
        transactionSendCoin: TransactionSendCoin;
        transactionCreation: TransactionCreation;
    }
}
declare module "entity/Transaction" {
    export { Transaction } from "entity/0001-init_db/Transaction";
}
declare module "entity/TransactionCreation" {
    export { TransactionCreation } from "entity/0001-init_db/TransactionCreation";
}
declare module "entity/TransactionSendCoin" {
    export { TransactionSendCoin } from "entity/0001-init_db/TransactionSendCoin";
}
declare module "entity/0002-add_settings/UserSetting" {
    import { BaseEntity } from 'typeorm';
    import { User } from "entity/0002-add_settings/User";
    export class UserSetting extends BaseEntity {
        id: number;
        userId: number;
        user: User;
        key: string;
        value: string;
    }
}
declare module "entity/0002-add_settings/User" {
    import { BaseEntity } from 'typeorm';
    import { UserSetting } from "entity/0002-add_settings/UserSetting";
    export class User extends BaseEntity {
        id: number;
        pubkey: Buffer;
        email: string;
        firstName: string;
        lastName: string;
        username: string;
        disabled: boolean;
        settings: UserSetting[];
    }
}
declare module "entity/User" {
    export { User } from "entity/0002-add_settings/User";
}
declare module "entity/UserSetting" {
    export { UserSetting } from "entity/0002-add_settings/UserSetting";
}
declare module "entity/0001-init_db/UserTransaction" {
    import { BaseEntity } from 'typeorm';
    export class UserTransaction extends BaseEntity {
        id: number;
        userId: number;
        transactionId: number;
        transactionTypeId: number;
        balance: number;
        balanceDate: Date;
    }
}
declare module "entity/UserTransaction" {
    export { UserTransaction } from "entity/0001-init_db/UserTransaction";
}
declare module "entity/0001-init_db/User" {
    import { BaseEntity } from 'typeorm';
    export class User extends BaseEntity {
        id: number;
        pubkey: Buffer;
        email: string;
        firstName: string;
        lastName: string;
        username: string;
        disabled: boolean;
    }
}
declare module "migrations/0001-init_db" {
    export function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>): Promise<void>;
    export function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>): Promise<void>;
}
declare module "migrations/0002-add_settings" {
    export function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>): Promise<void>;
    export function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>): Promise<void>;
}
declare module "src/config/index" {
    const CONFIG: {
        MIGRATIONS_TABLE: string;
        MIGRATIONS_DIRECTORY: string;
        DB_HOST: string;
        DB_PORT: number;
        DB_USER: string;
        DB_PASSWORD: string;
        DB_DATABASE: string;
    };
    export default CONFIG;
}
declare module "src/prepare" {
    const _default: () => Promise<void>;
    export default _default;
}
declare module "src/typeorm/connection" {
    import { Connection } from 'typeorm';
    const connection: () => Promise<Connection | null>;
    export default connection;
}
declare module "src/index" {
    import 'reflect-metadata';
}
//# sourceMappingURL=database.d.ts.map