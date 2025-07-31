// src/app/api/verify-recaptcha/route.js

export async function POST(req) {
  try {
    const body = await req.json();
    const token = body.token;

    if (!token) {
      return new Response(JSON.stringify({ success: false, message: "Missing token" }), { status: 400 });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    const res = await fetch(verificationUrl, {
      method: "POST",
    });

    const data = await res.json();

    if (!data.success) {
      return new Response(JSON.stringify({ success: false, message: "Invalid reCAPTCHA" }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("reCAPTCHA verification failed:", error);
    return new Response(JSON.stringify({ success: false, message: "Server error" }), { status: 500 });
  }
}
