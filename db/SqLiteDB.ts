import { Database } from 'sqlite3';
import { IDbOrm } from './interfaces/ORM';
import { IOfferAttributes, OfferStatus, LimitType } from './interfaces/attributes/Offer'
import { IAccountAttributes } from './interfaces/attributes/Account'

export class SqLiteDB implements IDbOrm {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    private readonly CREATE_ACCOUNT_TABLE_QUERY = `
        CREATE TABLE IF NOT EXISTS Account (
            account_id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id TEXT NOT NULL,
            account_limit NUMERIC NOT NULL,
            per_transaction_limit NUMERIC NOT NULL,
            last_account_limit NUMERIC NOT NULL,
            last_per_transaction_limit NUMERIC NOT NULL,
            account_limit_update_time TEXT NOT NULL,
            per_transaction_limit_update_time TEXT NOT NULL
        )
    `;

    private readonly CREATE_OFFER_TABLE_QUERY = `
        CREATE TABLE IF NOT EXISTS Offer (
            offer_id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            limit_type TEXT NOT NULL,
            new_limit NUMERIC NOT NULL,
            offer_activation_time TEXT NOT NULL,
            offer_expiry_time TEXT NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (account_id) REFERENCES Account(account_id) ON DELETE CASCADE
        )
    `;


    private async runAsync(query: string, values?: any[]): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(query, values, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    private async insertRow(table: string, values: any[], columns: string[]): Promise<number> {
        const placeholders = columns.map(() => '?').join(', ');
        const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

        return new Promise<number>((resolve, reject) => {
            this.db.run(query, values, function (err: Error | null) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    async getAccountLimit(accountId: number, limitType: LimitType): Promise<number> {
        const limitColumn = limitType === LimitType.ACCOUNT_LIMIT ? 'account_limit' : 'per_transaction_limit';
        const query = `SELECT ${limitColumn} FROM Account WHERE account_id = ?`;

        return new Promise<number>((resolve, reject) => {
            this.db.get(query, [accountId], (err, row: IAccountAttributes) => {
                if (err) {
                    reject(err);
                } else {
                    if (!row) {
                        reject(new Error(`Account with account_id ${accountId} not found.`));
                    } else {
                        resolve(row[limitColumn]);
                    }
                }
            });
        });
    }

    async createTables(): Promise<void> {
        try {
            await Promise.all([
                this.runAsync(this.CREATE_ACCOUNT_TABLE_QUERY),
                this.runAsync(this.CREATE_OFFER_TABLE_QUERY),
            ]);
            console.log('Tables created successfully.');
        } catch (error) {
            console.error('Error creating tables:', error);
            throw error;
        }
    }

    async createOffer(offer: IOfferAttributes): Promise<number> {
        try {
            const table = 'Offer';
            const columns = ['account_id', 'limit_type', 'new_limit', 'offer_activation_time', 'offer_expiry_time', 'status'];
            const values = [
                offer.account_id,
                offer.limit_type,
                offer.new_limit,
                offer.offer_activation_time,
                offer.offer_expiry_time,
                offer.status,
            ];

            return await this.insertRow(table, values, columns);
        } catch (error) {
            throw new Error('Error creating limit offer: ' + error);
        }
    }

    listActiveOffers(accountId: number, activeDate?: Date): Promise<IOfferAttributes[]> {
        return new Promise((resolve, reject) => {
            let query = `
            SELECT * FROM Offer WHERE account_id = ? AND status = 'PENDING'
          `;
            const values: (string | number)[] = [accountId];
            if (activeDate) {
                query += ' AND offer_activation_time <= ? AND offer_expiry_time > ?';
                values.push(activeDate.toISOString(), activeDate.toISOString());
            }
            this.db.all(query, values, (err: Error | null, rows: IOfferAttributes[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async updateOfferStatus(offerId: number, status: OfferStatus): Promise<void> {
        const updateAccount = status === OfferStatus.ACCEPTED;

        try {
            const offerQuery = `SELECT * FROM Offer WHERE offer_id = ?`;
            const offerRow: IOfferAttributes = await new Promise((resolve, reject) => {
                this.db.get(offerQuery, [offerId], (err, row: IOfferAttributes) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (!row) {
                            reject(new Error(`Offer with offer_id ${offerId} not found.`));
                        } else {
                            resolve(row);
                        }
                    }
                });
            });
            if (offerRow.status !== OfferStatus.PENDING) {
                throw new Error(`Offer with offer_id ${offerId} has already been redeemed.`);
            }
            if (updateAccount) {
                const currentLimit = await this.getAccountLimit(offerRow.account_id, offerRow.limit_type);
                if (offerRow.limit_type === LimitType.ACCOUNT_LIMIT) {
                    const updateAccountQuery = `
                        UPDATE Account
                        SET
                            last_account_limit = ?,
                            account_limit = ?,
                            account_limit_update_time = ?
                        WHERE account_id = ?
                    `;

                    const accountValues = [currentLimit, offerRow.new_limit,new Date(), offerRow.account_id];

                    await new Promise<void>((resolve, reject) => {
                        this.db.run(updateAccountQuery, accountValues, (err: Error | null) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                } else if (offerRow.limit_type === LimitType.PER_TRANSATION_LIMIT) {
                    const updateAccountQuery = `
                        UPDATE Account
                        SET
                            last_per_transaction_limit = ?,
                            per_transaction_limit = ?,
                            per_transaction_limit_update_time = ?
                        WHERE account_id = ?
                    `;
                    const accountValues = [currentLimit, offerRow.new_limit,new Date(), offerRow.account_id];

                    await new Promise<void>((resolve, reject) => {
                        this.db.run(updateAccountQuery, accountValues, (err: Error | null) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                }
            }

            const updateOfferQuery = `UPDATE Offer SET status = ? WHERE offer_id = ?`;
            const offerValues = [status, offerId];

            await new Promise<void>((resolve, reject) => {
                this.db.run(updateOfferQuery, offerValues, (err: Error | null) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } catch (error) {
            throw new Error('Error updating offer status: ' + error);
        }
    }

    async createAccount(account: IAccountAttributes): Promise<number> {
        try {
            const table = 'Account';
            const columns = [
                'customer_id',
                'account_limit',
                'per_transaction_limit',
                'last_account_limit',
                'last_per_transaction_limit',
                'account_limit_update_time',
                'per_transaction_limit_update_time',
            ];
            const values = [
                account.customer_id,
                account.account_limit,
                account.per_transaction_limit,
                account.last_account_limit,
                account.last_per_transaction_limit,
                account.account_limit_update_time.toISOString(),
                account.per_transaction_limit_update_time.toISOString(),
            ];

            return await this.insertRow(table, values, columns);
        } catch (error) {
            throw new Error('Error creating account: ' + error);
        }
    }

    getAccountById(accountId: number): Promise<IAccountAttributes | null> {
        return new Promise((resolve, reject) => {
            const query = `
            SELECT * FROM Account WHERE account_id = ?
          `;
            const values = [accountId];

            this.db.get(query, values, (err: Error | null, row: IAccountAttributes) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
}