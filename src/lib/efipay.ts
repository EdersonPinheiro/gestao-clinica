import Efipay from 'sdk-node-apis-efi';
import path from 'path';

const options = {
    sandbox: process.env.EFI_SANDBOX === 'true',
    client_id: process.env.EFI_CLIENT_ID || '',
    client_secret: process.env.EFI_CLIENT_SECRET || '',
    certificate: process.env.EFI_CERTIFICATE_PATH || path.join(process.cwd(), 'certs', 'gestao-clinica.p12'), // Correct path to the certificate
    validateMtls: false // Optional, sometimes needed for local dev issues
};

export const efipay = new Efipay(options);

export async function getMonthlyRevenue(): Promise<number> {
    try {
        const now = new Date();
        // Start of month (UTC-ish or Local adjustment) - Simplification: Use ISO string parts
        // To be precise for BRT, we should respect the offset, but simple ISO is usually accepted by API if valid.
        // API expects ISO 8601 / RFC 3339.

        // Month start: Year-Month-01T00:00:00Z
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        // Month end: NOW (or end of month)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const params = {
            inicio: startOfMonth,
            fim: endOfMonth,
            status: 'CONCLUIDA'
        };

        const response = await efipay.pixListCharges(params);

        if (!response.cobs) return 0;

        const total = response.cobs.reduce((acc: number, cob: any) => {
            return acc + parseFloat(cob.valor.original);
        }, 0);

        return total;
    } catch (error: any) {
        // Melhorar o log para ver o erro real da API
        console.error("Error fetching monthly revenue:", JSON.stringify(error?.response?.data || error, null, 2));
        return 0;
    }
}
