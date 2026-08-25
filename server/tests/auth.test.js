import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import db from '../db.js'; // This will be the mocked version because NODE_ENV=test

// No ESM unsupported jest.mocks

describe('Auth Routes (BR19)', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should reject registration if the email is already registered (BR19)', async () => {
        // Mock the database to simulate that the email already exists
        db.mockQuery((sql, params, callback) => {
            const cb = typeof params === 'function' ? params : callback;
            if (sql.includes('SELECT resident_id FROM Resident_ProfileTable WHERE email_address = ?')) {
                // Simulate an existing user found
                return cb(null, [{ resident_id: 99 }]); 
            }
            cb(null, []);
        });

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                firstName: 'Test',
                lastName: 'User',
                email: 'duplicate@example.com',
                password: 'password123'
            });

        expect(response.status).toBe(409);
        expect(response.body.error).toBe('This email address is already registered. Please log in or reset your password.');
    });

    it('should successfully register a new user if the email is unique', async () => {
        // Mock the database to simulate that the email is unique, and insert succeeds
        let insertCalled = 0;
        db.mockQuery((sql, params, callback) => {
            const cb = typeof params === 'function' ? params : callback;
            if (sql.includes('SELECT resident_id FROM Resident_ProfileTable WHERE email_address = ?')) {
                // No user found (unique email)
                return cb(null, []); 
            }
            if (sql.includes('INSERT INTO Resident_ProfileTable')) {
                insertCalled++;
                return cb(null, { insertId: 100 });
            }
            cb(null, []);
        });

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                firstName: 'New',
                lastName: 'User',
                email: 'unique@example.com',
                password: 'password123'
            });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Resident registered successfully with ID!');
        
        // Verify that the insert query was actually called
        expect(insertCalled).toBe(1);
    });
});
