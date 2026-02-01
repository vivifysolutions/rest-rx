"use client";

import Link from "next/link";
import Script from "next/script";

export default function PartnerPage() {
  return (
    <div style={{ minHeight: "100vh", padding: "80px 24px 100px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            display: "inline-block",
            marginBottom: "2rem",
            color: "var(--astral)",
            fontWeight: 600,
          }}
        >
          ← Back to Home
        </Link>
        <h1
          className="font-heading"
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            color: "var(--downriver)",
            marginBottom: "0.5rem",
          }}
        >
          Become a Partner
        </h1>
        <p
          style={{
            fontSize: "1.1rem",
            color: "var(--text-secondary)",
            marginBottom: "2rem",
          }}
        >
          Interested in partnering with Rest & Rx? We&apos;d love to hear from you.
        </p>
        <div className="hb-p-68c5123df5125100077726de-2" />
        <img
          height={1}
          width={1}
          alt=""
          style={{ display: "none" }}
          src="https://www.honeybook.com/p.png?pid=68c5123df5125100077726de"
        />
      </div>
      <Script id="honeybook" strategy="afterInteractive">
        {`(function(h,b,s,n,i,p,e,t) {
          h._HB_ = h._HB_ || {};h._HB_.pid = i;
          t=b.createElement(s);t.type="text/javascript";t.async=!0;t.src=n;
          e=b.getElementsByTagName(s)[0];e.parentNode.insertBefore(t,e);
        })(window,document,"script","https://widget.honeybook.com/assets_users_production/websiteplacements/placement-controller.min.js","68c5123df5125100077726de");`}
      </Script>
    </div>
  );
}
