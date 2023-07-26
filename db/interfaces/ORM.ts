import { IOfferAttributes,OfferStatus,LimitType } from "./attributes/Offer";
import { IAccountAttributes } from "./attributes/Account";

export interface IDbOrm {
    createTables(): Promise<void>;
    getAccountLimit(accountId: number, limitType: LimitType): Promise<number>

    createOffer(offer: IOfferAttributes): Promise<number>;
    listActiveOffers(accountId: number, activeDate?: Date): Promise<IOfferAttributes[]>;
    updateOfferStatus(offerId: number, status: OfferStatus): Promise<void>;

    //  additional apis
    createAccount(account: IAccountAttributes): Promise<number>;
    getAccountById(accountId: number): Promise<IAccountAttributes | null>;
}