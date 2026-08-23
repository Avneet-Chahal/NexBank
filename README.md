# Banking Management System – Microservices

A full-stack **Banking Management System** designed using a **microservices architecture**. The project is being developed in multiple phases, with additional banking services and features planned for future evaluations.

## 📌 Project Overview

The Banking Management System is a web-based application that provides a foundation for managing banking operations through a modern and scalable architecture.

The project follows the **MERN stack** for web development and is structured around **microservices**, allowing different banking functionalities to be developed and maintained independently.

The initial phase focuses on establishing the project's frontend, authentication flow, user interface, and basic project architecture. More advanced banking services will be integrated in the upcoming phases.

---

## 🎯 Objectives

* Develop a modern banking management web application.
* Implement a clean and responsive user interface.
* Build a secure user authentication system.
* Follow a microservices-based architecture.
* Separate different banking functionalities into independent services.
* Provide a scalable foundation for future banking operations.
* Apply concepts learned throughout the course to a practical project.

---

## 🛠️ Technology Stack

### Frontend

* React.js
* HTML5
* CSS3
* JavaScript
* React Components
* React Router

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### Architecture

* Microservices Architecture
* REST APIs

### Development Tools

* Git
* GitHub
* Visual Studio Code
* Postman

---

## 📂 Current Project Structure

```text
Banking-Management-System/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── README.md
└── .gitignore
```

> The structure will be expanded as additional microservices are developed.

---

# 🚀 Features Implemented So Far

## 1. Landing Page

A dedicated landing page has been developed as the entry point of the application.

The landing page provides:

* Banking system introduction
* Navigation options
* Authentication access
* Modern banking-themed UI
* Responsive design
* Visual background elements

---

## 2. User Registration

A registration interface has been implemented for new users.

The registration page provides fields required to create a new account and follows a structured authentication workflow.

### Current concepts covered

* User input handling
* Form structure
* React components
* Form validation
* Authentication UI
* Responsive design

---

## 3. User Login

A login interface has been created for existing users.

The authentication flow is designed to allow users to enter their credentials and access the banking application.

---

## 4. Authentication Flow

The project currently includes the basic frontend authentication flow:

```text
Landing Page
      ↓
Registration
      ↓
User Account
      ↓
Login
      ↓
Banking Application
```

Authentication will be further enhanced with backend authentication, password security, tokens, and authorization in upcoming phases.

---

# 🏗️ Microservices Architecture

The final system is planned around multiple independent banking services.

A simplified architecture is:

```text
                    ┌──────────────────┐
                    │   React Client   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │    API Gateway   │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │    User     │    │   Account   │    │ Transaction │
   │  Service    │    │   Service   │    │   Service   │
   └─────────────┘    └─────────────┘    └─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
      MongoDB            MongoDB            MongoDB
```

Additional services will be added during CA2 and the final development phase.

---

# 🔐 Planned Authentication & Security

The authentication system will be expanded to include:

* Secure password hashing
* JWT-based authentication
* Authentication middleware
* Role-based authorization
* Protected routes
* Secure API communication
* Input validation
* Error handling

---

# 💳 Planned Banking Services

The following services are planned for future development:

### 👤 User Service

Responsible for:

* User registration
* User login
* User profile
* User authentication
* User roles

### 🏦 Account Service

Responsible for:

* Creating bank accounts
* Viewing account details
* Account balance
* Account status
* Account management

### 💰 Transaction Service

Responsible for:

* Deposits
* Withdrawals
* Money transfers
* Transaction history
* Transaction validation

### 💸 Loan Service

Responsible for:

* Loan applications
* Loan approval/rejection
* Loan details
* Loan repayment tracking

### 💳 Card Service

Responsible for:

* Debit card management
* Credit card management
* Card status
* Card transactions

### 🔔 Notification Service

Responsible for:

* Transaction notifications
* Account alerts
* Email notifications
* Important banking updates

---

# 📊 Future Dashboard

The banking dashboard will provide users with an overview of their account.

Planned information includes:

* Account balance
* Recent transactions
* Account information
* Cards
* Loans
* Transaction statistics
* Notifications

---

# 📈 Development Phases

## CA1 – Foundation Phase

### Completed / Started

* Project setup
* React frontend setup
* Backend setup
* Landing page
* Registration page
* Login page
* Authentication UI flow
* Initial project architecture
* Git/GitHub version control

---

## CA2 – Core Banking Phase

Planned implementation:

* Backend authentication
* MongoDB integration
* User service
* Account service
* Transaction service
* REST APIs
* JWT authentication
* Protected routes
* Banking dashboard

---

## Final Evaluation – Advanced Banking System

Planned implementation:

* Loan service
* Card service
* Notification service
* Advanced transaction management
* Role-based access
* Admin dashboard
* API Gateway
* Service-to-service communication
* Security improvements
* Error handling
* Logging
* Testing
* Deployment

---

# 🔄 Development Workflow

The project follows a feature-based development workflow.

```text
Requirement
     ↓
Frontend Development
     ↓
Backend API
     ↓
Database Integration
     ↓
Microservice
     ↓
Testing
     ↓
Integration
     ↓
Deployment
```

Git and GitHub are used for version control and branch-based development.

---

# 🌿 Git Branching

The project uses Git branches to manage different parts of development.

Example:

```text
main
 │
 ├── landing-page
 │
 ├── authentication
 │
 ├── account-service
 │
 └── transaction-service
```

The `main` branch contains the integrated project, while feature branches can be used for independent development.

---

# 🧪 Testing

Testing will be performed throughout development using:

* Browser testing for frontend
* Postman for API testing
* Form validation testing
* Authentication testing
* Database testing
* Integration testing

---

# 📌 Current Status

**Project Phase:** CA1 – Foundation Phase

**Current Status:** 🚧 In Development

The basic frontend and authentication-related interfaces have been established. The project is now ready for the next development phase, where backend authentication, database integration, and core banking microservices will be implemented.

---

# 🔮 Future Scope

The system can be further enhanced with:

* AI-based fraud detection
* Credit score analysis
* Personalized financial recommendations
* Automated customer support chatbot
* Real-time transaction monitoring
* Advanced analytics
* Fraud alerts
* Mobile application
* Cloud deployment
* Containerization using Docker
* CI/CD pipeline

---

# 👩‍💻 Project Development

This project is being developed as an academic project to demonstrate practical implementation of:

* MERN Stack
* Microservices Architecture
* REST APIs
* Authentication
* Database Management
* Git & GitHub
* Full-Stack Web Development



**Banking Management System – Building a scalable banking platform using MERN and Microservices Architecture.**
