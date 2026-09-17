import { useEffect, useMemo, useState } from "react";

interface FormData {
  subject?: string;
  content?: string;
}

const useGeneratedHtml = (formData: FormData) => {
  const [debouncedData, setDebouncedData] = useState(formData);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedData(formData);
    }, 350);

    return () => clearTimeout(handler);
  }, [formData]);

  return useMemo(() => {
    return `<!doctype html>
<html
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
<head>
  <title>${debouncedData.subject || "Bouwnce Newsletter"}</title>

  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
  >

  <style type="text/css">

    /* =====================================================
       GLOBAL RESET
    ===================================================== */

    *,
    *:before,
    *:after {
      box-sizing: border-box !important;
    }

    html {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
    }

    body {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;

      margin: 0 !important;
      padding: 0 !important;

      background-color: #f3f4f6;

      overflow-x: hidden !important;

      -webkit-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
    }

    table,
    td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      border: 0;
      height: auto;
      max-width: 100%;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    a {
      text-decoration: none;
    }


    /* =====================================================
       EMAIL WRAPPER
    ===================================================== */

    .email-wrapper {
      width: 100% !important;
      max-width: 100% !important;

      margin: 0 auto !important;
      padding: 12px 8px !important;

      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Helvetica,
        Arial,
        sans-serif;

      box-sizing: border-box !important;

      overflow-x: hidden !important;
    }


    /* =====================================================
       EMAIL CARD
    ===================================================== */

    .email-card {
      width: 100% !important;
      max-width: 600px !important;

      margin: 0 auto !important;

      background-color: #ffffff;

      border: 1px solid #e5e7eb;
      border-radius: 10px;

      overflow: hidden;

      box-sizing: border-box !important;

      box-shadow:
        0 12px 40px rgba(0, 0, 0, 0.06);
    }


    /* =====================================================
       HEADER
    ===================================================== */

    .header {
      width: 100% !important;

      padding: 20px 16px;

      text-align: center;

      background-color: #ff6b35;

      background-image:
        linear-gradient(
          135deg,
          #ff3b0a,
          #ff6a3d
        );

      box-sizing: border-box !important;
    }

    .header-text {
      margin: 0;

      color: #ffffff;

      font-size: 18px;
      font-weight: 800;

      line-height: 1.2;

      letter-spacing: 3px;

      text-align: center;
    }


    /* =====================================================
       BODY
    ===================================================== */

    .body-section {
      width: 100% !important;
      max-width: 100% !important;

      padding: 24px 16px !important;

      background-color: #ffffff;

      box-sizing: border-box !important;

      overflow: hidden !important;
    }


    /* =====================================================
       GREETING
    ===================================================== */

    .greeting {
      margin: 0 0 16px 0 !important;

      color: #111827;

      font-size: 16px;
      font-weight: 600;

      line-height: 1.5;

      max-width: 100% !important;

      box-sizing: border-box !important;
    }


    /* =====================================================
       CONTENT
       
       IMPORTANT:
       word-break: normal prevents normal words from being
       split like:
       
       somethin
       g
       
       overflow-wrap: anywhere is NOT used here because
       normal text should remain intact.
    ===================================================== */

    .content {
      width: 100% !important;
      max-width: 100% !important;

      margin: 0 !important;
      padding: 0 !important;

      color: #374151;

      font-size: 15px;

      line-height: 1.8;

      text-align: left;

      white-space: normal !important;

      /*
       * Allows very long unbroken strings/URLs to wrap,
       * while normal words remain intact.
       */
      overflow-wrap: break-word !important;

      word-break: normal !important;

      box-sizing: border-box !important;

      overflow-x: hidden !important;
    }


    /* =====================================================
       CONTENT BLOCKS
    ===================================================== */

    .content p,
    .content div {
      width: 100% !important;
      max-width: 100% !important;

      margin: 0 0 16px 0 !important;
      padding: 0 !important;

      color: inherit;

      font-size: inherit;

      line-height: 1.8 !important;

      white-space: normal !important;

      overflow-wrap: break-word !important;

      word-break: normal !important;

      box-sizing: border-box !important;
    }


    /* =====================================================
       INLINE ELEMENTS
    ===================================================== */

    .content span,
    .content strong,
    .content em {
      max-width: 100% !important;

      white-space: normal !important;

      overflow-wrap: break-word !important;

      word-break: normal !important;
    }


    /* =====================================================
       LINKS
       
       URLs can be extremely long, so links are allowed to
       break anywhere when necessary.
    ===================================================== */

    .content a {
      max-width: 100% !important;

      white-space: normal !important;

      overflow-wrap: anywhere !important;

      word-break: normal !important;

      color: inherit;
    }


    /* =====================================================
       EMPTY QUILL PARAGRAPHS
    ===================================================== */

    .content p:empty {
      min-height: 1.8em;

      display: block;
    }

    .content p > br:only-child {
      min-height: 1.8em;

      display: block;
    }


    /* =====================================================
       QUILL ALIGNMENT
    ===================================================== */

    .content .ql-align-center {
      text-align: center !important;
    }

    .content .ql-align-right {
      text-align: right !important;
    }

    .content .ql-align-justify {
      text-align: justify !important;
    }

    .content .ql-align-left {
      text-align: left !important;
    }


    /* =====================================================
       IMAGES FROM QUILL
    ===================================================== */

    .content img {
      display: inline-block;

      max-width: 100% !important;

      width: auto;

      height: auto !important;

      box-sizing: border-box !important;
    }


    /* =====================================================
       FOOTER
    ===================================================== */

    .footer {
      width: 100% !important;
      max-width: 100% !important;

      background-color: #fafafa;

      border-top: 1px solid #eeeeee;

      color: #6b7280;

      font-size: 12px;

      line-height: 1.5;

      text-align: center;

      padding: 24px 16px;

      box-sizing: border-box !important;
    }


    /* =====================================================
       CTA BUTTON
    ===================================================== */

    .cta-button {
      display: inline-block;

      background-color: #ff3b0a;

      color: #ffffff !important;

      text-decoration: none !important;

      border-radius: 8px;

      font-size: 13px;

      font-weight: 600;

      line-height: 1.2;

      padding: 12px 15px;

      margin-bottom: 20px;

      box-sizing: border-box !important;
    }


    /* =====================================================
       SOCIAL ICONS
    ===================================================== */

    .socials-table {
      width: 100% !important;
      max-width: 200px !important;

      margin: 0 auto !important;

      table-layout: fixed;

      box-sizing: border-box !important;
    }

    .socials-table td {
      width: 33.333%;

      padding: 16px 10px 0 10px;

      text-align: center;

      vertical-align: middle;
    }

    .socials-table img {
      display: inline-block;

      width: 20px;

      max-width: 20px !important;

      height: auto;
    }


    /* =====================================================
       MOBILE
    ===================================================== */

    @media only screen and (max-width: 480px) {

      .email-wrapper {
        padding: 8px 4px !important;
      }

      .email-card {
        width: 100% !important;

        max-width: 100% !important;

        border-radius: 8px;
      }

      .header {
        padding: 18px 12px !important;
      }

      .header-text {
        font-size: 17px !important;
      }

      .body-section {
        padding: 22px 16px !important;
      }

      .content {
        font-size: 15px !important;

        line-height: 1.8 !important;
      }

      .content p,
      .content div {
        line-height: 1.8 !important;
      }

      .footer {
        padding: 22px 12px !important;
      }
    }

  </style>
</head>


<body>

  <div class="email-wrapper">

    <div class="email-card">


      <!-- HEADER -->

      <div class="header">

        <p class="header-text">
          BOUWNCE
        </p>

      </div>


      <!-- BODY -->

      <div class="body-section">

        <p class="greeting">
          Hi there,
        </p>

        <div class="content">
          ${
            debouncedData.content ||
            "Start typing your content..."
          }
        </div>

      </div>


      <!-- FOOTER -->

      <div class="footer">

        <a
          href="https://bouwnce.com"
          class="cta-button"
        >
          Visit Bouwnce
        </a>


        <p
          style="
            margin: 0 0 10px 0;
            line-height: 1.5;
          "
        >
          &copy; ${new Date().getFullYear()} Bouwnce.
          All rights reserved.<br />

          You’re receiving this because you subscribed
          to our updates.
        </p>


        <table
          class="socials-table"
          border="0"
          cellpadding="0"
          cellspacing="0"
          role="presentation"
        >

          <tr>

            <td width="33%">

              <a
                href="https://www.instagram.com/bouwnceofficial?igsh=bjFvem92Y28wMWhl"
              >

                <img
                  src="https://img.icons8.com/ios-filled/50/ff3b0a/instagram-new.png"
                  width="20"
                  alt="Instagram"
                />

              </a>

            </td>


            <td width="33%">

              <a
                href="https://www.tiktok.com/@bouwnceofficial?_r=1&_t=ZS-961mkz2wt4H"
              >

                <img
                  src="https://img.icons8.com/ios-filled/50/ff3b0a/tiktok.png"
                  width="20"
                  alt="TikTok"
                />

              </a>

            </td>


            <td width="33%">

              <a
                href="https://www.linkedin.com/company/bouwnce-official/"
              >

                <img
                  src="https://img.icons8.com/ios-filled/50/ff3b0a/linkedin.png"
                  width="20"
                  alt="LinkedIn"
                />

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
