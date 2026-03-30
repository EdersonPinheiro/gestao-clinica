import { NextResponse } from 'next/server';
import { efipay } from '@/lib/efipay';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { cpf, name, value = "100.00" } = body;

        const cleanCpf = cpf.replace(/\D/g, '');

        const bodyRequest = {
            calendario: {
                expiracao: 3600
            },
            devedor: {
                cpf: cleanCpf,
                nome: name
            },
            valor: {
                original: value
            },
            chave: process.env.EFI_PIX_KEY || 'YOUR_PIX_KEY' // The PIX key registered in EfiPay
        };

        const params = {
            txid: undefined // Let Efi generate one, or pass one if needed
        };

        // 1. Create Immediate Charge
        const chargeResponse = await efipay.pixCreateImmediateCharge(params, bodyRequest);

        if (!chargeResponse.loc || !chargeResponse.loc.id) {
            throw new Error('Failed to create charge: No location ID returned');
        }

        const locId = chargeResponse.loc.id;

        // 2. Generate QRCode
        const qrCodeResponse = await efipay.pixGenerateQRCode({ id: locId });

        return NextResponse.json({
            txid: chargeResponse.txid,
            qrcode: qrCodeResponse.qrcode,
            imagemQrcode: qrCodeResponse.imagemQrcode,
            valor: value
        });

    } catch (error: any) {
        console.error('EfiPay Error:', error);
        return NextResponse.json(
            { error: 'Error generating PIX', details: error?.message || error },
            { status: 500 }
        );
    }
}
