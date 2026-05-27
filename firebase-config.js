/* =========================================================
   FIREBASE ENGINE • CONECTANDO SANAMENTE 2026
   AGUAKAN ENTERPRISE AUTH SYSTEM
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

    signOut

}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

/* =========================================================
   AGUAKAN ENGINE CONSOLE
========================================================= */

console.log(`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FIREBASE AUTH SYSTEM • AGUAKAN ENTERPRISE V1.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[STATUS]        : CONNECTED
[AUTH SYSTEM]   : ONLINE
[DATABASE]      : ACTIVE
[SECURITY]      : ENABLED
[PROJECT]       : conectando-sanamente
[VERSION]       : PREMIUM ENTERPRISE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`);

/* =========================================================
   REGISTER USER
========================================================= */

window.registerUser = async(email,password)=>{

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

    }

    catch(error){

        console.error(error);

        showAlert(
            translateFirebaseError(error.code),
            "#ff5c5c"
        );

    }

}

/* =========================================================
   LOGIN USER
========================================================= */

window.loginUser = async(email,password)=>{

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

        setTimeout(()=>{

            window.location.href = "album.html";

        },1500);

    }

    catch(error){

        console.error(error);

        showAlert(
            translateFirebaseError(error.code),
            "#ff5c5c"
        );

    }

}

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

    await signOut(auth);

    showAlert(
        "Sesión cerrada",
        "#0b5aa7"
    );

}

/* =========================================================
   ALERT SYSTEM
========================================================= */

function showAlert(message,color){

    const alert = document.createElement("div");

    alert.innerText = message;

    alert.style.position = "fixed";

    alert.style.top = "30px";

    alert.style.right = "30px";

    alert.style.padding = "18px 30px";

    alert.style.background = color;

    alert.style.color = "white";

    alert.style.fontWeight = "700";

    alert.style.borderRadius = "16px";

    alert.style.boxShadow =
    "0 15px 35px rgba(0,0,0,.2)";

    alert.style.zIndex = "99999";

    alert.style.fontFamily = "Poppins";

    alert.style.opacity = "0";

    alert.style.transform = "translateY(-20px)";

    alert.style.transition = ".4s ease";

    document.body.appendChild(alert);

    setTimeout(()=>{

        alert.style.opacity = "1";

        alert.style.transform =
        "translateY(0)";

    },100);

    setTimeout(()=>{

        alert.style.opacity = "0";

        alert.style.transform =
        "translateY(-20px)";

        setTimeout(()=>{

            alert.remove();

        },400);

    },3000);

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

        case "auth/weak-password":
            return "La contraseña debe tener mínimo 6 caracteres";

        case "auth/invalid-credential":
            return "Correo o contraseña incorrectos";

        case "auth/user-not-found":
            return "Usuario no encontrado";

        default:
            return "Error inesperado";
    }

}