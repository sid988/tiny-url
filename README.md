# tiny-url
A url shortening service

## Solution
The idea here would be to have 2 microservices each for user management and url minification. For ease of user management we have a Super Admin user, who was full access to all the operations. For authentication purpose we will be making use of JWT tokens and Basic Authentication over both the services. Following will be the endpoints exposed by both the services:

### user-service
- POST /users - For adding a new user
    - Example:
    ```
        Basic Auth: token:<Token generated via login endpoint>
        Body: {
            "name": "Jaya Chaudhary",
            "email": "jaya.chaudhary@gmail.com",
            "role": "admin"
        }
    ```
- POST /users/login - For logging into the system and generating a token, which will be valid for next 2 hours.
    - Example:
    ```
        Body: {
            "email": "sa@sa.sa",
            "token": "mhvXdrZT4jP5T8vBxuvm75"
        }
    ```
- POST /users/search - For searching a user using patterns in user's name
    - Example:
    ```
        Basic Auth: token:<Token generated via login endpoint>
        Body: {
            "name": "Ja"
        }
    ```
- GET /users/:id - Getting user details for the specified user id
    - Example:
    ```
        Basic Auth: token:<Token generated via login endpoint>
    ```
- PATCH /users/:id - For updating user data
    - Example:
    ```
        Basic Auth: token:<Token generated via login endpoint>
        Body: {
            "name": "Jaya Bajpai"
        }
    ```
- DELETE /users/:id - For deleting a user record
- PATCH /users/:id - For updating user data
    - Example:
    ```
        Basic Auth: token:<Token generated via login endpoint>
    ```

### url-service
- POST /url/minify - For minification of a url
    - Example:
    ```
        Basic Auth: token:<Token generated via login endpoint>
        Body: {
            "url": "https://www.google.com"
        }
    ```
- GET /r/:token - Performs the redirection from the minified url to the actual url
- GET /url/stats - Gets all the stats for all the urls minified so far. This endpoint is only accessible to the SuperAdmin.
    - Example:
    ```
        Basic Auth: token:<Token generated via login endpoint>
    ```
- POST /url/stats - Gets stats related to the user and logged in user. This endpoint is only accessible to the SuperAdmin.
    - Example:
    ```
        Basic Auth: token:<Token generated via login endpoint>
        Body: {
            "url": "https://www.google.com"
        }
    ```
- GET /url/stats/user/:userId - Gets stats related to the user. This endpoint is only accessible to the Admin & SuperAdmin.
    - Example:
    ```
        Basic Auth: token:<Token generated via login endpoint>
    ```
