const fs = require("fs");
const crypto = require("crypto");

const start = Date.now();
process.env.UV_THREADPOOL_SIZE = 4; //加密行为会放到线程池里完成，完成速度取决于线程池的大小

setTimeout(() => console.log("Timer 1 finished"), 0);
setImmediate(() => console.log("Immediate 1 finished"));

fs.readFile("test-file.txt", () => {
  console.log("I/O finished");
  console.log("----------------");

  setTimeout(() => console.log("Timer 2 finished"), 0);
  setTimeout(() => console.log("Timer 3 finished"), 3000);
  setImmediate(() => console.log("Immediate 2 finished")); //在 I/O 的回调函数中，setImmediate 的回调会被优先添加到下一个事件循环的阶段处理。

  process.nextTick(() => console.log("Process.nextTick"));

  crypto.pbkdf2Sync("password", "salt", 100000, 1024, "sha512"); //如果是用async方法，这些会在正常的I/O阶段执行（线程池中），也不会block eventloop
  console.log(Date.now() - start, "Password encrypted");

  crypto.pbkdf2Sync("password", "salt", 100000, 1024, "sha512");
  console.log(Date.now() - start, "Password encrypted");

  crypto.pbkdf2Sync("password", "salt", 100000, 1024, "sha512");
  console.log(Date.now() - start, "Password encrypted");

  crypto.pbkdf2Sync("password", "salt", 100000, 1024, "sha512");
  console.log(Date.now() - start, "Password encrypted");
});

console.log("Hello from the top-level code");
