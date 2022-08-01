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

const viewUserButton = document.getElementById('view-user-button');
const viewUserId = document.getElementById('view-user-id');
const viewUser = document.getElementById('view-user');
const userErrorText = document.getElementById('user-error-text');

const grantUserTagButton = document.getElementById('grant-user-tag-button');
const revokeUserTagButton = document.getElementById('revoke-user-tag-button');

const setUserItemCountButton = document.getElementById('set-user-item-count-button');

const viewUserBackButton = document.getElementById('view-user-back-button');

const itemCountError = document.getElementById('item-count-error-text');

let api_ns = "api.compensationvr.tk";

let viewingId;

function showLoadingScreen() {
    loadingScreen.classList.remove('hidden');
    loginFlow.classList.add('hidden');
    content.classList.add('hidden');
    viewUser.classList.add('hidden');
}

function showLoginFlow() {
    window.sessionStorage.removeItem('token');
    window.sessionStorage.removeItem('tokenGrantedAt');
    loginFlow.classList.remove('hidden');
    loadingScreen.classList.add('hidden');
    content.classList.add('hidden');
    viewUser.classList.add('hidden');
}

function showContent() {
    if(!verifyCurrentToken()) return showLoginFlow();

    content.classList.remove('hidden');
    loadingScreen.classList.add('hidden');
    loginFlow.classList.add('hidden');
    viewUser.classList.add('hidden');
}

function showUser() {
    if(!verifyCurrentToken()) return showLoginFlow();

    content.classList.add('hidden');
    loadingScreen.classList.add('hidden');
    loginFlow.classList.add('hidden');
    viewUser.classList.remove('hidden');
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
    window.fetch(`https://${api_ns}/api/analytics/account-count`)
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
    window.fetch(`https://${api_ns}/api/auth/login`, options)
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
                window.onfocus += onfocus;
            });
        });
}

function onfocus() {
    if(!verifyCurrentToken()) {
        window.onfocus -= onfocus;
        showLoginFlow();
    }
}

function banUser() {
    const val = encodeURI(banIdInput.value); // XSS is cringe
    const url = `https://${api_ns}/api/accounts/${val}/ban`;
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

function viewUserData() {
    showLoadingScreen();

    const val = encodeURI(viewUserId.value); // XSS is cringe
    const url = `https://${api_ns}/api/accounts/${val}/public`;

    window.fetch(url).then(response => {
        switch(response.status) {
            case 404:
                dashboardErrorText.textContent = "User not found!";
                showContent();
                pullAnalyticsData();
                return;
            case 401:
                dashboardErrorText.textContent = "You are not logged in.";
                showContent();
                setTimeout(() => showLoginFlow(), 2500);
                return;
            case 403:
                dashboardErrorText.textContent = "You do not have permission to view this user's data.";
                return;
            default:
                dashboardErrorText.textContent = "An unknown error has occurred. Please try again later.";
                showContent();
                pullAnalyticsData();
                return;
            case 200:
                break;
        }
        
        response.json().then(data => {
            document.getElementById('view-user-header').textContent = `User data - @${data.username} / '${data.nickname}' / (#${val})`;
            document.getElementById('view-user-bio').textContent = data.bio;
            document.getElementById('view-user-tag').textContent = data.tag;
            showUser();
            viewingId = val;
        });
    });
}

function revokeTag() {
    showLoadingScreen();

    const tag = document.getElementById('revoke-user-tag-input').value;
    const val = encodeURI(viewingId); // XSS is cringe
    const url = `https://${api_ns}/api/accounts/${val}/tags/${tag}`;

    window.fetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.sessionStorage.getItem('token')}`
        }
    }).then(response => {
        switch(response.status) {
            case 404:
                userErrorText.textContent = "User not found!";
                showUser();
                return;
            case 401:
                userErrorText.textContent = "You are not logged in.";
                showUser();
                setTimeout(() => showLoginFlow(), 2500);
                return;
            case 403:
                userErrorText.textContent = "You do not have permission to revoke this tag.";
                showUser();
                return;
            default:
                userErrorText.textContent = "An unknown error has occurred. Please try again later.";
                showUser();
                return;
            case 200:
                break;
        }

        userErrorText.textContent = "Tag successfully revoked.";
        showUser();
    });
}

function grantTag() {
    showLoadingScreen();

    const tag = encodeURI(document.getElementById('grant-user-tag-input').value);
    window.fetch(`https://${api_ns}/api/accounts/${viewingId}/tags/${tag}`, {
        'method': 'PUT',
        'headers': {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.sessionStorage.getItem('token')}`
        }
    }).then(response => {
        switch(response.status) {
            case 404:
                userErrorText.textContent = "User not found!";
                showUser();
                return;
            case 401:
                userErrorText.textContent = "You are not logged in.";
                showUser();
                setTimeout(() => showLoginFlow(), 2500);
                return;
            case 403:
                userErrorText.textContent = "You do not have permission to grant this user a tag.";
                showUser();
                return;
            default:
                userErrorText.textContent = "An unknown error has occurred. Please try again later.";
                showUser();
                return;
            case 200:
                break;
        }
        userErrorText.textContent = "Tag granted!";
        showUser();
    });
}

function setUserItemCount() {
    showLoadingScreen();
    const itemid = document.getElementById('set-user-item-count-id-input').value;
    const count = document.getElementById('set-user-item-count-number-input').value;

    const n = parseInt(count);
    if(isNaN(n)) {
        itemCountError.textContent = "Invalid count. Must be an integer.";
        showUser();
        return;
    }

    window.fetch(`https://${api_ns}/dev/accounts/${viewingId}/inventory-item`, {
            'method': 'POST',
            'headers': {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.sessionStorage.getItem('token')}`
            },
            'body': JSON.stringify({
                item_id: itemid,
                count: n
            })
        })
        .then(response => {
            switch(response.status) {
                case 200:
                    itemCountError.textContent = "Successfully set item count.";
                    showUser();
                    return;
                case 404:
                    itemCountError.textContent = "Failed to locate user.";
                    showUser();
                    return;
                case 500:
                    itemCountError.textContent = "Internal server error occurred.";
                    showUser();
                    return;
                case 403:
                    showLoginFlow();
                    return;
                default:
                    itemCountError.textContent = "An unknown error occurred.";
                    showUser();
                    console.log(response);
                    response.text().then(t => console.log(t));
                    return;
            }
        });
}

function namespace(ns) {
    api_ns = ns;
}

loginButton.onclick = login;
passwordField.onsubmit = login;
banButton.onclick = banUser;
viewUserButton.onclick = viewUserData;

grantUserTagButton.onclick = grantTag;
revokeUserTagButton.onclick = revokeTag;

setUserItemCountButton.onclick = setUserItemCount;

viewUserBackButton.onclick = () => {
    pullAnalyticsData();
    showContent();
};

if(verifyCurrentToken()) {
    showContent();
    pullAnalyticsData();
} else {
    showLoginFlow();
}