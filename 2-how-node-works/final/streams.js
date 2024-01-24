const fs = require("fs");
const server = require("http").createServer();

server.on("request", (req, res) => {
  //res本身就是一个可写流
  // Solution 1 传统的读取方式，大文件就会要加载很久
  // fs.readFile("test-file.txt", (err, data) => {
  //   if (err) console.log(err);
  //   res.end(data);
  // });

  // Solution 2: Streams
  // const readable = fs.createReadStream("test-file.txt");
  // readable.on("data", chunk => { //可读流的事件-data
  //   res.write(chunk); //可写流事件-write
  //   //这个写法会导致一个问题：背压（back pressure）
  // });
  // readable.on("end", () => { //可读流的事件-end
  //   res.end(); //可写流的事件-end
  // });
  // readable.on("error", err => {
  //   console.log(err);
  //   res.statusCode = 500;
  //   res.end("File not found!");
  // });

  // Solution 3
  const readable = fs.createReadStream("test-file.txt");
  readable.pipe(res); //解决背压的问题
  // readableSource.pipe(writeableDest) - 解释上面这一行代码的意义
});

server.listen(8000, "127.0.0.1", () => {
  console.log("Listening...");
});
