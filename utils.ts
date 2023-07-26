import { CreateLimitOfferParams } from "./routes/interfaces/params";
import { LimitType } from "./db/interfaces/attributes/Offer";

export function validateCreateLimitOfferParams(params: CreateLimitOfferParams): string | null {
    if (!params.accountId || !params.limitType || !params.newLimit) {
        return 'Invalid offer data. accountId, limitType, and newLimit are required.';
    }

    if (!Object.values(LimitType).includes(params.limitType)) {
        return 'Invalid limitType. It should be either ACCOUNT_LIMIT or PER_TRANSACTION_LIMIT.';
    }

    const now = Date.now();
    const activationTime = new Date(params.offerActivationTime).getTime();
    const expiryTime = new Date(params.offerExpiryTime).getTime();

    if (isNaN(activationTime) || activationTime <= now) {
        return 'Invalid offerActivationTime. It should be a valid future date.';
    }

    if (isNaN(expiryTime) || expiryTime <= now) {
        return 'Invalid offerExpiryTime. It should be a valid future date.';
    }

    if (expiryTime <= activationTime) {
        return 'Invalid offerExpiryTime. It should be after offerActivationTime.';
    }

    return null;
}