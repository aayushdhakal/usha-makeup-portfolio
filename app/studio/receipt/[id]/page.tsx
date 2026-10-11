import { requireStudioAdmin } from "@/lib/studio-auth";
import { db, formatMin } from "@/lib/studio";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";

type Row = { bill_id: number; appointment_id: string; client_name: string; client_phone: string; service_name: string; staff_name: string; date: string; start_min: number; subtotal_rupees: number; discount_rupees: number; total_rupees: number; due_on: string | null; issued_at: string };
type Payment = { id: number; amount_rupees: number; method: string; reference: string; paid_on: string };
const money = (value: number) => "Rs " + Number(value || 0).toLocaleString("en-NP");

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStudioAdmin();
  const { id } = await params;
  const database = db();
  const bill = await database.prepare(
    "SELECT b.id AS bill_id,a.id AS appointment_id,c.name AS client_name,c.phone AS client_phone,s.name AS service_name,m.name AS staff_name,a.date,a.start_min,b.subtotal_rupees,b.discount_rupees,b.total_rupees,b.due_on,b.issued_at " +
    "FROM bills b JOIN appointments a ON a.id=b.appointment_id JOIN clients c ON c.id=a.client_id JOIN services s ON s.id=a.service_id JOIN staff m ON m.id=a.staff_id WHERE a.id=?"
  ).bind(id).first<Row>();
  if (!bill) return <main className="access-page"><h1>Receipt not found</h1><a href="/studio">Back to studio</a></main>;
  const payments = (await database.prepare("SELECT id,amount_rupees,method,reference,paid_on FROM payments WHERE bill_id=? ORDER BY paid_on,id").bind(bill.bill_id).all<Payment>()).results;
  const paid = payments.reduce((sum, payment) => sum + payment.amount_rupees, 0);
  return <main className="receipt-page">
    <div className="receipt-actions"><a href="/studio">← Studio dashboard</a><PrintButton /></div>
    <article className="receipt-paper">
      <header className="receipt-header"><div className="receipt-brand"><img src="/usha-logo-dark.png" alt="Usha Makeup and Nails" /></div><div className="receipt-title"><span>PAYMENT RECORD</span><h1>Receipt</h1></div></header>
      <div className="receipt-meta"><div><span>ISSUED TO</span><strong>{bill.client_name}</strong><p>{bill.client_phone}</p></div><div><span>RECEIPT NO.</span><strong>UMN-{String(bill.bill_id).padStart(5, "0")}</strong><p>Issued {bill.issued_at.slice(0, 10)}</p></div></div>
      <div className="receipt-service"><div><strong>{bill.service_name}</strong><span>{bill.staff_name} · {bill.date} at {formatMin(bill.start_min)}</span></div><strong>{money(bill.subtotal_rupees)}</strong></div>
      <div className="receipt-totals"><div><span>Subtotal</span><strong>{money(bill.subtotal_rupees)}</strong></div><div><span>Discount</span><strong>{money(bill.discount_rupees)}</strong></div><div><span>Total</span><strong>{money(bill.total_rupees)}</strong></div><div><span>Amount paid</span><strong>{money(paid)}</strong></div><div className="receipt-balance"><span>Balance due</span><strong>{money(Math.max(0, bill.total_rupees - paid))}</strong></div>{bill.due_on && <div><span>Due date</span><strong>{bill.due_on}</strong></div>}</div>
      {payments.length > 0 && <section className="receipt-payments"><h2>Payments recorded</h2>{payments.map((payment) => <div key={payment.id}><span>{payment.paid_on} · {payment.method}{payment.reference ? " · " + payment.reference : ""}</span><strong>{money(payment.amount_rupees)}</strong></div>)}</section>}
      <footer className="receipt-footer"><p>Usha Makeup and Nails</p><p><span>New Baneshwor, Kathmandu</span></p></footer>
    </article>
  </main>;
}
