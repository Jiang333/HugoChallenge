import { Router } from 'express'

import * as Controllers from '../controllers/application';

const routes = Router();

routes.post('/', async (req, res) => {
    console.log(`POST`)
    req.body.vehicles.forEach(element => {
         element.year = parseInt(element.year, 10)
    });
    const app = await Controllers.createApplication(req.body);
    res.json({
        message: `Start a new insurance application with id ${app.id}`,
        url: `http://localhost:5173/${app.id}`,
        id: app.id,
    });
});

routes.get('/:id', async (req, res) => {
    console.log(`GET: ${req.params.id}`)
    const app = await Controllers.findApplication(req)
    res.json({
        app,
        message: `Get insurance application with id ${req.params.id}`,
    });
});

routes.put('/:id', async (req, res) => {
    console.log(`PUT: ${req.params.id}`)
    req.body.vehicles.forEach(element => {
        element.year = parseInt(element.year, 10)
   });
    const app = await Controllers.updateApplication(req.params.id, req.body)
    res.json({
        app,
        message: `Update insurance application with id ${req.params.id}`,
        id: res.id
    });
});

routes.post('/:id/submit', async (req, res) => {
    function randomIntFromInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    }
    console.log("submitted")
    res.json({
        message: `Submit insurance application with id ${req.params.id}`,
        quote: randomIntFromInterval(50,100)
    });
});

export default routes;
