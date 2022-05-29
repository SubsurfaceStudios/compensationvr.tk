const loadingScreen = document.getElementById('loading-screen');
const loginFlow = document.getElementById('loginflow');
const usernameField = document.getElementById('username');
const passwordField = document.getElementById('password');
const loginButton = document.getElementById('login-button');
const content = document.getElementById('dashboard');
const errorTextLogin = document.getElementById('error-text-login');

const banIdInput = document.getElementById('ban-id');
const banReasonInput = document.getElementById('ban-reason');
const banButton = document.getElementById('ban-button');
const banUntil = document.getElementById('ban-date');

function showLoadingScreen() {
    loadingScreen.classList.remove('hidden');
    loginFlow.classList.add('hidden');
    content.classList.add('hidden');
}

function showLoginFlow() {
    loginFlow.classList.remove('hidden');
    loadingScreen.classList.add('hidden');
    content.classList.add('hidden');
}

function showContent() {
    content.classList.remove('hidden');
    loadingScreen.classList.add('hidden');
    loginFlow.classList.add('hidden');
}




function login() {
    errorTextLogin.textContent = '';
    const username = usernameField.value;
    const password = passwordField.value;

    if(username.length < 1 || password.length < 1) {
        errorTextLogin.textContent = "You are missing either your username or password.";
        return;
    }

    showLoadingScreen();

    const body = {
        username: username,
        password: password
    };

    // will add 2fa support when i have time, dont rn

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    };
    window.fetch("https://api.compensationvr.tk/api/auth/login", options)
        .then(response => {
            switch(response.status) {
                case 404:
                    errorTextLogin.textContent = "No user found with that username.";
                    showLoginFlow();
                    return;
                case 403:
                    errorTextLogin.textContent = "Incorrect password, or you have 2FA enabled. 2FA is currently unsupported, this is a temporary website.";
                    showLoginFlow();
                    return;
                case 200:
                    break;
                default:
                    errorTextLogin.textContent = "An unknown error has occurred. Please try again later.";
                    showLoginFlow();
                    return;
            }

            response.json().then(data => {
                if(!data.developer) {
                    errorTextLogin.textContent = "You are not an authorized administrator. Please vacate this page.";
                    showLoginFlow();
                    return;
                }

                window.sessionStorage.setItem('token', data.accessToken);
                window.sessionStorage.setItem('tokenGrantedAt', new Date());
                showContent();
            });
        });
}

function banUser() {
    const iso = banUntil.value;
    const now = new Date();

    const date = new Date(iso);

    const ms = date.getTime() - now.getTime();

    const days = Math.ceil(ms / (1000 * 3600 * 24));

    const url = `https://api.compensationvr.tk/api/accounts/${banIdInput.value}/ban`;
    const data = {
        duration: days,
        reason: banReasonInput.value
    };

    showLoadingScreen();

    window.fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
    })
    .then(response => {

    });
}

loginButton.onclick = login;
banButton.onclick = banUser;

if(window.sessionStorage.getItem('token')) {
    showContent();
} else {
    showLoginFlow();
}