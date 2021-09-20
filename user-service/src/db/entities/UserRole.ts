export enum UserRole {
    Normal = "normal",
    Admin = "admin",
    SuperAdmin = "superadmin"
}

export namespace UserRole {
    export function Values(): Array<string> {
        return [ UserRole.Admin, UserRole.Normal, UserRole.SuperAdmin ]
    }
    export function GetKey(role: UserRole): keyof typeof UserRole {
        switch (role) {
            case UserRole.Admin:
                return 'Admin'
            case UserRole.Normal:
                return 'Normal'
            case UserRole.SuperAdmin:
                return 'SuperAdmin'
            default:
                return 'Normal'
        }
    }
}