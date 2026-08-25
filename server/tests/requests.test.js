import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import db from '../db.js';
import jwt from 'jsonwebtoken';
// No ESM unsupported jest.mocks

// Helper to generate a valid test token
const generateTestToken = (userId, role) => {
    return jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1h' });
};

describe('Requests Routes (BR4)', () => {
    
    // Provide a fallback JWT_SECRET if missing during tests
    beforeAll(() => {
        process.env.JWT_SECRET = 'testsecret';
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should reject document submission if there is an active request (BR4)', async () => {
        // Mock DB: Simulate finding an existing 'Pending' request for this user and doc type
        db.mockQuery((sql, params, callback) => {
            const cb = typeof params === 'function' ? params : callback;
            if (sql.includes('SELECT request_id FROM Document_RequestTable')) {
                // Return an active request to trigger the anti-spam error
                return cb(null, [{ request_id: 101 }]); 
            }
            cb(null, []);
        });

        const token = generateTestToken(55, 'Resident');

        const response = await request(app)
            .post('/api/requests/submit')
            .set('Authorization', `Bearer ${token}`)
            .send({
                doc_type_id: 1,
                purpose: 'Employment',
                scheduled_date: '2026-10-15'
            });

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Anti-Spam Alert: You already have an active request for this document type in the queue!');
    });

    it('should successfully submit a request if no active duplicate exists', async () => {
        db.mockQuery((sql, params, callback) => {
            const cb = typeof params === 'function' ? params : callback;
            if (sql.includes('SELECT request_id FROM Document_RequestTable')) {
                // No active duplicate
                return cb(null, []); 
            }
            if (sql.includes('SELECT res.first_name')) {
                // Name resolution mock
                return cb(null, [{ first_name: 'Test', last_name: 'Resident', doc_name: 'Barangay Clearance' }]);
            }
            if (sql.includes('SELECT setting_value FROM system_settingstable')) {
                return cb(null, [{ setting_value: 50 }]); // Default daily limit
            }
            if (sql.includes('SELECT document_limit FROM Date_Specific_LimitsTable')) {
                return cb(null, []); // No specific limit
            }
            if (sql.includes('SELECT COUNT(*) as totalScheduled')) {
                return cb(null, [{ totalScheduled: 5 }]); // Only 5 people in queue today
            }
            if (sql.includes('INSERT INTO Document_RequestTable')) {
                return cb(null, { insertId: 200 });
            }
            if (sql.includes('INSERT INTO Queue_ManagementTable')) {
                return cb(null, { insertId: 300 });
            }
            if (sql.includes('INSERT INTO Audit_LogsTable')) {
                return cb(null, { insertId: 400 });
            }
            cb(null, []);
        });

        const token = generateTestToken(55, 'Resident');

        const response = await request(app)
            .post('/api/requests/submit')
            .set('Authorization', `Bearer ${token}`)
            .send({
                doc_type_id: 1,
                purpose: 'Employment',
                scheduled_date: '2026-10-15' // Ensure this is not a Sunday depending on the test year
            });

        // 2026-10-15 is a Thursday, so it should pass the Sunday check.
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Application submitted successfully');
        expect(response.body.queue_number).toBe(6); // 5 existing + 1
    });

    it('should reject request if the daily limit is reached', async () => {
        db.mockQuery((sql, params, callback) => {
            const cb = typeof params === 'function' ? params : callback;
            if (sql.includes('SELECT request_id FROM Document_RequestTable')) {
                return cb(null, []); 
            }
            if (sql.includes('SELECT res.first_name')) {
                return cb(null, [{ first_name: 'Test', last_name: 'Resident', doc_name: 'Barangay Clearance' }]);
            }
            if (sql.includes('SELECT setting_value FROM system_settingstable')) {
                return cb(null, [{ setting_value: 10 }]); // Limit is 10
            }
            if (sql.includes('SELECT document_limit FROM Date_Specific_LimitsTable')) {
                return cb(null, []); 
            }
            if (sql.includes('SELECT COUNT(*) as totalScheduled')) {
                return cb(null, [{ totalScheduled: 10 }]); // 10 people in queue already
            }
            cb(null, []);
        });

        const token = generateTestToken(55, 'Resident');

        const response = await request(app)
            .post('/api/requests/submit')
            .set('Authorization', `Bearer ${token}`)
            .send({
                doc_type_id: 1,
                purpose: 'Employment',
                scheduled_date: '2026-10-15'
            });

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('is already full. Please select another date.');
    });
});
