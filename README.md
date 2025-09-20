# Weather Monitoring Backend

This is the backend service for the Weather Monitoring Application. It is built using the Nest.js framework and MongoDB Atlas for storing weather history.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation and Running the Application](#installation)
- [Project Description](#project-description)
- [API Endpoints](#API-Endpoints)
- [Technologies Used](#Technologies-Used)

---

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js**: You need to have Node.js installed on your machine. You can download it from [Node.js official website](https://nodejs.org/).
- **npm**: npm (Node Package Manager) is usually included with Node.js. You can verify the installation by running:
  ```bash
  npm -v
  ```

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/Akanth24/weather-monitoring-backend.git
```
```bash
cd weather-monitoring-backend
```
### 2. Install dependencies

```bash
npm install
```

### 3. Configure Keys

Configure the OpenWeatherMap API key, MongoDB Atlas connection, and email service credentials in the ``` .env ``` file

### 4. Run the application
To run the backend server in development mode:

```bash
npm start
```

The backend should now be running on `http://localhost:3000`.

## Project Description

#### Real-Time Data Processing System for Weather Monitoring
The backend is responsible for real-time weather data retrieval, processing, and storing summaries in MongoDB Atlas. It allows users to set and manage custom alert thresholds for weather conditions, and sends email notifications when these thresholds are breached. Weather data is fetched from the OpenWeatherMap API at 5-minute intervals.

#### Features:

**Real-time Weather Data Retrieval:** Continuously fetches weather data for specified metro cities in India (Delhi, Mumbai, Chennai, Bangalore, Kolkata, Hyderabad) from the OpenWeatherMap API every 5 minutes.

**Data Processing and Conversion:** Converts temperature data from Kelvin to Celsius and stores weather data in MongoDB Atlas

**Rollups and Aggregates:**
- Provides daily weather summaries that include:
  - Average temperature
  - Maximum temperature
  - Minimum temperature
  - Dominant weather condition (e.g., rain, clear skies, etc.)
  - Average Humidity
  - Average Wind Speed.
- Summaries are stored in MongoDB Atlas for future analysis.

**User-Configurable Alerts:**
- Users can create, edit, or delete alert thresholds based on weather conditions, such as temperature exceeding 35°C for two consecutive updates.
- Email notifications are sent when thresholds are breached, using Nodemailer.

## API-Endpoints

### 1. Get Current Weather Data for a City

Retrieves the latest weather data for a specific city from the OpenWeatherMap API.

- URL: /weather/city/:city

- Method: GET

- Parameters:
  - ```city``` (string, required): The name of the city.

### 2. Get Daily Weather Summary

Retrieves the daily weather summary for a specific city, including average, maximum, minimum temperatures, dominant weather condition, average humidity, and average wind speed.

- URL: /weather/daily-summary

- Method: GET

- Query Parameters:
  - ```city``` (string, required): The name of the city.


### 3. Get Weather History for a Specific City by Date

Retrieves historical weather data for a specific city and date.

- URL: /weather/history-date

- Method: GET

- Query Parameters:
  - ```city``` (string, required): The name of the city.
  - ```date``` (string, required): The date for which the weather history is needed (format: ```YYYY-MM-DD```).

### 4. Get Latest Weather History

Retrieves the latest weather history for a specific city for the specified number of days.

- URL: /weather/latest-history

- Method: GET

- Query Parameters:
  - ```days``` (number, required): The number of days of weather history to retrieve.
  - ```city``` (string, required): The name of the city for which the weather history is needed.


### 5. Create a New Weather Alert Threshold

Creates a new weather alert threshold for a specific city, based on temperature or weather conditions, and sends email alerts if the threshold is breached.

- URL: /weather/threshold

- Method: POST

- Request Body:

  ```json

  {
    "city": "Bangalore",
    "temperatureThreshold": 35,
    "email": "user@example.com",
    "weatherCondition": "Rain"
  }


  ```


### 6. Get All Weather Alert Thresholds

Retrieves all existing weather alert thresholds.

- URL: /weather/thresholds

- Method: GET

### 7. Update a Weather Alert Threshold

Updates an existing weather alert threshold by its ID.

- URL: /weather/threshold/:id

- Method: PATCH 

- Parameters:
  - ```id``` (string, required): The ID of the threshold to be updated.

- Request Body:

  ```json

  {
    "city": "Kolkata",
    "temperatureThreshold": 30,
    "email": "newuser@example.com",
    "weatherCondition": "Clear"
  }

  ```


### 8. Delete a Weather Alert Threshold

Deletes a weather alert threshold by its ID.

- URL: /weather/threshold/:id

- Method: DELETE 

- Parameters:
  - ```id``` (string, required): The ID of the threshold to be deleted.



## Technologies-Used
* **Nest.js** - A progressive Node.js framework for building efficient and scalable server-side applications.
* **MongoDB Atlas** - Cloud-based NoSQL database to store rule definitions and metadata.
* **Mongoose** - ORM for MongoDB, used for schema definitions and data validation.
