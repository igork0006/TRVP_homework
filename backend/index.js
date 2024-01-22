import dotenv from 'dotenv';
import express, { response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url'
import DB from './db/client.js';
import { timeStamp } from 'console';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url); //полный путь к файлу
const __dirname = path.dirname(__filename);   //полный путь к директории

dotenv.config(
    {
        path: './backend/.env'
    }
);

const appHost = process.env.APP_HOST;
const appPort = process.env.APP_PORT;

const app = express();
const db = new DB();

// Логгирующуя прослойка
app.use('*', (req, res, next) => {
    console.log(
        req.method,
        req.baseUrl || req.url,
        new Date().toISOString()
    );

    db.deleteOrderByDate({ datetime: Date.now()});
    next(); // следующий обработчик
});

// Прослойка для статических файлов
app.use('/', express.static(path.resolve(__dirname, '../dist')));

// get orders, positions and products
app.get('/orders', async (req, res) => {
    try {
        const [dbOrders, dbPositions] = await Promise.all([db.getOrders(),db.getPositions()]);
        
        const positions = dbPositions.map(({id, name, count}) => ({
            positionID: id, name, count
        })); 

        const orders = dbOrders.map(order => ({
            orderID: order.id,
            name: order.name,
            datetime: order.datetime,
            positions: positions.filter(position => order.positions.indexOf(position.positionID) !== -1)
        }));

        // console.log("orders", orders);
        const products = await db.getProducts();

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.json({ orders, products });

    } catch (err) {
        res.statusCode = 500;
        res.statusMessage = 'Internal server error';
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: 500,
            message: `Getting orders and positions error: ${err.error.message || err.error}`
        });
    }
});

app.get('/products', async (req, res) => {
    try {
        const products = await db.getProducts();
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.json(products);
    } catch (err) {
        res.statusCode = 500;
        res.statusMessage = 'Internal server error';
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: 500,
            message: `Getting orders and positions error: ${err.error.message || err.error}`
        });
    }
});

// body parsing middleware
app.use('/orders', express.json())
// add order
app.post('/orders', async (req, res) => {
    try{
        const { orderID, name, datetime } = req.body;
        // console.log("datetime", datetime);
        await db.addOrder({ orderID, name, datetime});
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();

    } catch(err) {
        switch(err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Add order error: ${err.error.message || err.error}`
        });
    }
});

// body parsing middleware
app.use('/positions', express.json())
// add position
app.post('/positions', async (req, res) => {
    try{
        const { positionID, count, orderID, productID } = req.body;
        await db.addPosition({ positionID, count, orderID, productID });
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();

    } catch(err) {
        switch(err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Add position error: ${err.error.message || err.error}`
        });
    }
});

// delete Order
app.delete('/orders/:orderID', async (req, res) => {
    try{
        const { orderID } = req.params;
        await db.deleteOrder({ orderID });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();

    } catch(err) {
        switch(err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Delete order error: ${err.error.message || err.error}`
        });
    }
});

// delete Order by date
app.delete('/orders', async (req, res) => {
    try{
        const { datetime } = req.body;
        await db.deleteOrderByDate({ datetime });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();

    } catch(err) {
        switch(err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Delete order by date error: ${err.error.message || err.error}`
        });
    }
});

// delete Position
app.delete('/positions/:positionID', async (req, res) => {
    try{
        const { positionID } = req.params;
        await db.deletePosition({ positionID });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();

    } catch(err) {
        switch(err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Delete position error: ${err.error.message || err.error}`
        });
    }
});

// body parsing middleware
app.use('/orders/:orderID', express.json());
// edit Order params
app.patch('/orders/:orderID', async (req, res) => {
    try{
        const { orderID } = req.params;
        const { name, datetime } = req.body;
        await db.updateOrder({ orderID, name, datetime });
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();

    } catch(err) {
        switch(err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Update order params error: ${err.error.message || err.error}`
        });
    }
});

// move Position between tasklists
app.patch('/positions', async (req, res) => {
    try{
        const { positionID, srcOrderID, destOrderID } = req.body;
        await db.movePosition({ positionID, srcOrderID, destOrderID });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();

    } catch(err) {
        switch(err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Move position error: ${err.error.message || err.error}`
        });
    }
})


app.patch('/products', async (req, res) => {
    try{
        await db.updateProducts();

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();

    } catch(err) {
        switch(err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Update products error: ${err.error.message || err.error}`
        });
    }
})


const server = app.listen(Number(appPort), appHost, async () => {
    try{
        await db.connect()
    } catch(error){
        console.log('Task manager app shut down');
        process.exit(100);
    }

    console.log(`Task manager app started at host http://${appHost}:${appPort}`);
    
    var day = 60 * 60 * 24 * 1000;
    // await db.deleteOrderByDate({ datetime: Date.now() - day });

    // let orderID = crypto.randomUUID();

    // await db.addOrder({ orderID, name: 'Никольский Александр', datetime: Date.now() - day * 1 });
    // await db.addPosition({ positionID: crypto.randomUUID(), count: 12, orderID, productID: '9866fcab-ef56-490f-b3b3-d658faa0e034' });
    // await db.addPosition({ positionID: crypto.randomUUID(), count: 12, orderID: '88ec4f4a-05e1-4433-beb5-67b0c55d8318', productID: '9866fcab-ef56-490f-b3b3-d658faa0e034' });
    // await db.deleteOrder({orderID: '0d0716b5-4431-4b5f-96b3-7683b9facccf'});
    // await db.deletePosition({positionID: '42113f54-d7c9-446a-b8eb-f3bfe6155f41'});
    // await db.updateOrder({orderID: '351acabd-c012-4491-be7c-5ac079e34cb5', datetime: Date.now()});
    // await db.movePosition({ positionID: 'a26d4a96-50d9-4cb8-a960-563665e75f74', srcOrderID: '88ec4f4a-05e1-4433-beb5-67b0c55d8318', destOrderID: '00208aff-2c97-4f47-970f-8e95d4e3763f' });

    // console.log(await db.getOrders());
    // console.log(await db.getPositions());

    // server.close(async () => {
    //     await db.disconnect();
    //     console.log('HTTP server closed');
    // });
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closed HTTP server')
    server.close(async () => {
        await db.disconnect();
        console.log('HTTP server closed');
    });
});