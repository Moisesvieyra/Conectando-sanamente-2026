/* =========================================================
   FIREBASE ENGINE • CONECTANDO SANAMENTE 2026
   AGUAKAN ENTERPRISE PREMIUM SYSTEM V5
   AUTH + STORAGE + FIRESTORE + REALTIME DATABASE + RESET PASSWORD
========================================================= */

/* =========================================================
   IMPORT FIREBASE MODULES
========================================================= */

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

    getAuth,

    createUserWithEmailAndPassword,

    signInWithEmailAndPassword,

    onAuthStateChanged,

    signOut,

    sendPasswordResetEmail

}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {

    initializeFirestore

}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {

    getStorage

}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import {

    getDatabase

}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {

    apiKey: "AIzaSyBs9QFJ2QfJ2C6sWk4L07vl-1511ACeL68",

    authDomain: "conectando-sanamente.firebaseapp.com",

    projectId: "conectando-sanamente",

    storageBucket: "conectando-sanamente.firebasestorage.app",

    messagingSenderId: "470369065643",

    appId: "1:470369065643:web:c1f0f8d2841133c52075ee",

    measurementId: "G-07YK7V32DH"

};

/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
auth.languageCode = "es";

const db = initializeFirestore(app, {

    experimentalForceLongPolling: true,

    useFetchStreams: false

});

const storage = getStorage(app);

const realtimeDB = getDatabase(app);

/* =========================================================
   AGUAKAN ENGINE CONSOLE
========================================================= */

console.log(`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FIREBASE PREMIUM SYSTEM • CONECTANDO SANAMENTE 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[STATUS]            : CONNECTED
[AUTH SYSTEM]       : ONLINE
[FIRESTORE]         : CONNECTED
[STORAGE]           : ACTIVE
[REALTIME DATABASE] : ACTIVE
[RESET PASSWORD]    : ENABLED
[SECURITY]          : ENABLED
[PROJECT]           : conectando-sanamente
[VERSION]           : ENTERPRISE PREMIUM V5 AUTH RESET

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`);

/* =========================================================
   REGISTER USER
========================================================= */

window.registerUser = async(email,password)=>{

    email = String(email || "").trim();
    password = String(password || "").trim();

    if(email === "" || password === ""){

        showAlert(
            "Completa todos los campos",
            "#ff5c5c"
        );

        return;

    }

    try{

        const userCredential =
        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        console.log(
            "Usuario registrado:",
            userCredential.user
        );

        showAlert(
            "Registro exitoso 🚀",
            "#2ecc71"
        );

        setTimeout(()=>{

            window.location.href = "album.html";

        },1400);

    }

    catch(error){

        console.error(error);

        showAlert(
            translateFirebaseError(error.code),
            "#ff5c5c"
        );

    }

};

/* =========================================================
   LOGIN USER
========================================================= */

window.loginUser = async(email,password)=>{

    email = String(email || "").trim();
    password = String(password || "").trim();

    if(email === "" || password === ""){

        showAlert(
            "Ingresa correo y contraseña",
            "#ffb347"
        );

        return;

    }

    try{

        const userCredential =
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        console.log(
            "Sesión iniciada:",
            userCredential.user
        );

        showAlert(
            "Bienvenido a Aguakan 💧",
            "#2ecc71"
        );

       showAlert(
    `Te enviamos un correo a ${email}. Revisa tu bandeja de entrada o spam 📩`,
    "#2ecc71"
);

        setTimeout(()=>{

            window.location.href = "album.html";

        },1400);

    }

    catch(error){

        console.error(error);

        showAlert(
            translateFirebaseError(error.code),
            "#ff5c5c"
        );

    }

};

/* =========================================================
   RESET PASSWORD
========================================================= */

