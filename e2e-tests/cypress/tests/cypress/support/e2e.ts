Cypress.Commands.add('login', (email, password) => {
    Cypress.LocalStorage.clear
    
    cy.request({
        method: 'POST',
        url: Cypress.env('backendURL'),
        body: {
                "operationName": null,
                "variables": {
                    "email": email,
                    "password": password
                },
                "query": "query ($email: String!, $password: String!, $publisherId: Int) {\n  login(email: $email, password: $password, publisherId: $publisherId) {\n    email\n    firstName\n    lastName\n    language\n    klickTipp {\n      newsletterState\n      __typename\n    }\n    hasElopage\n    publisherId\n    isAdmin\n    creation\n    __typename\n  }\n}\n"
        }
    })
    .then((response) => {
        let vuexToken = {
            token : JSON.parse(JSON.stringify(response.headers))['token'],
            // TODO: how to compute the token time from the token im response?
            tokenTime : 1663224487
        };

        cy.visit('/');
        window.localStorage.setItem('vuex', JSON.stringify(vuexToken));
    })
})