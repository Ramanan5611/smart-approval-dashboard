# 📋 Smart Approval Status Dashboard

A real-time, multi-tier document approval and workflow management application built with the **MERN** stack (MongoDB, Express.js, React, Node.js). 

This platform streamlines multi-level request submissions and review workflows across organizational roles (Students, Faculty, HODs, Deans, and Admins) with role-based access control, automated state synchronization, and secure authentication.

---

## 🌟 Key Features

* **Multi-Role Approval Workflows:** Hierarchical document review process (Student ➔ Faculty ➔ HOD ➔ Dean ➔ Admin).
* **Role-Based Access Control (RBAC):** Strict permission checks powered by JWT authentication ensuring users can only view and act on relevant requests.
* **Real-time Status Tracking:** Dynamic UI updates reflecting real-time state changes (`Pending`, `Approved`, `Rejected`).
* **Database Seeding & Pre-configuration:** Built-in scripts to populate test users and multi-tier sample requests instantly.
* **Security First:** Includes production security headers with Helmet, CORS handling, password hashing via bcrypt, and API rate limiting.
* **AI Integration:** Integrated with Google Gemini API for intelligent workflow summary and insights.

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework:** React.js (Powered by Vite)
* **Icons & Styling:** Modern CSS / Responsive Layouts

### **Backend**
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (via Mongoose ORM)
* **Authentication:** JSON Web Tokens (JWT) & `bcryptjs`
* **Security:** `helmet`, `cors`, `express-rate-limit`
* **AI Extensions:** `@google/genai` (Google Gemini API)

---

## 🏗️ System Architecture & Workflow
