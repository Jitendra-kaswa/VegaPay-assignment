# VegaPay Assignment

## Description

This is a TypeScript Node.js project that provides APIs for managing account limits and offers.

## Dependencies

- Express.js
- Body-parser
- CORS
- SQLite3

## Development Dependencies

- TypeScript
- ts-node


## Installation

1. Make sure you have [Node.js](https://nodejs.org/) installed.

2. Clone the repository:

```bash
git clone https://github.com/Jitendra-kaswa/VegaPay-assignment.git
```
### 1. Install the dependencis
```bash
cd VegaPay-assignment
npm install
```

## Usage
To start the server, run the following command:
```bash
npm start
```

The server will start listening on http://localhost:3000/.

## API Endpoints

All APIs are POST APIs.

### 1. Create Limit Offer

**Endpoint:** `http://localhost:3000/createLimitOffer`

**Request Payload:**

```json
{
  "accountId": 1,
  "limitType": "ACCOUNT_LIMIT",
  "newLimit": 14000,
  "offerActivationTime": "2023-07-31T10:00:00Z",
  "offerExpiryTime": "2023-08-31T10:00:00Z"
}
```
### 2. Create Account

**Endpoint:** `http://localhost:3000/createAccount`

**Request Payload:**

```json
{
  "customer_id": 789,
  "account_limit": 10000,
  "per_transaction_limit": 2000
}
```
### 3. List Active Limit Offers

**Endpoint:** `http://localhost:3000/listActiveLimitOffers`

**Request Payload:**

```json
{
  "accountId": 1
}
```
### 4. Update Limit Offer Status

**Endpoint:** `http://localhost:3000/updateLimitOfferStatus`

**Request Payload:**

```json
{
  "limitOfferId": 1,
  "status": "REJECTED"
}
```
### 5. Get Account

**Endpoint:** `http://localhost:3000/getAccount`

**Request Payload:**

```json
{
  "accountId": 1
}
```

