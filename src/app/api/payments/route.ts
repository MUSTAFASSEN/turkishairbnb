import { NextRequest, NextResponse } from 'next/server';
import { initDb, paymentsCol, bookingsCol } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  await initDb();
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

  const { bookingId, action } = await request.json();

  const payments = await paymentsCol();
  const payment = await payments.findOne({ bookingId }, { projection: { _id: 0 } });
  if (!payment) return NextResponse.json({ error: 'Ödeme bulunamadı' }, { status: 404 });

  const bookings = await bookingsCol();
  const booking = await bookings.findOne({ id: bookingId }, { projection: { _id: 0 } });

  if (action === 'release' && user.role === 'admin') {
    await payments.updateOne({ bookingId }, { $set: { status: 'released' } });
    if (booking) {
      await bookings.updateOne({ id: bookingId }, { $set: { paymentStatus: 'released', status: 'completed' } });
    }
    const updated = await payments.findOne({ bookingId }, { projection: { _id: 0 } });
    return NextResponse.json({ payment: updated, message: 'Ödeme ev sahibine aktarıldı' });
  }

  if (action === 'refund' && (user.role === 'admin' || user.id === booking?.hostId)) {
    await payments.updateOne({ bookingId }, { $set: { status: 'refunded' } });
    if (booking) {
      await bookings.updateOne({ id: bookingId }, { $set: { paymentStatus: 'refunded', status: 'cancelled' } });
    }
    const updated = await payments.findOne({ bookingId }, { projection: { _id: 0 } });
    return NextResponse.json({ payment: updated, message: 'Ödeme iade edildi' });
  }

  return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 });
}