window.resetPassword = async()=>{

    const emailInput =
    document.getElementById("email") ||
    document.querySelector("input[type='email']");

    if(!emailInput){

        showAlert(
            "No se encontró el campo de correo",
            "#ff5c5c"
        );

        return;

    }

    const email = emailInput.value.trim();

    if(email === ""){

        showAlert(
            "Ingresa tu correo para recuperar tu contraseña",
            "#ffb347"
        );

        emailInput.focus();

        return;

    }

    try{

        await sendPasswordResetEmail(
            auth,
            email
        );

showAlert(
    `Te enviamos un correo a ${email}. Revisa tu bandeja de entrada o spam 📩`,
    "#2ecc71"
);

    catch(error){

        console.error(error);

        showAlert(
            translateFirebaseError(error.code),
            "#ff5c5c"
        );

    }

};

/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(auth,(user)=>{

    if(user){

        console.log(
            "Usuario activo:",
            user.email
        );

    }

    else{

        console.log(
            "No hay sesión iniciada"
        );

    }

});

/* =========================================================
   LOGOUT
========================================================= */

window.logoutUser = async()=>{

    try{

        await signOut(auth);

        showAlert(
            "Sesión cerrada",
            "#0b5aa7"
        );

        setTimeout(()=>{

            window.location.href = "login.html";

        },1000);

    }

    catch(error){

        console.error(error);

        showAlert(
            "Error cerrando sesión",
            "#ff5c5c"
        );

    }

};

/* =========================================================
   ALERT SYSTEM
========================================================= */

function showAlert(message,color){

    const oldAlert = document.querySelector(".aguakan-alert");

    if(oldAlert){

        oldAlert.remove();

    }

    const alert = document.createElement("div");

    alert.className = "aguakan-alert";

    alert.innerText = message;

    alert.style.position = "fixed";

    alert.style.top = "30px";

    alert.style.right = "30px";

    alert.style.maxWidth = "calc(100% - 40px)";

    alert.style.padding = "18px 30px";

    alert.style.background = color;

    alert.style.color = "white";

    alert.style.fontWeight = "800";

    alert.style.borderRadius = "18px";

    alert.style.boxShadow =
    "0 20px 45px rgba(0,0,0,.25)";

    alert.style.zIndex = "99999";

    alert.style.fontFamily = "Poppins, sans-serif";

    alert.style.opacity = "0";

    alert.style.transform =
    "translateY(-20px) scale(.95)";

    alert.style.transition = ".4s ease";

    alert.style.backdropFilter = "blur(10px)";

    alert.style.textAlign = "center";

    document.body.appendChild(alert);

    setTimeout(()=>{

        alert.style.opacity = "1";

        alert.style.transform =
        "translateY(0) scale(1)";

    },100);

    setTimeout(()=>{

        alert.style.opacity = "0";

        alert.style.transform =
        "translateY(-20px) scale(.95)";

        setTimeout(()=>{

            alert.remove();

        },400);

    },3600);

}

/* =========================================================
   FIREBASE ERROR TRANSLATOR
========================================================= */

function translateFirebaseError(code){

    switch(code){

        case "auth/email-already-in-use":
            return "Este correo ya está registrado";

        case "auth/invalid-email":
            return "Correo inválido";

        case "auth/missing-email":
            return "Ingresa tu correo";

        case "auth/weak-password":
            return "La contraseña debe tener mínimo 6 caracteres";

        case "auth/invalid-credential":
            return "Correo o contraseña incorrectos";

        case "auth/wrong-password":
            return "Contraseña incorrecta";

        case "auth/user-not-found":
            return "No existe una cuenta con ese correo";

        case "auth/too-many-requests":
            return "Demasiados intentos. Intenta más tarde";

        case "auth/network-request-failed":
            return "Error de conexión";

        case "auth/operation-not-allowed":
            return "Este método de acceso no está habilitado";

        default:
            return "Error inesperado";

    }

}

/* =========================================================
   EXPORTS
========================================================= */

export { auth, db, storage, realtimeDB };
