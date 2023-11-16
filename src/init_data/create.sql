DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users(
    userId SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    password VARCHAR(30) NOT NULL
);