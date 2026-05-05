const { initializeApp } = require("firebase/app");
const { getDatabase } = require("firebase/database");

const firebaseConfig = {
  apiKey: "AIzaSyDcp_aLV_am3QL6HCI0HaX2H9u-Lpcvm0k",
  authDomain: "chat-bot-bfc04.firebaseapp.com",
  databaseURL: "https://chat-bot-bfc04-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chat-bot-bfc04",
  storageBucket: "chat-bot-bfc04.firebasestorage.app",
  messagingSenderId: "179959243925",
  appId: "1:179959243925:web:fb25235933d40a7308679c"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

module.exports = { db };
