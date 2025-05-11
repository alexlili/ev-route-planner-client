# ⚡ Electric Vehicle Route Planner

A cloud-based route planner for electric vehicles (EVs) that calculates the shortest and most efficient route while dynamically recommending charging stations based on battery levels. Built using React, AWS Amplify, OpenChargeMap, OpenStreetMap, and Google Maps APIs.

---

## 🌐 Live Demos

- **Client App**: [ev-route-planner-client](https://dev.d1pghmqcjpsb6.amplifyapp.com/)
- **Admin App**: [ev-route-planner-admin](https://dev.d2uxghi9675sr8.amplifyapp.com/)

---

## 📁 Repositories

- [Frontend - Client](https://github.com/alexlili/ev-route-planner-client)
- [Frontend - Admin](https://github.com/alexlili/ev-route-planner-admin)
- [Backend - API](https://github.com/alexlili/ev-route-planner-api)

---

## 🎯 Project Objectives

- Help EV users plan routes with charging stations included
- Support real-time decisions based on battery level and range
- Analyze user behavior for improved routing suggestions
- Provide admin tools to monitor usage and generate reports

---

## ⚙️ Features

### 🚗 EV Route Planning
- Input departure, destination, EV range, and current battery %
- Calculates feasible route using OpenStreetMap
- Recommends charging stations from OpenChargeMap
- Dynamically integrates multiple stations if needed

### 📍 Charging Station Search
- Search nearby charging stations by address/city
- View station info: operational status, price, reviews
- Bookmark favorite stations

### 🧑‍💼 Admin Panel
- View user data and usage analytics
- Generate reports on route trends and behavior
- Manage system logs and errors

### 🔐 Authentication
- Secure sign-up and login with AWS Cognito
- Separate access for Admin and User accounts

---

## 🏗️ System Architecture

| Layer              | Technology                             |
|-------------------|----------------------------------------|
| Frontend (UI)     | React, Redux, React Router             |
| Backend Services  | AWS Amplify, AWS AppSync, GraphQL      |
| Authentication    | AWS Cognito                            |
| Hosting           | AWS Amplify Hosting                    |
| Maps & Routing    | OpenStreetMap API, Google Maps API     |
| Charging Stations | OpenChargeMap API                      |

---

## 🗄️ Database Structure (DynamoDB via AppSync)

- **Vehicles**: brand, model, battery range, port type
- **Customers**: email, password, associated vehicles
- **Admin**: email, password
- **User Interactions**: searched addresses, clicked/collected stations

---

## 📊 Algorithm Highlights

### Hybrid Route Algorithm (Greedy + Dynamic Programming)
- Checks EV range between waypoints
- If range is insufficient, inserts charging station stops
- Adjusts route based on real-time data
- Compares to Dijkstra’s algorithm for efficiency vs realism

---

## 🔒 System Considerations

- **Reliability**: Handles outages and API failures gracefully
- **Security**: Role-based access, secure Cognito auth
- **Sustainability**: Promotes EV use through route optimization
- **Scalability**: Deployed and scaled on AWS

---

## 📄 Functional Requirements

- Automatic geolocation on load
- Authenticated user dashboard
- Vehicle management
- Route calculation and visualization
- Charging station integration
- Admin access for analytics and oversight

---

## 👨‍💻 Team

| Name             | Role                                      |
|------------------|-------------------------------------------|
| Guangyao Li       | Team Lead, Architecture & Admin Panel Dev |
| Jiajun Liu        | Frontend & API Dev (Client)               |
| Changsheng Tian  | Algorithm Developer                       |

---

## 📘 References

See full documentation and citations in the [MSE806-Electric Vehicle Route Planner.pdf](./MSE806-Electric%20Vehicle%20Route%20Planner.pdf)

[View Project Demo Video](https://youtu.be/D2-zMzfj99w)

See the project presentation file [MSE806_Electric vehicle route planner.pptx](./MSE806_Electric%20vehicle%20route%20planner.pptx)

---

## 🧪 Future Improvements

- Real-time traffic integration
- Live charging station availability
- Optimized charging time options
- Feedback system

---

## 📄 License

This project was developed for academic purposes at Yoobee College. For reuse or contributions, please contact the authors.

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
