import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const { email, name, date, reason } = await req.json();

    if (!email || !name || !date || !reason) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }

    const formattedDate = new Date(date).toLocaleDateString('el-GR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Athens',
    });

    const formattedTime = new Date(date).toLocaleTimeString('el-GR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Athens',
    });

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Δρ. Γεωργία Κόλλια" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'Ακύρωση Ραντεβού',
      html: `
      <!DOCTYPE html>
      <html lang="el">
        <head>
          <meta charset="UTF-8" />
          <title>Ακύρωση Ραντεβού</title>
        </head>
        <body style="margin:0;padding:0;font-family:Georgia, serif;background-color:#f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #ddd;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                  <tr>
                    <td style="padding:40px 40px 30px;">
                      <h2 style="margin:0;color:#1a1a1a;font-size:22px;font-weight:normal;">Αξιότιμε/η κ. ${name},</h2>
                      <p style="margin-top:20px;color:#333333;font-size:16px;line-height:1.6;">
                        Θα θέλαμε να σας ενημερώσουμε ότι το ραντεβού σας έχει ακυρωθεί.
                      </p>

                      <p style="margin-top:25px;margin-bottom:5px;color:#1a1a1a;font-size:16px;font-weight:bold;">Στοιχεία Ραντεβού:</p>
                      <table cellpadding="0" cellspacing="0" style="width:100%;font-size:15px;color:#333;margin-top:10px;">
                        <tr>
                          <td style="padding:8px 0;"><strong>Ημερομηνία:</strong></td>
                          <td style="padding:8px 0;">${formattedDate}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;"><strong>Ώρα:</strong></td>
                          <td style="padding:8px 0;">${formattedTime}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;"><strong>Λόγος Επίσκεψης:</strong></td>
                          <td style="padding:8px 0;">${reason}</td>
                        </tr>
                      </table>

                      <p style="margin-top:30px;color:#333333;font-size:15px;line-height:1.6;">
                        Για επαναπρογραμματισμό ή για οποιαδήποτε απορία, παρακαλούμε επικοινωνήστε μαζί μας στο τηλέφωνο <strong>210 1234567</strong>.
                      </p>

                      <p style="margin-top:35px;color:#1a1a1a;font-size:15px;">
                        Με εκτίμηση,<br />

                        <strong>Γεωργία Κόλλια</strong>
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="background-color:#f2f2f2;padding:15px;color:#888;font-size:13px;border-top:1px solid #ddd;">
                      Το παρόν μήνυμα αποστέλλεται αυτόματα από το σύστημα κρατήσεων του ιατρείου.  <strong>Μήν απαντάτε σε αυτό το email.</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>

      `,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('❌ Σφάλμα αποστολής email ακύρωσης:', error);
    return new Response(JSON.stringify({ error: 'Αποτυχία αποστολής email' }), { status: 500 });
  }
}
