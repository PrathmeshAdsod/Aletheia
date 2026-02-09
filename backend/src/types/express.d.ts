import { Request } from 'express';

declare global {
    namespace Express {
        interface Request {
            userId?: string;
            teamId?: string;
            organizationId?: string;
            userRole?: 'admin' | 'member' | 'viewer';
        }
    }
}
