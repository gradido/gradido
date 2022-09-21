import jwtDecode from 'jwt-decode'

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
                "query": Cypress.env('loginQuery')
        }
    })
    .then(async (response) => {
        const token = response.headers.token
        let tokenTime

        // to avoid JWT InvalidTokenError, the decoding of the token is wrapped
        // in a try-catch block (see
        // https://github.com/auth0/jwt-decode/issues/65#issuecomment-395493807)
        try {
            tokenTime = jwtDecode(token).exp
        } catch (tokenDecodingError) {
            cy.log('JWT decoding error: ', tokenDecodingError)
        }

        let vuexToken = {
            token : token,
            tokenTime : tokenTime
        };

        cy.visit('/')
        window.localStorage.setItem('vuex', JSON.stringify(vuexToken))
    })
})