export interface RegisterInput {
    fullName: string;
    phone: string;
    email?: string | undefined;
    password: string;
}
export declare function registerUser(input: RegisterInput): Promise<{
    token: string;
    user: {
        id: string;
        fullName: string;
        phone: string;
        email: string | null;
        role: import("@prisma/client").$Enums.Role;
        isVerified: boolean;
    };
}>;
export declare function loginUser(phone: string, password: string): Promise<{
    token: string;
    user: {
        id: string;
        fullName: string;
        phone: string;
        email: string | null;
        role: import("@prisma/client").$Enums.Role;
        isVerified: boolean;
    };
}>;
//# sourceMappingURL=auth.service.d.ts.map