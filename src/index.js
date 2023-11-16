const express = require('express'); // To build an application server or API
const app = express();
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcrypt'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part B.

const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

  app.set('view engine', 'ejs'); // set the view engine to EJS
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);


app.get('/welcome', (req, res) => {
    res.json({status: 'success', message: 'Welcome!'});
  });

app.post('/login', async (req, res) => {
  // To-DO: Retrieve username and hashed password from the 'users' table
  // const select = "SELECT * FROM users WHERE username = $1";
  // db.one(select, [req.body.username])
  //   .then(async (user) => {
  //     // To-DO: Compare the password with the hashed password
  //     const match = await bcrypt.compare(req.body.password, user.password);
  //     if (match) {
  //       // To-DO: Store the username in the session
  //       req.session.user = user;
  //       req.session.save();
  //       res.redirect('/discover');
  //     } else {
  //         alert("Invalid username or password")
  //         res.redirect('/login');
  //     }
  //   })
  //   .catch(error => {
  //     console.log(error);
  //   });
  const hash = await bcrypt.hash(req.body.password, 10);
  res.status(200).json({
    username: req.body.username,
    password: req.body.password,
    hashedPassword: hash
  });
});

app.get('/home', (req, res) => {
  let data = 'fields name,aggregated_rating,genres.name;\nsort aggregated_rating desc;\nwhere aggregated_rating != null & genres != null;';

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.igdb.com/v4/games',
    headers: { 
      'Client-ID': process.env.TWITCH_CID, 
      'Authorization': 'Bearer '+ process.env.ACCESS_TOKEN, 
      'Content-Type': 'text/plain', 
      'Cookie': '__cf_bm=8QJ8jiONy6Mtn0esNjAq1dWDKMpRoJSuFwD.GELBeBY-1699991247-0-AVsH85k1GHSbc/QyMLxL41NsnyPCcMewbUmoqYU27SEklnJ+yZp3DmsAJWgoIQf4n8xdepIl4htcY4I65HSmaZQ='
    },
    data : data
  };

  axios.request(config)
  .then((response) => {
    console.log(JSON.stringify(response.data));
    res.render("pages/home", {games: response});
  })
  .catch((error) => {
    console.log(error);
  });
});

app.post("/upload-img", (req, res) => {
  // const data = 
});

  module.exports  = app.listen(3000);
  console.log('Server is listening on port 3000');
