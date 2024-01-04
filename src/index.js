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

const createFriendshipsTable = `
  CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    user_id1 INT REFERENCES users(userId),
    user_id2 INT REFERENCES users(userId),
    status VARCHAR(20) DEFAULT 'pending'
  );
`;

db.none(createFriendshipsTable)
  .then(() => {
    console.log('Friendships table created successfully');
  })
  .catch((error) => {
    console.error('Error creating friendships table:', error.message || error);
  });

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

app.get("/discover", async (req, res) => {
  try {
    // Function to make API requests
    const fetchData = async (data) => {
      const config = {
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

      const response = await axios.request(config);
      return response.data;
    };

    // Make API calls for different genres
    const [discoverResponse, indieGames, adventureGames, platformers] =
      await Promise.all([
        fetchData(
          'fields cover.url,cover.image_id, id,name,aggregated_rating,genres.name, screenshots.url, storyline ; limit 50;\nsort aggregated_rating desc;\nwhere cover.url != null & aggregated_rating != null & genres != null & screenshots!=null & storyline != null & age_ratings != null;'
        ),
        fetchData(
          'fields cover.url,cover.image_id, id,name,aggregated_rating,genres.name, screenshots.url, storyline ; limit 50;\nsort aggregated_rating desc;\nwhere cover.url != null & aggregated_rating != null & genres.name="Indie" & screenshots!=null & storyline != null & age_ratings != null;'
        ),
        fetchData(
          'fields cover.url,cover.image_id, id,name,aggregated_rating,genres.name, screenshots.url, storyline ; limit 50;\nsort aggregated_rating desc;\nwhere cover.url != null & aggregated_rating != null & genres.name="Shooter" & screenshots!=null & storyline != null & age_ratings != null;'
        ),
        fetchData(
          'fields cover.url,cover.image_id, id,name,aggregated_rating,genres.name, screenshots.url, storyline ; limit 50;\nsort aggregated_rating desc;\nwhere cover.url != null & aggregated_rating != null & genres.name="Platform" & screenshots!=null & storyline != null & age_ratings != null;'
        ),
      ]);

    res.status(200).render("pages/discover", {
      games: discoverResponse,
      indieGames: indieGames,
      adventureGames: adventureGames,
      platformers: platformers,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Failure");
  }
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
              res.redirect("/discover");
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

app.get('/register', (req, res) =>{
  res.render('pages/register');
});
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


const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/register");
  }
  next();
};

// // Authentication Required
app.use(auth);

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
  res.render('pages/home');
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
  `fields age_ratings.content_descriptions.description,cover.image_id,id,name,aggregated_rating,genres.name, screenshots.*,storyline,summary ;\nsort aggregated_rating desc;\nwhere id=${gameID};`;

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
      // console.log(JSON.stringify(response.data));
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


app.get("/search", async (req, res) => {
  const limit = 500;
  const requestDataBase =
    'fields name, genres.name; limit ' + limit + '; where version_parent = null; where aggregated_rating_count > 300; sort aggregated_rating_count desc; where rating != null;';

  const apiRequests = Array.from({ length: 4 }, (_, index) => {
    const offset = index * limit; // Calculate offset based on index
    const requestData = `${requestDataBase} offset ${offset};`;

    return axios.post("https://api.igdb.com/v4/games", requestData, {
      method: "post",
      maxBodyLength: Infinity,
      headers: {
        "Client-ID": process.env.TWITCH_CID,
        Authorization: "Bearer " + process.env.ACCESS_TOKEN,
        "Content-Type": "text/plain",
        Cookie:
          "__cf_bm=8QJ8jiONy6Mtn0esNjAq1dWDKMpRoJSuFwD.GELBeBY-1699991247-0-AVsH85k1GHSbc/QyMLxL41NsnyPCcMewbUmoqYU27SEklnJ+yZp3DmsAJWgoIQf4n8xdepIl4htcY4I65HSmaZQ=",
      },
      data: requestData,
    });
  });

  try {
    const responses = await Promise.all(apiRequests);

    // Combine the data from all API responses
    const combinedData = responses.reduce((acc, response) => acc.concat(response.data), []);

    // Sort the combined data alphabetically by game name
    const sortedGames = combinedData.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    res.status(200).render("pages/search", { games: sortedGames });
  } catch (error) {
    console.log(error);
    res.status(500).send("Failure");
  }
});
app.get('/profile', auth, async (req, res) => {
  try {
    const username = req.session.user; // Assuming the user's username is stored in the session
    const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Render the profile page with user data
    const friends = await getFriends(user.userId);
    const friendRequests = await getFriendRequests(user.userId);

    res.render('pages/profile', { user, friends, friendRequests});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// FRIENDS TABLING. FUTURE ENHANCEMENT

//helper fcn for getting friendfs
async function getFriends(userId) {
  try {
    const query = `
      SELECT users.*
      FROM users
      JOIN friendships ON users.userId = friendships.user_id2
      WHERE friendships.user_id1 = $1 AND friendships.status = 'accepted';
    `;
    const friends = await db.any(query, [userId]);
    return friends;
  } catch (err) {
    console.error(err);
    return [];
  }
}
//helper fcn for grabbing friend reqs
async function getFriendRequests(userId) {
  try {
    const query = `
      SELECT users.*
      FROM users
      JOIN friendships ON users.userId = friendships.user_id1
      WHERE friendships.user_id2 = $1 AND friendships.status = 'pending';
    `;
    const friendRequests = await db.any(query, [userId]);
    return friendRequests;
  } catch (err) {
    console.error(err);
    return [];
  }
}

app.post('/send-friend-request', auth, async (req, res) => {
  try {
    // Get the current user and friend's username from the form
    const { user } = req.session;
    const { friendUsername } = req.body;

    // Get user IDs for the current user and the friend
    const currentUser = await db.one('SELECT userId FROM users WHERE username = $1', [user]);
    const friend = await db.one('SELECT userId FROM users WHERE username = $1', [friendUsername]);

    // Check if a friend request already exists
    const existingRequest = await db.oneOrNone(
      'SELECT * FROM friendships WHERE (user_id1 = $1 AND user_id2 = $2) OR (user_id1 = $2 AND user_id2 = $1)',
      [currentUser.userId, friend.userId]
    );

    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already sent or received.' });
    }

    // Create a new friend request
    await db.none('INSERT INTO friendships (user_id1, user_id2, status) VALUES ($1, $2, $3)', [
      currentUser.userId,
      friend.userId,
      'pending',
    ]);

    res.status(200).json({ message: 'Friend request sent successfully.' });
    res.render('pages/profile', { user, friends, friendRequests });
  } catch (error) {
    console.error('Error sending friend request:', error.message || error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Route for my reviews page
app.get("/myReviews", async (req, res) => {
  const username = req.session.user;
  let userID;
  try {
    const query1 = `SELECT * FROM users WHERE username = $1;`;
    const userData = await db.any(query1, [username]);

    // Check if user data is found
    if (userData && userData.length > 0) {
      // Match user id
      userID = userData[0].userid;

      const query2 = 'SELECT * FROM reviews WHERE reviews.userId = $1';
      const reviewData = await db.any(query2, [userID]);
      console.log(reviewData);

      const reviewsWithGameInfo = await Promise.all(
        reviewData.map(async (review) => {
          const gameInfo = await getGameInfo(review.gameid);
          return { ...review, gameCoverImageUrl: gameInfo.cover.url, gameName: gameInfo.name };
        })
      );

      res.status(200).render('pages/myReviews', { reviews: reviewsWithGameInfo });
    } else {
      console.log("User Not Found");
      res.status(404).send("User not found");
    }
  } catch (err) {
    console.log("Error fetching reviews:", err);
    res.status(500).send('Internal Server Error');
  }
});

//Helper function to get game cover and name from gameId
async function getGameInfo(gameId) {
  let data =
  `fields cover.url, id,name,aggregated_rating,genres.name, screenshots.url, storyline ;\nsort aggregated_rating desc;\nwhere id=${gameId};`;

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api.igdb.com/v4/games",
    headers: {
      "Client-ID": process.env.TWITCH_CID,
      Authorization: "Bearer " + process.env.ACCESS_TOKEN,
      "Content-Type": "text/plain",
      Cookie: "__cf_bm=8QJ8jiONy6Mtn0esNjAq1dWDKMpRoJSuFwD.GELBeBY-1699991247-0-AVsH85k1GHSbc/QyMLxL41NsnyPCcMewbUmoqYU27SEklnJ+yZp3DmsAJWgoIQf4n8xdepIl4htcY4I65HSmaZQ=",
    },
    data: data,
  };

  try {
    const response = await axios.request(config);
    return response.data[0];
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch game information from IGDB");
  }
}

//Route to add reviews
app.get('/addReview', (req, res) => {
  res.render('pages/addReview');
});

app.post("/addReview", async (req, res) => {
  // app.post("/review/add/:gameid", async (req, res) => {
    // const gameID = req.params.gameid;
    const username = req.session.user;
    let userID;
  
    try {
      // Get user data
      const query1 = `SELECT * FROM users WHERE username = $1;`;
      const userData = await db.any(query1, [username]);
  
      // Check if user data is found
      if (userData && userData.length > 0) {
        // Match user id
        userID = userData[0].userid;

        const query = `INSERT INTO reviews (gameId, userId, userName, rating, reviewText) VALUES ($1, $2, $3, $4, $5);`;
        await db.any(query, [req.body.gameID, userID, username, req.body.rating, req.body.reviewText]);
  
        console.log("Review Added");
        res.status(200).redirect(`/myReviews`);
      } else {
        console.log("User Not Found");
        res.status(404).send("User not foundjhg");
      }
    } catch (err) {
      console.log("Error adding review:", err);
      res.status(500).send('Internal Server Error');
    }
  });

// Route to show all reviews in database
app.get('/allReviews', async (req, res) => {
  try {
    const getAllReviews = 'SELECT * FROM reviews';
    const allReviews = await db.any(getAllReviews);
    res.render('pages/allReviews', { reviews: allReviews });
  } catch (error) {
    console.error('Error retrieving all reviews:', error);
    res.render('pages/error', { error: 'Error retrieving reviews.' });
  }
});

// Route to delete your reviews
app.get('/deleteReview', (req, res) => {
  res.render('my/Reviews');
});

// Route to delete a selected review
app.post('/deleteReview', async (req, res) => {
  const reviewId = req.body.reviewId;

  try {
    const deleteQuery = 'DELETE FROM reviews WHERE reviewid = $1';
    await db.none(deleteQuery, [reviewId]);

    console.log('Review deleted successfully');
    res.status(200).redirect('/myReviews');
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get("/reviews/:gameid", async (req, res) => {
  const gameID = req.params.gameid;
  const data = `fields name;\nsort aggregated_rating desc;\nwhere id=${gameID};`;
  let gameName;

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
  await axios.request(config).then((response) => {
    console.log(JSON.stringify(response.data));
    gameName = response.data[0].name;
  });

  const query = `SELECT * FROM reviews WHERE gameId = $1;`;
  db.any(query, [gameID])
      .then(function (data){
          console.log("Reviews Found", data);
          res.status(200).render("pages/reviews", {reviews: data, gameID: gameID, gameName: gameName});
      })
      .catch(function (err){
          console.log("Reviews Not Found");
      });
  // res.status(200).render("pages/reviews", {gameID: gameID, reviews: [{reviewText: "This game is great", rating: 5, userName: "John Doe"}, {reviewText: "This game is bad", rating: 2, userName: "Jane Doe"}]});
});

app.post("/addReviews/:gameid", async (req, res) => {
  const gameID = req.params.gameid;
  const username = req.session.user;
  let userID;
  const review = req.body.review;
  const rating = req.body.rating;
  const query1 = `SELECT * FROM users WHERE username = $1;`;
  await db.any(query1, [username])
      .then(function (data){
          console.log("User Found", data);
          userID = data[0].userid;
      })
      .catch(function (err){
          console.log("User Not Found");
      });
  const query = `INSERT INTO reviews (gameId, userId, userName, reviewText, rating) VALUES ($1, $2, $3, $4, $5);`;
  db.any(query, [gameID, userID, username, review, rating])
      .then(function (data){
          console.log("Review Added");
          res.status(200).redirect(`/reviews/${gameID}`);
      })
      .catch(function (err){
          console.log("Review Not Added");
      });
});






  module.exports  = app.listen(3000);
  console.log('Server is listening on port 3000');

  
