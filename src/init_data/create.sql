CREATE TABLE users IF NOT EXISTS(
    userId SERIAL PRIMARY KEY,
    email VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    password VARCHAR NOT NULL
);

-- for ratings, will need, username, rating, foreign key to game ID

