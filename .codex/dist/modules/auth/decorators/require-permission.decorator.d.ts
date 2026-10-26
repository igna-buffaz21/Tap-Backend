export declare const REQUIRED_PERMISSION_KEY = "requiredPermission";
export declare const SKIP_PERMISSION_CHECK_KEY = "skipPermissionCheck";
export declare const SUPERADMIN_ONLY_KEY = "superadminOnly";
export declare const RequirePermission: (permission: string) => import("@nestjs/common").CustomDecorator<string>;
export declare const RequireAnyPermission: (...permissions: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const SkipPermissionCheck: () => import("@nestjs/common").CustomDecorator<string>;
export declare const SuperadminOnly: () => import("@nestjs/common").CustomDecorator<string>;
