const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json()); //middleware can modify incoming request data; post method need it

//define route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'hello form server side', app: 'natours' });
});

//top-level code not execute in event loop, so better put file read here
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
); //transfer json to js object

app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      tours,
    },
  });
});

app.post('/api/v1/tours', (req, res) => {
  console.log(req.body);
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);
  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`, //once the file is updated, the server will be refreshed, so next get api will get the latest data
    JSON.stringify(tours),
    err => {
      res.status(201).json({ //201 - created
        status: 'success', //return the new created data
        data: {
          tour: newTour,
        },
      });
    }
  );
});

const port = 3000;
app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});
