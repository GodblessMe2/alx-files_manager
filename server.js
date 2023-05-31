const express = require('express');
const dotenv = require('dotenv');
const router = require('./routes/index')

const app = express();

dotenv.config({ path: './config.env' })

app.use(express.json());
app.use('/', router);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});