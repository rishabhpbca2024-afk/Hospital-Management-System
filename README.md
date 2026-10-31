# 🏥 Lifeline Hospital Management System (HMS)

A modern, responsive, full-stack Hospital Management System built with **React**, **Node.js/Express**, and **MySQL**.

> **Note:** Upgraded from the legacy Java console-based application into a complete, modern web-based enterprise solution.

---

## 🌟 Key Features

* **Multi-Role Portal Access:**
  * 👨‍💼 **Admin Portal:** Manage staff, doctors, patient records, departments, and hospital statistics.
  * 🩺 **Doctor Portal:** View patient appointments, diagnose conditions, write prescriptions, and review medical history.
  * 🏥 **Patient Portal:** Book appointments, access digital prescriptions, view test records, and track health history.
  * 💊 **Pharmacy Module:** Manage medicine inventory, stock quantities, and dispense prescribed medications.
* **Security & Authentication:**
  * Secure JWT (JSON Web Token) authentication.
  * Passwords encrypted with `bcryptjs`.
  * Role-based access control (RBAC).
* **Modern UI/UX:**
  * Clean, responsive interface built with React 19 and Vite.
  * Lucide React icons with modern health-tech design tokens.

---

## 🛠️ Tech Stack

* **Frontend:** React 19, Vite, Lucide Icons, Modern CSS3
* **Backend:** Node.js, Express.js REST API
* **Database:** MySQL 8.0
* **Authentication & Security:** JSON Web Tokens (JWT), bcryptjs, CORS

---

## 📁 Project Structure

```
Hospital Management System/
├── backend/                  # Express REST API
│   ├── config/               # Database pool configuration
│   ├── middleware/           # JWT auth middleware
│   ├── routes/               # API routes (admin, doctor, patient, pharmacy, auth)
│   ├── server.js             # Main server entrypoint
│   └── .env.example          # Sample environment variables
├── frontend/                 # React + Vite application
│   ├── src/                  # Components, styles, and assets
│   └── index.html            # Main HTML document
├── database_dump.sql         # MySQL schema and initial seed data
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js** (v18+ recommended)
* **MySQL Server** (v8.0+)
* **Git**

### 2. Database Setup
1. Open your MySQL client (MySQL Workbench, phpMyAdmin, or CLI).
2. Create and import the database schema:
   ```sql
   CREATE DATABASE hospital_management_system;
   USE hospital_management_system;
   SOURCE database_dump.sql;
   ```

### 3. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your MySQL credentials:
   ```env
   PORT=5001
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=hospital_management_system
   JWT_SECRET=your_secret_key_here
   ```
5. Start the backend server:
   ```bash
   npm run dev
   # or
   npm start
   ```
   *The backend will run on `http://localhost:5001`.*

### 4. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173` (or the port specified in terminal).*

---

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).
