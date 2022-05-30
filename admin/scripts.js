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

const dashboardErrorText = document.getElementById("error-text-dashboard");
const dashboardAnalyticsText = document.getElementById("analytics-text");

function showLoadingScreen() {
    loadingScreen.classList.remove('hidden');
    loginFlow.classList.add('hidden');
    content.classList.add('hidden');
}

function showLoginFlow() {
    window.sessionStorage.removeItem('token');
    window.sessionStorage.removeItem('tokenGrantedAt');
    loginFlow.classList.remove('hidden');
    loadingScreen.classList.add('hidden');
    content.classList.add('hidden');
}

function showContent() {
    if(!verifyCurrentToken()) return showLoginFlow();

    content.classList.remove('hidden');
    loadingScreen.classList.add('hidden');
    loginFlow.classList.add('hidden');
}

function verifyCurrentToken() {
    const tokenGrantedAt = window.sessionStorage.getItem('tokenGrantedAt');
    if(tokenGrantedAt == null) return false;
    const now = new Date();
    const ms = now.getTime() - new Date(tokenGrantedAt).getTime();
    const seconds = ms / 1000;

    if(seconds > 3600) {
        window.sessionStorage.removeItem('token');
        window.sessionStorage.removeItem('tokenGrantedAt');
        return false;
    }
    return true;
}

function pullAnalyticsData() {
    dashboardAnalyticsText.textContent = 'Loading analytics...';
    window.fetch("https://api.compensationvr.tk/api/analytics/account-count")
        .then(response => {
            response.text()
                .then(text => {
                    dashboardAnalyticsText.textContent = `Total accounts created : ${text}`;
                });
        });
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

                window.sessionStorage.removeItem('token');
                window.sessionStorage.removeItem('tokenGrantedAt');

                window.sessionStorage.setItem('token', data.accessToken);
                window.sessionStorage.setItem('tokenGrantedAt', new Date().toISOString());
                showContent();
                pullAnalyticsData();
            });
        });
}

function banUser() {
    const val = encodeURI(banIdInput.value); // XSS is cringe
    const url = `https://api.compensationvr.tk/api/accounts/${val}/ban`;
    const data = {
        duration: banUntil.value,
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
        showContent();
        switch(response.status) {
            case 404:
                dashboardErrorText.textContent = "No user found with that ID.";
                return;
            case 403:
                dashboardErrorText.textContent = "You do not have permission to ban this user.";
                return;
            case 401:
                dashboardErrorText.textContent = "You are not logged in.";
                setTimeout(() => showLoginFlow(), 2500);
                return;
            case 200:
                break;
        }
    });
}

loginButton.onclick = login;
passwordField.onsubmit = login;
banButton.onclick = banUser;

if(verifyCurrentToken()) {
    showContent();
    pullAnalyticsData();
} else {
    showLoginFlow();
}