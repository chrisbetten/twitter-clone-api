const res = require("express/lib/response");
const { database } = require("pg/lib/defaults");
// const { secret } = require('./config.js');
const secret = process.env.SECRET;
const jwt = require('jsonwebtoken');

const Pool = require("pg").Pool;
const pool = new Pool({
  user: "me",
  host: "localhost",
  database: "twitter",
  password: "password",
  port: process.env.PORT || 5432,
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.IS_LOCAL ? undefined : { rejectUnauthorized: false },
});

const getAllTweets = (request, response) => {
  pool.query(
    "SELECT tweets.ID, tweets.message, tweets.created_at, users.username, users.name FROM tweets INNER JOIN users ON tweets.user_id = users.id ORDER BY created_at DESC;",
    (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).json(results.rows);
    }
  );
};

const getAllTweetsFromUser = (request, response) => {
  const username = request.params.username;

  pool.query(
    `
    SELECT tweets.ID, tweets.message, tweets.created_at, users.username, users.name
    FROM tweets
    INNER JOIN users ON tweets.user_id = users.id
    WHERE users.username = $1
    ORDER BY created_at DESC;
    `,
    [username],
    (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).json(results.rows);
    }
  );
};

function getUserByUsername(username) {
  return pool.query(`
    SELECT * FROM users
    WHERE username = $1
  `, [username])
  .then((results) => results.rows[0]);
}

const getUserInfoByUsername = async (request, response)  => {
  const username = request.params.username;

  let userInfo = await pool.query(`
  SELECT * FROM users
  WHERE username = $1
  `, [username])
  .then((results) => results.rows[0]);

  response.status(200).send(userInfo);
}



const postTweet = (request, response) => {
  const message = request.body.message;
  const token = request.headers['x-auth-token'];
  console.log('TOKEN', token);

  if (!token) {
    response.status(401).send({ error: 'Token missing' });
  }

  try {
    const payload = jwt.verify(token, Buffer.from(secret, 'base64'));

    pool.query(
      `
      INSERT INTO tweets (user_id, message)
        VALUES ($1, $2)
        RETURNING *
      `,
      [payload.id, message],
      (error, results) => {
        if (error) {
          throw error;
        }
        response.status(201).send(`Tweet added with ID: ${results.rows[0].id}`);
      }
    );
  } catch (error) {
    console.log(error);
    response.status(401).send({ error: error.message });
  }
};

module.exports = {
  getAllTweets,
  getAllTweetsFromUser,
  postTweet,
  getUserByUsername,
  getUserInfoByUsername,
};

// const getUsers = (request, response) => {
//   pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
//     if (error) {
//       throw error
//     }
//     response.status(200).json(results.rows)
//   })
// }

// const getUserById = (request, response) => {
//   const id = parseInt(request.params.id)

//   pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
//     if (error) {
//       throw error
//     }
//     response.status(200).json(results.rows)
//   })
// }

// const createUser = (request, response) => {
//   const { name, email } = request.body

//   pool.query('INSERT INTO users (name, email) VALUES ($1, $2)', [name, email], (error, results) => {
//     if (error) {
//       throw error
//     }
//     response.status(201).send(`User added with ID: ${results.id}`)
//   })
// }

// const updateUser = (request, response) => {
//   const id = parseInt(request.params.id)
//   const { name, email } = request.body

//   pool.query(
//     'UPDATE users SET name = $1, email = $2 WHERE id = $3',
//     [name, email, id],
//     (error, results) => {
//       if (error) {
//         throw error
//       }
//       response.status(200).send(`User modified with ID: ${id}`)
//     }
//   )
// }

// const deleteUser = (request, response) => {
//   const id = parseInt(request.params.id)

//   pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
//     if (error) {
//       throw error
//     }
//     response.status(200).send(`User deleted with ID: ${id}`)
//   })
// }

// module.exports = {
//   getUsers,
//   getUserById,
//   createUser,
//   updateUser,
//   deleteUser,
// }
