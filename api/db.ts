import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;

process.on('exit', async () => {
    await prisma.$disconnect();
});
