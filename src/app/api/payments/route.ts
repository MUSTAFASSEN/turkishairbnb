import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  await db.init();
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

  const { bookingId, action } = await request.json();

  const payment = db.payments.find(p => p.bookingId === bookingId);
  if (!payment) return NextResponse.json({ error: 'Ödeme bulunamadı' }, { status: 404 });

  const booking = db.bookings.find(b => b.id === bookingId);

  if (action === 'release' && user.role === 'admin') {
    payment.status = 'released';
    if (booking) {
      booking.paymentStatus = 'released';
      booking.status = 'completed';
    }
    return NextResponse.json({ payment, message: 'Ödeme ev sahibine aktarıldı' });
  }

  if (action === 'refund' && (user.role === 'admin' || user.id === booking?.hostId)) {
    payment.status = 'refunded';
    if (booking) {
      booking.paymentStatus = 'refunded';
      booking.status = 'cancelled';
    }
    return NextResponse.json({ payment, message: 'Ödeme iade edildi' });
  }

  return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 });
}
