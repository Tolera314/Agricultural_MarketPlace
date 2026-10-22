import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
declare const prisma: PrismaClient<{
    adapter: PrismaPg;
    log: ("info" | "query" | "warn" | "error")[];
}, "info" | "query" | "warn" | "error", import("@prisma/client/runtime/client").DefaultArgs>;
export default prisma;
//# sourceMappingURL=prisma.d.ts.map