import { LimitType } from "../../db/interfaces/attributes/Offer";
import { OfferStatus } from "../../db/interfaces/attributes/Offer";

export interface CreateLimitOfferParams {
    accountId: number;
    limitType: LimitType;
    newLimit: number;
    offerActivationTime: Date;
    offerExpiryTime: Date;
}

export interface ListActiveLimitOffersParams {
    accountId: number;
    activeDate?: Date;
}

export interface UpdateLimitOfferStatusParams {
    limitOfferId: number;
    status: OfferStatus;
}

export interface CreateAccountParams {
    customer_id: number;
    account_limit: number;
    per_transaction_limit: number;
}

export interface GetAccountParams {
    accountId: number;
}
