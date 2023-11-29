const express = require('express'); // To build an application server or API
const app = express();
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcrypt'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part B.
const path = require('path');

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

app.use(express.static(path.join(__dirname, 'resources')));

// Test API
app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});

});
///////////////////////////////////////////////////////////////////////////////////////
app.get('/')

app.get('/', (req, res) => {
  res.redirect("/login");
  });
  
app.get("/login", (req, res) => {
  res.render("pages/login");
});

app.get("/discover", (req, res) => {
  let data =
    'fields cover.url, id,name,aggregated_rating,genres.name, screenshots.url, storyline ;\nsort aggregated_rating desc;\nwhere cover.url != null & aggregated_rating != null & genres != null & screenshots!=null & storyline != null;';

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api.igdb.com/v4/games",
    headers: {
      "Client-ID": process.env.TWITCH_CID,
      Authorization: "Bearer " + process.env.ACCESS_TOKEN,
      "Content-Type": "text/plain",
      Cookie:
        "__cf_bm=8QJ8jiONy6Mtn0esNjAq1dWDKMpRoJSuFwD.GELBeBY-1699991247-0-AVsH85k1GHSbc/QyMLxL41NsnyPCcMewbUmoqYU27SEklnJ+yZp3DmsAJWgoIQf4n8xdepIl4htcY4I65HSmaZQ=",
    },
    data: data,
  };
  axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
      res.status(200).render("pages/discover", { games: response.data });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send("Failure");
    });
});


app.post("/login", async (req, res) => {
  // check if password from request matches with password in DB
  const query = "SELECT * FROM users where username = $1;";
  const username = req.body.username;

  db.any(query, [username])
      .then(async function (data) {
          if(data.length > 0){
              const match = await bcrypt.compare(req.body.password, data[0].password);
          console.log(match);

          console.log(data[0])

          
          console.log("Database connection and search successful");
          
          if(match){
              req.session.user = username;
              req.session.save();
              res.redirect("/home");
          } else {
              throw new Error("User not found")
          }
          } else {
              res.redirect("/home")
          }
      })
      .catch((err) => {
          console.log("Login Failed!!!")
          res.status(200).render("pages/login"), {
              message: "Login failed, please double check your login",
          };
      });
})

const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/register");
  }
  next();
};

// // Authentication Required
// app.use(auth);

// Route for logout
app.get('/logout', (req, res) => {
  // Destroy the user's session
  req.session.destroy((err) => {
    if(err) {
      console.error('Error during logout:', err);
    } 
    
    else {
      console.log('Logged out Succesfully');
    }
    
    // Redirect to the login page with a success message
    res.render('pages/logout', { message: 'Logged out Successfully', error: false });
  });
});

app.get('/home', (req, res) => {
  res.redirect('/discover');
  // let data = 'fields name,aggregated_rating,genres.name;\nsort aggregated_rating desc;\nwhere aggregated_rating != null & genres != null;';

  // let config = {
  //   method: 'post',
  //   maxBodyLength: Infinity,
  //   url: 'https://api.igdb.com/v4/games',
  //   headers: { 
  //     'Client-ID': process.env.TWITCH_CID, 
  //     'Authorization': 'Bearer '+ process.env.ACCESS_TOKEN, 
  //     'Content-Type': 'text/plain', 
  //     'Cookie': '__cf_bm=8QJ8jiONy6Mtn0esNjAq1dWDKMpRoJSuFwD.GELBeBY-1699991247-0-AVsH85k1GHSbc/QyMLxL41NsnyPCcMewbUmoqYU27SEklnJ+yZp3DmsAJWgoIQf4n8xdepIl4htcY4I65HSmaZQ='
  //   },
  //   data : data
  // };

  // axios.request(config)
  // .then((response) => {
  //   console.log(JSON.stringify(response.data));
  //   res.sendStatus(200).message("Success").render("pages/home", {games: response});
  // })
  // .catch((error) => {
  //   res.sendStatus(500).message("Failure");
  //   console.log(error);
  // });
});

app.post("/upload-img", (req, res) => {
  // const data = 
});

// Register
app.post('/register', async (req, res) => {
  //hash the password using bcrypt library
  const hash = await bcrypt.hash(req.body.password, 10); // Add this back in bcrypt.hash
  const username = await req.body.username;
  const firstName = await req.body.firstName;
  const lastName = await req.body.lastName;
  const email = await req.body.email;

  const insertUsers = `INSERT INTO users (username, email, firstName, lastName, password) VALUES ('${username}', '${email}', '${firstName}', '${lastName}', '${hash}');`;
  db.any(insertUsers)
      // If query succeeds, will send an okay status, post on the console for dev purposes
      .then(function (data){
          console.log("User Registration Successful")
          res.redirect('/login');
      })
      // If query fails due to error in retrieving required information
      .catch(function (err){
          console.log("User Registration Failed, Please Try Again")
          res.redirect('/');
      })
})

app.get('/register', (req, res) =>{
  res.render('pages/register');
});

app.get('/game/:gameid', (req, res) =>{
  const gameID = req.params.gameid;
  // let gameName;
  // let targetData;
  let IGDBData;

  let data =
    `fields age_ratings,cover.url,id,name,aggregated_rating,genres.name, screenshots.url,storyline,summary ;\nsort aggregated_rating desc;\nwhere id=${gameID};`;

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api.igdb.com/v4/games",
    headers: {
      "Client-ID": process.env.TWITCH_CID,
      Authorization: "Bearer " + process.env.ACCESS_TOKEN,
      "Content-Type": "text/plain",
      Cookie:
        "__cf_bm=8QJ8jiONy6Mtn0esNjAq1dWDKMpRoJSuFwD.GELBeBY-1699991247-0-AVsH85k1GHSbc/QyMLxL41NsnyPCcMewbUmoqYU27SEklnJ+yZp3DmsAJWgoIQf4n8xdepIl4htcY4I65HSmaZQ=",
    },
    data: data,
  };
  axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
      // targetData = {
      //   url: `https://www.target.com/s?searchTerm=${gameName}`,
      //   name: gameName
      // };
      res.status(200).render("pages/game", {IGDB: response.data });
      // gameName = response.data[0].name;
      // IGDBData = response.data;
      
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send("Failure");
    });

  // const params = {
  //   api_key: process.env.TARGET_KEY,
  //     search_term: gameName,
  //     type: "search"
  //   }

    // make the http GET request to RedCircle API
    // axios.get('https://api.redcircleapi.com/request', { params })
    // .then(response => {
    
    //     // print the JSON response from RedCircle API
    //     console.log(JSON.stringify(response.data, 0, 2));
    //     targetData = JSON.stringify(response.data, 0, 2);
    //   }).catch(error => {
    // // catch and print the error
    // console.log(error);
    // });
  // res.render('pages/game', {target: targetData, IGDB: IGDBData});
});

  module.exports  = app.listen(3000);
  console.log('Server is listening on port 3000');
