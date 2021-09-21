import { UserRole } from "./UserRole";

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    token: string;
}