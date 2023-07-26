export enum LimitType{
    ACCOUNT_LIMIT = "ACCOUNT_LIMIT",
    PER_TRANSATION_LIMIT = "PER_TRANSACTION_LIMIT"
}

export enum OfferStatus{
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED"
}

export interface IOfferAttributes {
    offer_id?: number;
    account_id: number;
    limit_type: LimitType;
    new_limit: number;
    offer_activation_time: Date;
    offer_expiry_time: Date;
    status: OfferStatus;
}