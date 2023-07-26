import express, { Request, Response } from 'express';
import { Database } from 'sqlite3';
import { SqLiteDB } from '../db/SqLiteDB';
import { IDbOrm } from '../db/interfaces/ORM';
import {
    CreateLimitOfferParams,
    ListActiveLimitOffersParams,
    UpdateLimitOfferStatusParams,
    CreateAccountParams,
    GetAccountParams,
} from './interfaces/params';
import { OfferStatus, IOfferAttributes, LimitType } from '../db/interfaces/attributes/Offer';
import { IAccountAttributes } from '../db/interfaces/attributes/Account';
import { validateCreateLimitOfferParams } from '../utils';

const router = express.Router();

//  create an object of database
const sqlDb = new Database(':memory:');
sqlDb.exec('PRAGMA foreign_keys = ON;', (err) => {
    if (err) {
        console.error('Error enabling foreign key constraints:', err.message);
    } else {
        console.log('Foreign key constraints are enabled.');
    }
});
const db: IDbOrm = new SqLiteDB(sqlDb);

// create the database table
db.createTables()
    .then(() => {
        console.log('Account and Offer tables created');
    })
    .catch((error) => {
        console.error('Error creating database tables:', error);
    });

router.post('/createLimitOffer', async (req: Request, res: Response) => {
    try {
        const params: CreateLimitOfferParams = req.body;

        const validationError = validateCreateLimitOfferParams(params);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const currentLimit = await db.getAccountLimit(params.accountId, params.limitType);
        if (params.newLimit <= currentLimit) {
            return res.status(400).json({ error: 'Invalid newLimit. It should be greater than the current limit.' });
        }

        const offerId:number = await db.createOffer({
            account_id: params.accountId,
            limit_type: params.limitType,
            new_limit: params.newLimit,
            offer_activation_time: params.offerActivationTime,
            offer_expiry_time: params.offerExpiryTime,
            status: OfferStatus.PENDING,
        });
        res.status(201).json({"offerID" : offerId});
    } catch (error) {
        console.log(error);
        res.status(500).send('Error creating limit offer.');
    }
});

router.post('/listActiveLimitOffers', async (req: Request, res: Response) => {
    try {
        const params: ListActiveLimitOffersParams = req.body;
        const activeOffers: IOfferAttributes[] = await db.listActiveOffers(params.accountId, params.activeDate);
        res.status(200).json(activeOffers);
    } catch (error) {
        res.status(500).send('Error listing active limit offers.');
    }
});

router.post('/updateLimitOfferStatus', async (req: Request, res: Response) => {
    try {
        const params: UpdateLimitOfferStatusParams = req.body;
        if (!params.status || !params.limitOfferId) {
            return res.status(400).send('Insufficient data');
        }
        if (![OfferStatus.ACCEPTED, OfferStatus.REJECTED].includes(params.status)) {
            return res.status(400).send('Invalid status. It should be either ACCEPTED or REJECTED.');
        }
        await db.updateOfferStatus(params.limitOfferId, params.status);
        res.status(200).send('Limit offer status updated successfully.');
    } catch (error) {
        res.status(500).send('Error updating limit offer status.');
    }
});

router.post('/createAccount', async (req: Request, res: Response) => {
    try {
        const params: CreateAccountParams = req.body;

        if (!params.customer_id || !params.account_limit || !params.per_transaction_limit) {
            return res.status(400).send('All fields (customer_id, account_limit, per_transaction_limit) are required.');
        }

        const accountId:number = await db.createAccount({
            customer_id: params.customer_id,
            account_limit: params.account_limit,
            per_transaction_limit: params.per_transaction_limit,
            last_account_limit: 0,
            last_per_transaction_limit: 0,
            account_limit_update_time: new Date(),
            per_transaction_limit_update_time: new Date(),
        });
        res.status(201).json({"Account Id" : accountId});
    } catch (error) {
        console.log(error)
        res.status(500).send('Error creating account.');
    }
});

router.post('/getAccount', async (req: Request, res: Response) => {
    try {
        const params: GetAccountParams = req.body;
        const account: IAccountAttributes | null = await db.getAccountById(params.accountId);
        if (account) {
            res.status(200).json(account);
        } else {
            res.status(404).send('Account not found.');
        }
    } catch (error) {
        res.status(500).send('Error fetching account details.');
    }
});

export default router;