# 🌍 GopzCollab – Real-Time Global Collaboration Platform

GopzCollab is a modern real-time collaboration platform built for teams and individuals to communicate, share content, and work seamlessly — globally and instantly.

> ✨ Created by [Gopi C K](https://github.com/gopi-c-k)

---

## 🔐 Authentication Powered by Firebase

- 🔗 Google Sign-In
- 📧 Email/Password Login
- 🔁 Persistent Sessions
- 🔒 Secure Token-Based Backend Access

---

## 🧠 Tech Stack

| Layer       | Technology                                 |
|------------|---------------------------------------------|
| Frontend    | React, Firebase Auth SDK                   |
| Backend     | Node.js, Express, Firebase Admin SDK       |
| Auth        | Firebase Authentication                    |
| Deployment  | Vercel (Frontend), Render (Backend)        |
| Repo Type   | Monorepo (`/client` + `/server` folders)   |

---

## 📁 Folder Structure

```

/GopzCollab
├── client         # React app with Firebase Auth
│   ├── src
│   │   └── firebase.js
│   │   └── Login.js
│   └── ...
├── server         # Node.js backend
│   ├── firebaseAdmin.js
│   ├── middleware/auth.js
│   └── server.js
├── README.md

````

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/gopi-c-k/gopzCollab.git
cd GopzCollab
````

---

### 2. Set Up Firebase Project

* Go to [Firebase Console](https://console.firebase.google.com)
* Create a new project named `GopzCollab`
* Add a web app and get the config keys
* Enable **Google** and **Email/Password** sign-in providers
* Go to **Service Accounts** → Generate a private key JSON

---

### 3. Frontend Setup (React + Firebase)

```bash
cd client
npm install
```

#### 🔧 Add Firebase Config in `src/firebase.js`

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  // rest of your config
};
```

---

### 4. Backend Setup (Express + Firebase Admin)

```bash
cd ../server
npm install
```

#### 🔐 Add Your Firebase Admin SDK JSON

* Save it as `server/firebaseServiceKey.json`
* Update `firebaseAdmin.js` to use it

---

### 5. Run the App Locally

#### Frontend

```bash
cd client
npm start
```

#### Backend

```bash
cd server
node server.js
```

---

## 🔒 Securing API Calls

On successful login, Firebase returns an ID Token. The frontend must send this in every protected request:

```js
const token = await auth.currentUser.getIdToken();
fetch("/protected", {
  headers: { Authorization: `Bearer ${token}` },
});
```

Backend verifies token:

```js
const decoded = await admin.auth().verifyIdToken(token);
req.user = decoded;
```

---

## ☁️ Deployment

### Frontend (Vercel)

* Connect to GitHub repo → Set build root to `/client`
* Framework preset: React
* Auto-deploy on push

### Backend (Render)

* Connect to same GitHub repo
* Root directory: `/server`
* Start command: `node server.js`
* Add environment variables if needed

---

## ✅ Features To Build Next

* 🔵 Realtime messaging (Socket.io or Firebase Realtime DB)
* 🗂️ File sharing & collaborative notes
* 👥 Group and team features
* 🌐 Language & timezone-aware settings

---

## 🙋‍♂️ Creator
Built with passion by[*Gopika A*](https://github.com/Gopikakavi)
Built with passion by [*Gopika A*](https://github.com/Gopikakavi) and [**Gopi C K**](https://github.com/gopi-c-k)
---

## 🏁 License

MIT License – Open for contributions and collaboration!

