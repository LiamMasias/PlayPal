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

--friendships table!
CREATE TABLE friendships (
  id SERIAL PRIMARY KEY,
  user_id1 INT REFERENCES users(userId),
  user_id2 INT REFERENCES users(userId),
  status VARCHAR(20) DEFAULT 'pending' -- 'pending', 'accepted', 'rejected', etc.
);