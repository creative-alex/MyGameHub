  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyA6L1WGReRL3-8Vl2nbqqn83-e3BlaBxYQ",
    authDomain: "mygamehub-3504e.firebaseapp.com",
    projectId: "mygamehub-3504e",
    storageBucket: "mygamehub-3504e.firebasestorage.app",
    messagingSenderId: "25061962136",
    appId: "1:25061962136:web:64154ccd3723997ef7bbed",
    measurementId: "G-XQ7VZKPFH3"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);