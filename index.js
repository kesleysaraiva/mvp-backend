const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sgMail = require('@sendgrid/mail');

const app = express();
app.use(cors());
app.use(express.json());

// E-mail (SendGrid)
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}
const FROM_EMAIL = process.env.FROM_EMAIL || 'seu-email-verificado@exemplo.com';

app.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ error: 'Campos obrigatórios: to, subject e text ou html' });
    }
    const msg = { to, from: FROM_EMAIL, subject, text: text || undefined, html: html || undefined };
    const resp = await sgMail.send(msg);
    res.json({ success: true, id: resp[0]?.headers?.['x-message-id'] || null });
  } catch (err) {
    console.error(err.response?.body || err.message);
    res.status(500).json({ error: 'Falha ao enviar e-mail', detail: err.response?.body || err.message });
  }
});

app.post('/send-whatsapp', async (req, res) => {
  try {
    const { to, body } = req.body;
    if (!to || !body) {
      return res.status(400).json({ error: 'Campos obrigatórios: to e body' });
    }
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    if (!token || !phoneId) {
      return res.status(500).json({ error: 'WHATSAPP_TOKEN ou WHATSAPP_PHONE_ID não configurados' });
    }
    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
    const payload = { messaging_product: 'whatsapp', to, type: 'text', text: { body } };
    const resp = await axios.post(url, payload, { headers: { Authorization: `Bearer ${token}` } });
    res.json({ success: true, data: resp.data });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Falha ao enviar WhatsApp', detail: err.response?.data || err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());

// rota teste já existe: /health

// rota para enviar email
app.post("/send-email", async (req, res) => {
  const { to, subject, text } = req.body;

  try {
    // configura o transporte SMTP (exemplo: Gmail)
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // vem do Render (env var)
        pass: process.env.EMAIL_PASS, // vem do Render (env var)
      },
    });

    // envia o e-mail
    let info = await transporter.sendMail({
      from: `"MVP App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
