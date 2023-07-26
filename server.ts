import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import OfferRoute from './routes/OfferRoute'

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Routing
app.use('/',OfferRoute);

//  Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
