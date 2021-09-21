# tiny-url
A url shortening service

## How to run
Run `docker compose up` command to run the services and setup the databases.

## Solution
The idea here would be to have 2 microservices each for user management and url minification. For ease of user management we have a Super Admin user, who was full access to all the operations. For authentication purpose we will be making use of JWT tokens and Basic Authentication over both the services. Following are the endpoints exposed by both the services.

### user-service
The service accessible on port 3000 i.e. http://localhost:3000

- **POST** */users* - For adding a new user
    ```
        Basic Auth: token:<Token generated via login endpoint>
        Body: {
            "name": "Jaya Chaudhary",
            "email": "jaya.chaudhary@gmail.com",
            "role": "admin"
        }
    ```
- **POST** */users/login* - For logging into the system and generating a token, which will be valid for next 2 hours.
    ```
        Body: {
            "email": "sa@sa.sa",
            "token": "mhvXdrZT4jP5T8vBxuvm75"
        }
    ```
- **POST** */users/search* - For searching a user using patterns in user's name
    ```
        Basic Auth: token:<Token generated via login endpoint>
        Body: {
            "name": "Ja"
        }
    ```
- **GET** */users/:id* - Getting user details for the specified user id
    ```
        Basic Auth: token:<Token generated via login endpoint>
    ```
- **PATCH** */users/:id* - For updating user data
    ```
        Basic Auth: token:<Token generated via login endpoint>
        Body: {
            "name": "Jaya Bajpai"
        }
    ```
- **DELETE** */users/:id* - For deleting a user record
- **PATCH** */users/:id* - For updating user data
    ```
        Basic Auth: token:<Token generated via login endpoint>
    ```

### url-service
The service accessible on port 5000 i.e. http://localhost:5000

- **POST** */url/minify* - For minification of a url
    ```
        Basic Auth: token:<Token generated via login endpoint>
        Body: {
            "url": "https://www.google.com"
        }
    ```
- **GET** */r/:token* - Performs the redirection from the minified url to the actual url
- **GET** */url/stats* - Gets all the stats for all the urls minified so far. This endpoint is only accessible to the SuperAdmin.
    ```
        Basic Auth: token:<Token generated via login endpoint>
    ```
- **POST** */url/stats* - Gets stats related to the user and logged in user. This endpoint is only accessible to the SuperAdmin.
    ```
        Basic Auth: token:<Token generated via login endpoint>
        Body: {
            "url": "https://www.google.com"
        }
    ```
- **GET** */url/stats/user/:userId* - Gets stats related to the user. This endpoint is only accessible to the Admin & SuperAdmin.
    ```
        Basic Auth: token:<Token generated via login endpoint>
    ```
