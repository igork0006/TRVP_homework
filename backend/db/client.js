import pg from 'pg';

export default class DB {
    #dbClient = null;
    #dbHost = '';
    #dbPort = '';
    #dbName = '';
    #dbLogin = '';
    #dbPassword = '';

    constructor(){
        this.#dbHost = process.env.DB_HOST;
        this.#dbPort = process.env.DB_PORT;
        this.#dbName = process.env.DB_NAME;
        this.#dbLogin = process.env.DB_LOGIN;
        this.#dbPassword = process.env.DB_PASSWORD;

        this.#dbClient = new pg.Client({
            user: this.#dbLogin,
            password: this.#dbPassword,
            host: this.#dbHost,
            port: this.#dbPort,
            database: this.#dbName
        })
    }

    async connect() {
        try{
            await this.#dbClient.connect();
            console.log('DB connection established');

        } catch(error){
            console.error('Unable to connect to DB: ', error);
            return Promise.reject(error);
        }
    }

    async disconnect() {
        try{
            await this.#dbClient.end();
            console.log('DB connection was closed');
            

        } catch(error){
            console.error('Unable to disconnect to DB: ', error);
            return Promise.reject(error);
            
        }
    }

    async getOrders(){
        try {
            const orders = await this.#dbClient.query(
                'SELECT * FROM orders ORDER BY datetime;'
            );
            return orders.rows;

        } catch (error) {
            console.error('Unable get orders, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async getPositions(){
        try {
            const positions = await this.#dbClient.query(
                'SELECT positions.id, products.name, positions.count, order_id, product_id FROM positions LEFT JOIN products ON positions.product_id = products.id;'
            );
            return positions.rows;

        } catch (error) {
            console.error('Unable get positions, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async getProducts(){
        try {
            const products = await this.#dbClient.query(
                'SELECT * FROM products ORDER BY name;'
            );
            return products.rows;

        } catch (error) {
            console.error('Unable get positions, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async addOrder({
        orderID,
        name,
        datetime = -1
    } = {
        orderID: null,
        name: '',
        datetime: -1
    }){
        if(!orderID ||!name || !datetime){
            const errMsg = `Add order error: wrong params (id: ${orderID},name: ${name}, datetime: ${datetime})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }

        try {
            await this.#dbClient.query(
                'INSERT INTO orders (id, name, datetime) values ($1, $2, to_timestamp(($3 + 10800000.0) / 1000.0));',
                [orderID, name, datetime]
            );

        } catch (error) {
            console.error('Unable add order, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async addPosition({
        positionID,
        count = -1,
        orderID,
        productID
    } = {
        positionID: null,
        count: -1,
        orderID: null,
        productID: null
    }){
        if(!positionID || count < 0 || !orderID || !productID){
            const errMsg = `Add position error: wrong params (id: ${orderID}, count: ${count}, orderID: ${orderID}, productID: ${productID})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }

        try {
            await this.#dbClient.query(
                'INSERT INTO positions (id, count, order_id, product_id) VALUES ($1, $2, $3, $4);',
                [positionID, count, orderID, productID]
            );
            await this.#dbClient.query(
                'UPDATE orders SET positions = array_append(positions, $1) where id = $2;',
                [positionID, orderID]
            );
            await this.#dbClient.query(
                'UPDATE products SET count = count - $1 where id = $2;',
                [count, productID]
            );

        } catch (error) {
            console.error('Unable add position, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async deleteOrder({
        orderID
    } = {
        orderID: null
    }){
        if(!orderID){
            const errMsg = `Delete order error: wrong params (id: ${orderID})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }
        
        try {
            await this.#dbClient.query(
                'DELETE FROM positions WHERE order_id = $1;',
                [orderID]
            );
            await this.#dbClient.query(
                'DELETE FROM orders WHERE id = $1;',
                [orderID]
            );

        } catch (error) {
            console.error('Unable delete order, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async deleteOrderByDate({
        datetime = -1
    } = {
        datetime: -1
    }){
        if(datetime < 0){
            const errMsg = `Delete by date order error: wrong params (datetime: ${datetime})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }

        try {
            const queryResult = await this.#dbClient.query(
                'SELECT id FROM orders WHERE date(datetime) < date(to_timestamp($1 / 1000.0));',
                [datetime]
            );

            let counter = queryResult.rows.length;

            for (let i = counter; i > 0; i--) {
                const {id: orderID} = queryResult.rows[i-1];
                await this.#dbClient.query(
                    'DELETE FROM positions WHERE order_id = $1;',
                    [orderID]
                );
                await this.#dbClient.query(
                    'DELETE FROM orders WHERE id = $1;',
                    [orderID]
                );
            }
            

        } catch (error) {
            console.error('Unable delete order by date, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async deletePosition({
        positionID
    } = {
        positionID: null
    }){
        if(!positionID){
            const errMsg = `Delete position error: wrong params (id: ${positionID})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }
        
        try {
            const queryResult = await this.#dbClient.query(
                'SELECT order_id FROM positions WHERE id = $1;',
                [positionID]
            );
            const {order_id: orderID} = queryResult.rows[0];
            
            await this.#dbClient.query(
                'DELETE FROM positions WHERE id = $1;',
                [positionID]
            );
            await this.#dbClient.query(
                'UPDATE orders SET positions = array_remove(positions, $1) WHERE id = $2;',
                [positionID, orderID]
            );

        } catch (error) {
            console.error('Unable delete position, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async updateOrder({
        orderID,
        name,
        datetime = -1
    } = {
        orderID: null,
        name: '',
        datetime:-1,
    }){
        if((!name && datetime < 0) || !orderID){
            const errMsg = `Update order error: wrong params (id: ${orderID}, name: ${name}, datetime: ${datetime})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }

        let query = null;
        const queryParams = [];

        if(name && datetime >= 0){
            query = 'UPDATE orders SET name = $1, datetime = to_timestamp($2 / 1000.0) WHERE id = $3;';
            queryParams.push(name, datetime, orderID);
        } else if(name){
            query = 'UPDATE orders SET name = $1 WHERE id = $2;';
            queryParams.push(name, orderID);
        } else {
            query = 'UPDATE orders SET datetime = to_timestamp($1 / 1000.0) WHERE id = $2;';
            queryParams.push(datetime, orderID);
        }

        try {
            await this.#dbClient.query(
                query,
                queryParams
            );
        } catch (error) {
            console.error('Unable update order, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async movePosition({
        positionID,
        srcOrderID,
        destOrderID
    } = {
        positionID: null,
        srcOrderID: null,
        destOrderID: null
    }){
        if(!positionID || !srcOrderID || !destOrderID){
            const errMsg = `Move position error: wrong params (positionID: ${positionID}, srcOrderID: ${srcOrderID}, destOrderID: ${destOrderID})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }

        try {
            await this.#dbClient.query(
                'UPDATE positions SET order_id = $1 WHERE id = $2;',
                [destOrderID, positionID]
            );
            await this.#dbClient.query(
                'UPDATE orders SET positions = array_append(positions, $1) WHERE id = $2;',
                [positionID, destOrderID]
            );
            await this.#dbClient.query(
                'UPDATE orders SET positions = array_remove(positions, $1) WHERE id = $2;',
                [positionID, srcOrderID]
            );

        } catch (error) {
            console.error('Unable move task, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }
    async updateProducts(){
        try {
            const queryResult = await this.#dbClient.query('SELECT id FROM products ORDER BY name;');

            let counter = queryResult.rows.length;

            for (let i = counter; i > 0; i--) {
                const {id: productID} = queryResult.rows[i-1];
                await this.#dbClient.query(
                    'UPDATE products SET count = count + $1 WHERE id = $2;',
                    [Math.floor(Math.random() * (20 - 5) + 5), productID] // Максимум не включается, минимум включается
                );
            }
        } catch (error) {
            console.error('Unable update prroducts, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }
}