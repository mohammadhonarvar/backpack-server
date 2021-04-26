import { debug } from '../../common/log.js';
const log = debug('app/modules/user/sign-up');

import { hash } from 'bcrypt';
import { mysqlConnection } from '../mysql-connection.js';
import { validateEmail } from '../../common/validate-email.js';
import { validatePasswordFormat } from '../../common/validate-password-format.js';

export const signUp = async (optionList) => {
  log('`signUp` got this `optionList`: %o', optionList);

  if (!validateEmail(optionList.email)) {
    throw {
      ok: false,
      errorCode: 104,
      description: 'Invalid `email` format',
    };
  }

  if (!validatePasswordFormat(optionList.password)) {
    throw {
      ok: false,
      errorCode: 104,
      description:
        'Invalid `password` format, a password should contains at least 6 chars (uppercase, lowercase, number and special chars)',
    };
  }

  let dbConnection = null;
  try {
    dbConnection = await mysqlConnection();
  } catch (error) {
    log(error);

    throw {
      ok: false,
      errorCode: 105,
      description: 'DB connection error',
    };
  }

  const userSql = 'SELECT id FROM users WHERE email = ?';
  let [rows, fields] = await dbConnection.execute(userSql, [optionList.email]);
  log('result: %o', { rows, fields });

  if (rows[0] != null) {
    throw {
      ok: false,
      errorCode: 106,
      description: 'Duplicate user email',
    };
  }

  const hashedPassword = await hash(optionList.password, 9);
  const insertUserSql = `INSERT INTO users (email, password) VALUES ('${optionList.email}', '${hashedPassword}')`;
  [rows, fields] = await dbConnection.execute(insertUserSql);
  log('Insert result: %o', { rows, fields });

  if (!rows['insertId']) {
    throw {
      ok: false,
      errorCode: 107,
      description: 'Registering failed',
    };
  }

  return {
    ok: true,
    description: 'The user registered',
  };
};
