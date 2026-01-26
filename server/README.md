# chat Application Backend

## Tech stack

- node.js
- express.js
- postgres
- sequelize
- JWT Authentication

## Folder structure

- app.js -> Main express setup and server start
- routes -> all apis calls connect to app
- src/config -> DB setup & jwt token
- src/init_models -> associations
- src/middlewares -> auth & security
- src/modules -> features-based modules
- src/models -> db feilds

## Authentication

- JWT-based auth
- Access token(coookie/header)
- Refresh token(HttpOnly cookie)

## Middleware Flow

Request -> Auth -> Verify -> Controller -> Error Handler -> Response

## Auth_middleware Flow

- token generates and stored in cookies for web and authorization headers for httonly cookies
- verify jwt token and give user data if user is active and user present.
- jsonwebtoken for jwt token

## Verify Middleware

-It checks is user verified via email or mobile by otp

## Rate Limiter Middleware

- How many otps can get from an IP
- Uses express-rate-limit
- protects auth & otp endpoints

## JWT

- generateAccessToken which expires in 15min
- generate refresh token which prevents user from logging out

## Error handler middleware

- for global error handling for internal server errors


## REGISTER API
