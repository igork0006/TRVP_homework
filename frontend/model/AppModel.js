
export default class AppModel {

    static async getOrders() {
        try{
            const orderResponse = await fetch('http://localhost:4321/orders'); // get запрос по-умолчанию
            const ordersBody = await orderResponse.json();
            
            if(orderResponse.status !== 200){
                return Promise.reject(ordersBody);
            }

            return ordersBody;
        } catch(err){
            console.log(err.message);
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async getProducts() {
        try{
            const productResponse = await fetch('http://localhost:4321/products'); // get запрос по-умолчанию
            const productBody = await productResponse.json();
            
            if(productResponse.status !== 200){
                console.log("here");
                return Promise.reject(productBody);
            }

            return productBody;
        } catch(err){
            console.log(err.message);
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async addOrder({ orderID, name, datetime = -1 } = {
        orderID: null,
        name: '',
        datetime: -1
    }) {
        try{
            const addOrderResponse = await fetch(
                'http://localhost:4321/orders',
                {
                    method: 'POST',
                    body: JSON.stringify({ orderID, name, datetime }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ); // get запрос по-умолчанию
            if(addOrderResponse.status !== 200){
                const addOrderBody = await addOrderResponse.json();
                return Promise.reject(addOrderBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Order '${name}' was successfully added to list of order lists`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async addPosition({ positionID, count = -1, orderID, productID } = {
        positionID: null, 
        count: -1, 
        orderID: null, 
        productID: null
    }) {
        try{
            console.log(positionID, count, orderID, productID);
            const addPositionResponse = await fetch(
                'http://localhost:4321/positions',
                {
                    method: 'POST',
                    body: JSON.stringify({ positionID, count, orderID, productID }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ); // get запрос по-умолчанию

            if(addPositionResponse.status !== 200){
                const addPositionBody = await addPositionResponse.json();
                return Promise.reject(addPositionBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Position '${positionID}' was successfully added to order`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async updateOrder({ orderID, name, datetime = -1 } = {
        orderID: null,
        name: '',
        datetime: -1
    }) {
        try{
            const updateOrderResponse = await fetch(
                `http://localhost:4321/orders/${orderID}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({name, datetime}),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ); // get запрос по-умолчанию

            if(updateOrderResponse.status !== 200){
                const updateOrderBody = await updateOrderResponse.json();
                return Promise.reject(updateOrderBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Order '${name}' was successfully update`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async deleteOrder({ orderID } = {
        orderID: null
    }) {
        try{
            const deleteOrderResponse = await fetch(
                `http://localhost:4321/orders/${orderID}`,
                {
                    method: 'DELETE'
                }
            ); // get запрос по-умолчанию

            if(deleteOrderResponse.status !== 200){
                const deleteOrderBody = await deleteOrderResponse.json();
                return Promise.reject(deleteOrderBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Order (ID = '${orderID}') was successfully delete from list`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }
    static async deleteOrderByDate({ datetime } = {
        datetime: -1
    }) {
        try{
            console.log("datetime", datetime);
            const deleteOrderByDateResponse = await fetch(
                `http://localhost:4321/orders`,
                {
                    method: 'DELETE',
                    body: JSON.stringify({ datetime }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ); // get запрос по-умолчанию
            console.log("datetime", datetime);
            if(deleteOrderByDateResponse.status !== 200){
                const deleteOrderByDateBody = await deleteOrderByDateResponse.json();
                return Promise.reject(deleteOrderByDateBody);
            }
            console.log("datetime", datetime);
            return {
                timestamp: new Date().toISOString(),
                message: `Orders with a date less than ${datetime} have been deleted`
            };
        } catch(err){
            console.log("i am not here");
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }
    static async deletePosition({ positionID } = {
        positionID: null
    }) {
        try{
            const deletePositionResponse = await fetch(
                `http://localhost:4321/positions/${positionID}`,
                {
                    method: 'DELETE'
                }
            ); // get запрос по-умолчанию

            if(deletePositionResponse.status !== 200){
                const deletePositionBody = await deletePositionResponse.json();
                return Promise.reject(deletePositionBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Position (ID = '${positionID}') was successfully delete from order`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }


    static async movePosition({ positionID, srcOrderID, destOrderID } = {
        positionID: null,
        srcOrderID: null,
        destOrderID: null
    }) {
        try{
            const movePositionResponse = await fetch(
                `http://localhost:4321/positions`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ positionID, srcOrderID, destOrderID }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ); // get запрос по-умолчанию

            if(movePositionResponse.status !== 200){
                const movePositionBody = await movePositionResponse.json();
                return Promise.reject(movePositionBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Position '${positionID}}' was successfully moved from ${srcOrderID} to ${destOrderID} `
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }
    static async updateProducts() {
        try{
            const updateProductsResponse = await fetch(
                `http://localhost:4321/products`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ); // get запрос по-умолчанию

            if(updateProductsResponse.status !== 200){
                const updateProductsBody = await updateProductsResponse.json();
                return Promise.reject(updateProductsBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: 'Products was successfully updated'
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }
}


