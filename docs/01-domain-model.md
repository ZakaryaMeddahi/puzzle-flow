# Database Design

## Tables

### Users

| Column Name | Data Type | Description                                 |
| ----------- | --------- | ------------------------------------------- |
| id          | INT       | Unique identifier for each user             |
| username    | VARCHAR   | The user's chosen username                  |
| email       | VARCHAR   | The user's email address                    |
| password    | VARCHAR   | The user's hashed password                  |
| created_at  | TIMESTAMP | The date and time the user was created      |
| updated_at  | TIMESTAMP | The date and time the user was last updated |

### Books

| Column Name  | Data Type | Description                                 |
| ------------ | --------- | ------------------------------------------- |
| id           | INT       | Unique identifier for each book             |
| title        | VARCHAR   | The title of the book                       |
| author       | VARCHAR   | The author of the book                      |
| isbn         | VARCHAR   | The ISBN of the book                        |
| published_at | DATE      | The date the book was published             |
| created_at   | TIMESTAMP | The date and time the book was created      |
| updated_at   | TIMESTAMP | The date and time the book was last updated |

### Puzzles

| Column Name | Data Type | Description                                   |
| ----------- | --------- | --------------------------------------------- |
| id          | INT       | Unique identifier for each puzzle             |
| name        | VARCHAR   | The name of the puzzle                        |
| description | TEXT      | A detailed description of the puzzle          |
| created_at  | TIMESTAMP | The date and time the puzzle was created      |
| updated_at  | TIMESTAMP | The date and time the puzzle was last updated |

### Subscriptions

| Column Name | Data Type | Description                                |
| ----------- | --------- | ------------------------------------------ |
| id          | INT       | Unique identifier for each subscription    |
| user_id     | INT       | The ID of the user who subscribed          |
| plan        | VARCHAR   | The subscription plan                      |
| started_at  | TIMESTAMP | The date and time the subscription started |
| ended_at    | TIMESTAMP | The date and time the subscription ended   |

### Plans

| Column Name | Data Type | Description                                 |
| ----------- | --------- | ------------------------------------------- |
| id          | INT       | Unique identifier for each plan             |
| name        | VARCHAR   | The name of the plan                        |
| description | TEXT      | A detailed description of the plan          |
| price       | DECIMAL   | The price of the plan                       |
| created_at  | TIMESTAMP | The date and time the plan was created      |
| updated_at  | TIMESTAMP | The date and time the plan was last updated |
