
export interface IAccountAttributes {
    account_id?: number;
    customer_id: number;
    account_limit: number;
    per_transaction_limit: number;
    last_account_limit: number;
    last_per_transaction_limit: number;
    account_limit_update_time: Date;
    per_transaction_limit_update_time: Date;
}