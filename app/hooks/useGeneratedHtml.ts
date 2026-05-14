import { useEffect, useMemo, useState } from "react";

const useGeneratedHtml = (formData: any) => {
  const [debouncedData, setDebouncedData] = useState(formData);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedData(formData), 350);
    return () => clearTimeout(handler);
  }, [formData]);

  return useMemo(() => {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
        Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
    }

    .email-wrapper {
      padding: 40px 14px;
    }

    .email-container {
      max-width: 640px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      box-shadow: 0 12px 40px rgba(0,0,0,0.06);
    }

    .header {
      background: linear-gradient(135deg, #ff3b0a, #ff6a3d);
      padding: 26px 20px;
      text-align: center;
      color: #fff;
      font-weight: 800;
      letter-spacing: 3px;
      font-size: 18px;
    }

    .body {
      padding: 38px 30px;
      font-size: 15px;
      line-height: 1.8;
      color: #374151;
    }

    .subject {
      font-size: 10px;
      letter-spacing: 1.6px;
      text-transform: uppercase;
      color: #9ca3af;
      border-bottom: 1px solid #f0f0f0;
      padding-bottom: 10px;
      margin-bottom: 18px;
    }

    .greeting {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 18px;
      color: #111827;
    }

    /* FIXED CONTENT WRAPPING */
    .content {
      font-size: 15px;
      color: #374151;
      line-height: 1.8;

      white-space: normal;
      word-break: normal;
      overflow-wrap: break-word;
      -webkit-font-smoothing: antialiased;
    }

    .content p,
    .content span,
    .content div {
      margin: 0 0 16px;
      white-space: normal;
      word-break: normal;
      overflow-wrap: break-word;
    }

    .content h1,
    .content h2,
    .content h3 {
      margin: 20px 0 10px;
      line-height: 1.3;
      color: #111827;
    }

    .content a {
      color: #ff3b0a;
      text-decoration: none;
      font-weight: 500;
    }

    .content a:hover {
      text-decoration: underline;
    }

    .footer {
      background: #fafafa;
      padding: 28px 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #eee;
    }

    .socials {
      margin-top: 16px;
    }

    .socials img {
      width: 20px;
      height: 20px;
      margin: 0 8px;
      opacity: 0.75;
      transition: 0.2s ease;
    }

    .socials img:hover {
      opacity: 1;
      transform: translateY(-2px);
    }

    /* MOBILE */
    @media (max-width: 600px) {
      .body {
        padding: 24px 18px;
      }
    }

    /* DARK MODE */
    @media (prefers-color-scheme: dark) {
      body {
        background: #0b0f19;
        color: #e5e7eb;
      }

      .email-container {
        background: #111827;
        border-color: #1f2937;
      }

      .body {
        color: #e5e7eb;
      }

      .subject {
        color: #9ca3af;
        border-bottom: 1px solid #1f2937;
      }

      .greeting {
        color: #f3f4f6;
      }

      .content {
        color: #e5e7eb;
      }

      .ql-align-center {
  text-align: center;
}

.ql-align-right {
  text-align: right;
}

.ql-align-justify {
  text-align: justify;
}

      .content a {
        color: #fb7a4a;
      }

      .footer {
        background: #0f172a;
        color: #9ca3af;
        border-top: 1px solid #1f2937;
      }
    }
  </style>
</head>

<body>
  <div class="email-wrapper">
    <div class="email-container">

      <div class="header">BOUWNCE</div>

      <div class="body">

        <div class="subject">
          SUBJECT · ${debouncedData.subject || "No Subject"}
        </div>

        <div class="greeting">
          Hi there,
        </div>

        <div class="content">
          ${debouncedData.content || "Start typing your content..."}
        </div>

      </div>

      <div class="footer">
        <div style="text-align:center;">
          <a href="https://bouwnce.com"
             style="
              display:inline-block;
              padding:12px 15px;
              margin-bottom:10px;
              background:#ff3b0a;
              color:#fff;
              text-decoration:none;
              border-radius:8px;
              font-weight:600;
              font-size:13px;
              letter-spacing:0.5px;
             ">
            Visit Bouwnce
          </a>
        </div>

        © ${new Date().getFullYear()} Bouwnce. All rights reserved.<br/>
        You’re receiving this because you subscribed to our updates.

        <div class="socials">
          <a href="https://www.instagram.com/bouwnceofficial?igsh=bjFvem92Y28wMWhl">
            <img src="https://img.icons8.com/ios-filled/50/ff3b0a/instagram-new.png"/>
          </a>

          <a href="https://www.tiktok.com/@bouwnceofficial?_r=1&_t=ZS-961mkz2wt4H">
            <img src="https://img.icons8.com/ios-filled/50/ff3b0a/tiktok.png"/>
          </a>

          <a href="https://www.linkedin.com/company/bouwnce-official/">
            <img src="https://img.icons8.com/ios-filled/50/ff3b0a/linkedin.png"/>
          </a>
        </div>
      </div>

    </div>
  </div>
</body>
</html>`;
  }, [debouncedData.subject, debouncedData.content]);
};

export default useGeneratedHtml;
