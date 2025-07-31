import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
    const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", { status: 401 });
        }

  try {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`id, appointment_time, reason, patients (full_name, email)`)
      .eq('status', 'approved')
      .gte('appointment_time', now.toISOString())
      .lte('appointment_time', tomorrow.toISOString());

    if (error) {
      console.error('Supabase error:', error);
      return new Response(JSON.stringify({ message: 'Failed to fetch appointments' }), { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    for (const appt of appointments) {
      const { full_name, email } = appt.patients;
      const appointmentDate = new Date(appt.appointment_time);

      const formattedDate = appointmentDate.toLocaleDateString('el-GR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/Athens',
      });

      const formattedTime = appointmentDate.toLocaleTimeString('el-GR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Athens',
      });

      await transporter.sendMail({
        from: `"Δρ. Γεωργία Κόλλια" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: 'Υπενθύμιση Ραντεβού',
        html: `
          <!DOCTYPE html>
          <html lang="el">
            <head><meta charset="UTF-8" /></head>
            <body style="font-family:Georgia, serif;background:#f5f5f5;padding:40px;">
              <table width="100%" style="max-width:600px;margin:auto;background:white;border-radius:6px;border:1px solid #ddd;padding:30px;">
                <tr><td>
                  <h2 style="color:#1a1a1a;font-size:20px;">Αγαπητέ/ή ${full_name},</h2>
                  <p style="margin:20px 0;font-size:16px;color:#333;">
                    Υπενθύμιση για το επικείμενο ραντεβού σας:
                  </p>
                  <ul style="list-style:none;padding:0;font-size:15px;">
                    <li><strong>Ημερομηνία:</strong> ${formattedDate}</li>
                    <li><strong>Ώρα:</strong> ${formattedTime}</li>
                    <li><strong>Λόγος:</strong> ${appt.reason}</li>
                  </ul>
                  <p style="margin-top:30px;color:#333;font-size:15px;">
                    Παρακαλούμε να προσέλθετε εγκαίρως. Για ακύρωση ή αλλαγή ραντεβού, επικοινωνήστε με το ιατρείο.
                  </p>
                  <p style="margin-top:30px;">Με εκτίμηση,<br /><strong>Γεωργία Κόλλια</strong></p>
                </td></tr>
                <tr><td style="text-align:center;color:#888;font-size:13px;padding-top:20px;">
                  Το παρόν email αποστέλλεται αυτόματα. Μην απαντάτε σε αυτό το μήνυμα.
                </td></tr>
              </table>
            </body>
          </html>
        `,
      });
    }

    return new Response(JSON.stringify({ message: 'Reminders sent successfully', count: appointments.length }), { status: 200 });
  } catch (err) {
    console.error('❌ Reminder email error:', err);
    return new Response(JSON.stringify({ message: 'Failed to send reminders' }), { status: 500 });
  }
}