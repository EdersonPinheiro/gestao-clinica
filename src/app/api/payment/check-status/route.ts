import { NextResponse } from 'next/server';
import { efipay } from '@/lib/efipay';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const txid = searchParams.get('txid');

    if (!txid) {
        return NextResponse.json({ error: 'Missing txid' }, { status: 400 });
    }

    try {
        const response = await efipay.pixDetailCharge({ txid });

        // Status keys: ATIVA, CONCLUIDA, REMOVIDA_PELO_USUARIO_RECEBEDOR, REMOVIDA_PELO_PSP
        return NextResponse.json({
            status: response.status,
            paid: response.status === 'CONCLUIDA'
        });

    } catch (error: any) {
        console.error('EfiPay Check Status Error:', error);
        return NextResponse.json(
            { error: 'Error checking status', details: error?.message || error },
            { status: 500 }
        );
    }
}
