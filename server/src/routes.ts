import express from 'express';

const routes = express.Router();

routes.get('/', (request, response) => {
    return response.json({message: "Servidor UP!"});
});

export default routes;
