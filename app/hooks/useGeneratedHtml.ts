import { useEffect, useMemo, useState } from "react";

const useGeneratedHtml = (formData: any) => {
  const [debouncedData, setDebouncedData] = useState(formData);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedData(formData), 350);
    return () => clearTimeout(handler);
  }, [formData]);

  return useMemo(() => {
    return `<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <title>${debouncedData.subject || "Bouwnce Newsletter"}</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
    body { margin:0; padding:0; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; background-color:#f3f4f6; }
    table, td { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    p { display:block; margin:0; }
    
    /* Email constraints defined by the backend's MJML */
    .email-wrapper { padding: 40px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;}
    .email-card { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06); background-color:#ffffff; max-width:600px; margin: 0 auto;}
    
    .header { background: #ff6b35; background-image: linear-gradient(135deg, #ff3b0a, #ff6a3d); padding: 26px 20px; text-align: center; }
    .header-text { font-weight: 800; letter-spacing: 3px; font-size: 18px; color: #ffffff; margin:0; }
    
    .body-section { padding: 38px 30px; background-color: #ffffff; }
    .greeting { font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 14px 0; }
    
    /* Strict word-wrap rules requested by backend */
    .content { font-size: 15px; color: #374151; line-height: 1.8; word-break: keep-all !important; overflow-wrap: break-word !important; word-wrap: break-word !important; hyphens: none !important; white-space: normal !important; }
    .content img { max-width: 100% !important; height: auto !important; }
    
    .footer { background: #fafafa; border-top: 1px solid #eee; color: #6b7280; font-size: 12px; text-align: center; padding: 28px 20px; }
    .cta-button { display: inline-block; background-color: #ff3b0a; color: #ffffff !important; text-decoration: none !important; border-radius: 8px; font-weight: 600; font-size: 13px; padding: 12px 15px; margin-bottom: 20px;}
    
    .socials-table { margin: 0 auto; width: 100%; max-width: 200px;}
    .socials-table td { padding: 16px 10px 0 10px; text-align: center; }
  </style>
</head>
<body style="background-color:#f3f4f6;">
  <div class="email-wrapper">
    <div class="email-card">
      
      <!-- HEADER -->
      <div class="header">
        <p class="header-text">BOUWNCE</p>
      </div>

      <!-- BODY -->
      <div class="body-section">
        <!-- Replaced MJML {{ user_name }} with a generic "there" for the live preview -->
        <p class="greeting">Hi there,</p>
        
        <div class="content">
          ${debouncedData.content || "Start typing your content..."}
        </div>
      </div>

      <div class="footer">
        <a href="https://bouwnce.com" class="cta-button">Visit Bouwnce</a>
        <p style="margin:0 0 10px 0; line-height: 1.5;">
          &copy; ${new Date().getFullYear()} Bouwnce. All rights reserved.<br />
          You’re receiving this because you subscribed to our updates.
        </p>
        
        <!-- SOCIALS (Converted MJML Columns to HTML Table for perfect horizontal alignment) -->
        <table class="socials-table" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td width="33%">
              <a href="https://www.instagram.com/bouwnceofficial?igsh=bjFvem92Y28wMWhl">
                <img src="https://img.icons8.com/ios-filled/50/ff3b0a/instagram-new.png" width="20" alt="Instagram" />
              </a>
            </td>
            <td width="33%">
              <a href="https://www.tiktok.com/@bouwnceofficial?_r=1&_t=ZS-961mkz2wt4H">
                <img src="https://img.icons8.com/ios-filled/50/ff3b0a/tiktok.png" width="20" alt="TikTok" />
              </a>
            </td>
            <td width="33%">
              <a href="https://www.linkedin.com/company/bouwnce-official/">
                <img src="https://img.icons8.com/ios-filled/50/ff3b0a/linkedin.png" width="20" alt="LinkedIn" />
              </a>
            </td>
          </tr>
        </table>

      </div>
    </div>
  </div>
</body>
</html>`;
  }, [debouncedData.subject, debouncedData.content]);
};

export default useGeneratedHtml;