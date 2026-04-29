require('dotenv').config();

const senderEmail = process.env.SENDER_EMAIL || 'fizaworkspace8@gmail.com';
const senderName = process.env.SENDER_NAME || 'Burger Fever Cafe';

async function sendBrevoEmail(toEmail, toName, subject, htmlContent) {
  console.log('\n--- EMAIL START ---');
  console.log(`Recipient Email: ${toEmail} | Name: ${toName}`);
  console.log(`Subject: ${subject}`);
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toEmail, name: toName }],
        subject: subject,
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('EMAIL FAILURE FROM BREVO:', errorData);
      throw new Error(JSON.stringify(errorData));
    }

    const data = await response.json();
    console.log(`BREVO RESPONSE:`, data);
    console.log(`EMAIL SUCCESS: Sent to ${toEmail} (${data.messageId})`);
    return true;
  } catch (err) {
    console.error('EMAIL FAILURE:', err.message);
    throw err; // Allow caller .catch to handle it
  }
}

/**
 * Send a verification code email to a newly registered user
 */
async function sendVerificationEmail(toEmail, toName, code) {
  const subject = '🔥 Verify Your Burger Fever Account';
  const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0a; border-radius: 24px; overflow: hidden; border: 1px solid #222;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ea580c, #dc2626); padding: 40px 30px; text-align: center;">
          <h1 style="color: #fff; font-size: 28px; margin: 0; font-weight: 900; letter-spacing: -1px;">
            BURGER<span style="opacity: 0.8;">FEVER</span>
          </h1>
          <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 3px;">
            Account Verification
          </p>
        </div>

        <!-- Body -->
        <div style="padding: 40px 30px; text-align: center;">
          <p style="color: #aaa; font-size: 16px; margin: 0 0 8px;">Hey <strong style="color: #fff;">${toName}</strong>,</p>
          <p style="color: #777; font-size: 14px; margin: 0 0 30px;">
            Enter this code to verify your account:
          </p>
          
          <!-- Code Box -->
          <div style="background: #111; border: 2px solid #ea580c; border-radius: 16px; padding: 24px; margin: 0 auto; display: inline-block;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #ea580c; font-family: 'Courier New', monospace;">
              ${code}
            </span>
          </div>
          
          <p style="color: #555; font-size: 12px; margin: 24px 0 0; font-style: italic;">
            This code expires in 15 minutes
          </p>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 30px; border-top: 1px solid #1a1a1a; text-align: center;">
          <p style="color: #444; font-size: 11px; margin: 0;">
            © 2026 Burger Fever — Premium Fast Food
          </p>
        </div>
      </div>
    `;
  return sendBrevoEmail(toEmail, toName, subject, htmlContent);
}

/**
 * Send order confirmation email
 */
async function sendOrderConfirmationEmail(toEmail, toName, order) {
  // Build items HTML
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #ccc; font-size: 14px;">
        <strong style="color: #fff;">${item.name || item.product_name}</strong>
        <br><span style="color: #666; font-size: 12px;">x${item.quantity}</span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #ea580c; font-weight: bold; text-align: right; font-size: 14px;">
        $${(parseFloat(item.price || item.product_price) * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  // Payment method display
  const paymentLabels = {
    cod: '💵 Cash on Delivery',
    jazzcash: '📱 JazzCash',
    nayapay: '📱 NayaPay',
    easypaisa: '📱 EasyPaisa',
    card: '💳 Card'
  };
  const paymentDisplay = paymentLabels[order.payment_method] || order.payment_method;

  const subject = `🍔 Order Confirmed — ${order.order_number}`;
  const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0a; border-radius: 24px; overflow: hidden; border: 1px solid #222;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ea580c, #dc2626); padding: 40px 30px; text-align: center;">
          <div style="background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 30px;">✓</span>
          </div>
          <h1 style="color: #fff; font-size: 24px; margin: 0; font-weight: 900;">ORDER CONFIRMED</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 13px; letter-spacing: 2px;">
            ${order.order_number}
          </p>
        </div>

        <!-- Greeting -->
        <div style="padding: 30px 30px 0;">
          <p style="color: #aaa; font-size: 15px; margin: 0;">
            Hey <strong style="color: #fff;">${toName}</strong>, your order is being prepared! 🔥
          </p>
        </div>

        <!-- Items -->
        <div style="padding: 24px 30px;">
          <p style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px; font-weight: bold;">
            Items Ordered
          </p>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsHtml}
          </table>
        </div>

        <!-- Totals -->
        <div style="padding: 0 30px 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #666; font-size: 13px;">Subtotal</td>
              <td style="text-align: right; color: #aaa; font-size: 13px;">$${parseFloat(order.subtotal).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666; font-size: 13px;">Shipping</td>
              <td style="text-align: right; color: #aaa; font-size: 13px;">$${parseFloat(order.shipping_fee).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666; font-size: 13px;">Payment</td>
              <td style="text-align: right; color: #aaa; font-size: 13px;">${paymentDisplay}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0 0; border-top: 1px solid #222; color: #fff; font-size: 18px; font-weight: 900;">TOTAL</td>
              <td style="padding: 12px 0 0; border-top: 1px solid #222; text-align: right; color: #ea580c; font-size: 18px; font-weight: 900;">
                $${parseFloat(order.total).toFixed(2)}
              </td>
            </tr>
          </table>
        </div>

        <!-- Shipping -->
        ${order.shipping_address ? `
        <div style="padding: 0 30px 24px;">
          <div style="background: #111; border-radius: 12px; padding: 16px;">
            <p style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px; font-weight: bold;">📍 Delivering To</p>
            <p style="color: #ccc; font-size: 14px; margin: 0;">${order.shipping_address}</p>
            <p style="color: #888; font-size: 13px; margin: 4px 0 0;">${order.shipping_city || ''}${order.shipping_zip ? ', ' + order.shipping_zip : ''}</p>
            ${order.shipping_phone ? `<p style="color: #888; font-size: 13px; margin: 4px 0 0;">📞 ${order.shipping_phone}</p>` : ''}
          </div>
        </div>
        ` : ''}

        <!-- ETA -->
        <div style="padding: 0 30px 30px; text-align: center;">
          <div style="background: #111; border-radius: 12px; padding: 16px;">
            <p style="color: #ea580c; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; margin: 0;">
              🕐 Estimated Delivery: 35-45 Minutes
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 30px; border-top: 1px solid #1a1a1a; text-align: center;">
          <p style="color: #444; font-size: 11px; margin: 0;">
            © 2026 Burger Fever — Premium Fast Food
          </p>
        </div>
      </div>
    `;
  return sendBrevoEmail(toEmail, toName, subject, htmlContent);
}

module.exports = { sendVerificationEmail, sendOrderConfirmationEmail };
