import express from 'express';

const app = express();

app.get('/', (request, response) => {
    response.send("xD");
});

app.listen(3333);
