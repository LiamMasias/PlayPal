DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users(
    userId SERIAL PRIMARY KEY,
    email VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    password VARCHAR NOT NULL
);

-- for ratings, will need, username, rating, foreign key to game ID

DROP TABLE IF EXISTS reviews CASCADE;
CREATE TABLE reviews(
    reviewId SERIAL PRIMARY KEY,
    gameId INT,
    userId INT,
    userName VARCHAR(50),
    rating INT,
    reviewText TEXT,
    timeCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
);
--friendships table!
DROP TABLE IF EXISTS friendships CASCADE;
CREATE TABLE friendships (
  id SERIAL PRIMARY KEY,
  user_id1 INT REFERENCES users(userId),
  user_id2 INT REFERENCES users(userId),
  status VARCHAR(20) DEFAULT 'pending' -- 'pending', 'accepted', 'rejected', etc.
);

-- saved games table
DROP TABLE IF EXISTS savedGames CASCADE;
CREATE TABLE savedGames(
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES users(userId) ON DELETE CASCADE,
  -- gameId INTEGET NOT NULL REFERENCES
  -- shelf is for "which" shelf will be put on, whether that is played, playing, or want to play
  shelf VARCHAR NOT NULL
)