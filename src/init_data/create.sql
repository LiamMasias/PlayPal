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