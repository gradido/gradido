/// <reference types="cypress" />

import './e2e';

declare global {
    namespace Cypress {
        interface Chainable<Subject> {
        login(email: string, password: string): Chainable<any>
        }
    }
}