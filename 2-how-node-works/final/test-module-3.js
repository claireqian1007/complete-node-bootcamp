console.log("Hello from the module"); //即使被调用多次该模块，但是这句话只会走一次，因为有缓存

module.exports = () => console.log("Log this beautiful text 😍");
