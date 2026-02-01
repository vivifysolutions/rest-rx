"use client";

import Link from "next/link";
import Image from "next/image";
import {
  FaInstagram,
  FaTiktok,
  FaFacebookF,
  FaLinkedinIn,
  FaHeart,
  FaStethoscope,
  FaUsers,
  FaGift,
  FaLeaf,
} from "react-icons/fa";

const SOCIAL_LINKS = [
  { name: "Instagram", url: "https://instagram.com/restandrx.app", icon: FaInstagram },
  { name: "TikTok", url: "https://tiktok.com/@restandrx.app", icon: FaTiktok },
  { name: "Facebook", url: "https://www.facebook.com/profile.php?id=61581231747006", icon: FaFacebookF },
  { name: "LinkedIn", url: "https://www.linkedin.com/company/rest-and-rx/", icon: FaLinkedinIn },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Hero */}
      <section
        style={{
          minHeight: "90vh",
          background: `linear-gradient(135deg, var(--brand-cream) 0%, var(--watercolor-blue-light) 50%, var(--watercolor-cream) 100%)`,
          padding: "80px 24px 100px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 20% 80%, var(--astral-light) 0%, transparent 50%), radial-gradient(circle at 80% 20%, var(--marigold-light) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />
        <div
          className="container"
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "1.5rem",
            }}
          >
            <Image
              src="/logo.png"
              alt="Rest & Rx Logo"
              width={200}
              height={120}
              style={{ width: "auto", height: "auto", maxHeight: 140 }}
              priority
            />
            <h1
              className="font-heading"
              style={{
                fontSize: "clamp(3rem, 8vw, 5rem)",
                fontWeight: 700,
                color: "var(--downriver)",
                lineHeight: 1.1,
              }}
            >
              Rest & Rx
            </h1>
            <p
              className="font-subheading"
              style={{
                fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)",
                color: "var(--marigold)",
                maxWidth: 640,
              }}
            >
              Wellness for the healers who give their all
            </p>
            <p
              style={{
                fontSize: "clamp(1rem, 2vw, 1.2rem)",
                color: "var(--text-secondary)",
                lineHeight: 1.8,
                maxWidth: 600,
              }}
            >
              A revolutionary, first-of-its-kind, physician-backed app created to
              combat healthcare burnout. Founded by a physician who&apos;s lived
              it, we empower healthcare professionals to reclaim balance and joy
              through exclusive perks, intentional inspiration, and supportive
              community.
            </p>
            <p
              style={{
                fontSize: "1rem",
                color: "var(--marigold)",
                fontWeight: 600,
                fontStyle: "italic",
              }}
            >
              You can&apos;t care for others without caring for yourself.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", marginTop: "1rem" }}>
              <Link
                href="https://www.heydrhelene.com/healthcare-workers"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "0.875rem 2rem",
                  background: "var(--astral)",
                  color: "white",
                  borderRadius: "50px",
                  fontWeight: 600,
                  boxShadow: "0 8px 24px rgba(52,131,165,0.35)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(52,131,165,0.4)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(52,131,165,0.35)";
                }}
              >
                Join the Community
              </Link>
              <Link
                href="/partner"
                style={{
                  display: "inline-block",
                  padding: "0.875rem 2rem",
                  border: "2px solid var(--astral)",
                  color: "var(--astral)",
                  borderRadius: "50px",
                  fontWeight: 600,
                }}
              >
                Become a Partner
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What is Rest & Rx */}
      <section
        id="about"
        style={{
          padding: "100px 24px",
          background: "var(--brand-white)",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2
            className="font-heading"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "var(--downriver)",
              textAlign: "center",
              marginBottom: "1rem",
            }}
          >
            What is Rest & Rx?
          </h2>
          <p
            style={{
              fontSize: "1.15rem",
              color: "var(--text-primary)",
              lineHeight: 1.9,
              textAlign: "center",
            }}
          >
            Rest & Rx is a revolutionary, first-of-its-kind, physician-backed app
            designed to combat healthcare burnout. It empowers healthcare
            professionals to reclaim balance and joy in their demanding careers
            through curated wellness tools, exclusive discounts, uplifting
            inspiration, and a supportive community designed with them in mind.
            Founded by ER Physician Dr. Helene Okpere, Rest & Rx reimagines
            wellness through technology for the healers we all rely on.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section
        style={{
          padding: "80px 24px",
          background: "linear-gradient(180deg, var(--watercolor-blue) 0%, var(--watercolor-blue-light) 100%)",
        }}
      >
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "grid", gap: "3rem" }}>
            <div>
              <h3
                className="font-subheading"
                style={{
                  fontSize: "1.5rem",
                  color: "var(--marigold)",
                  marginBottom: "1rem",
                }}
              >
                Mission
              </h3>
              <p
                style={{
                  fontSize: "1.05rem",
                  color: "var(--text-primary)",
                  lineHeight: 1.8,
                }}
              >
                To reimagine self-care for healthcare workers and students by
                creating a first-of-its-kind one-stop platform that provides
                real and practical wellness tools, resources, and relief for
                those who continually give their all to others. By providing
                exclusive curated discounts, uplifting inspiration, and
                supportive community, Rest & Rx redefines what it means to care
                for the caregiver.
              </p>
            </div>
            <div>
              <h3
                className="font-subheading"
                style={{
                  fontSize: "1.5rem",
                  color: "var(--marigold)",
                  marginBottom: "1rem",
                }}
              >
                Vision
              </h3>
              <p
                style={{
                  fontSize: "1.05rem",
                  color: "var(--text-primary)",
                  lineHeight: 1.8,
                }}
              >
                To stand at the forefront of a global wellness revolution in
                healthcare and become the leading self-care sanctuary for
                healthcare professionals. Rest & Rx exists to shift the culture
                of medicine by proving that caring for the healer isn&apos;t
                optional, but essential.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for - Feature cards */}
      <section
        style={{
          padding: "100px 24px",
          background: "var(--watercolor-warm)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2
            className="font-heading"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "var(--downriver)",
              textAlign: "center",
              marginBottom: "1rem",
            }}
          >
            Who is it for?
          </h2>
          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              textAlign: "center",
              maxWidth: 600,
              margin: "0 auto 3rem",
              lineHeight: 1.7,
            }}
          >
            Rest & Rx is for every healthcare professional who&apos;s ever felt
            the weight of burnout, the pressure to keep pushing, and the quiet
            longing for peace.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {[
              {
                icon: FaStethoscope,
                title: "Wellness Tools",
                desc: "Curated, practical resources to support your well-being",
                color: "var(--astral)",
              },
              {
                icon: FaGift,
                title: "Exclusive Discounts",
                desc: "Perks designed for healthcare workers and students",
                color: "var(--marigold)",
              },
              {
                icon: FaLeaf,
                title: "Uplifting Inspiration",
                desc: "Daily encouragement to care for yourself",
                color: "var(--tradewind)",
              },
              {
                icon: FaUsers,
                title: "Supportive Community",
                desc: "A space built for those who pour into everyone else",
                color: "var(--downriver)",
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  padding: "2rem",
                  background: "var(--brand-white)",
                  borderRadius: "20px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
                  textAlign: "center",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.08)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.06)";
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: item.color,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                    fontSize: "1.5rem",
                  }}
                >
                  <item.icon />
                </div>
                <h4
                  className="font-subheading"
                  style={{
                    fontSize: "1.2rem",
                    color: "var(--text-primary)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {item.title}
                </h4>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
          <p
            style={{
              textAlign: "center",
              marginTop: "2rem",
              fontSize: "1.05rem",
              color: "var(--marigold)",
              fontStyle: "italic",
              fontWeight: 500,
            }}
          >
            Even those who save lives deserve space to save themselves.
          </p>
        </div>
      </section>

      {/* Founder */}
      <section
        style={{
          padding: "100px 24px",
          background: "linear-gradient(180deg, var(--brand-cream) 0%, var(--watercolor-cream) 100%)",
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2
            className="font-heading"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "var(--downriver)",
              marginBottom: "1rem",
            }}
          >
            Meet the Founder
          </h2>
          <p
            className="font-subheading"
            style={{
              fontSize: "1.3rem",
              color: "var(--marigold)",
              marginBottom: "1.5rem",
            }}
          >
            Dr. Helene Okpere
          </p>
          <p
            style={{
              fontSize: "1.05rem",
              color: "var(--text-primary)",
              lineHeight: 1.9,
            }}
          >
            Rest & Rx was founded by Dr. Helene Okpere, a board-certified
            Emergency Medicine physician, wellness advocate, and creative
            visionary on a mission to heal the healers. After her own experience
            with burnout and witnessing firsthand the toll that it takes on
            those who dedicate their lives to caring for others, Dr. Okpere set
            out to create a space where healthcare professionals and students
            could rediscover balance, joy, and purpose, both inside and outside
            the hospital walls.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "100px 24px",
          background: `linear-gradient(135deg, var(--astral) 0%, var(--downriver) 100%)`,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2
            className="font-heading"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "white",
              marginBottom: "1rem",
            }}
          >
            Ready to reclaim your balance?
          </h2>
          <p
            style={{
              fontSize: "1.1rem",
              color: "rgba(255,255,255,0.9)",
              lineHeight: 1.7,
              marginBottom: "2rem",
            }}
          >
            Join the community of healthcare professionals who are choosing to
            care for themselves as much as they care for others.
          </p>
          <Link
            href="https://www.heydrhelene.com/healthcare-workers"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "1rem 2.5rem",
              background: "white",
              color: "var(--downriver)",
              borderRadius: "50px",
              fontWeight: 700,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "3rem 24px 2rem",
          background: "var(--downriver)",
          color: "var(--watercolor-warm)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            justifyContent: "center",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          {SOCIAL_LINKS.map(({ name, url, icon: Icon }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                color: "white",
                fontSize: "1.2rem",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.25)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.15)";
              }}
            >
              <Icon />
            </a>
          ))}
        </div>
        <p style={{ fontSize: "0.9rem", opacity: 0.9 }}>
          © {new Date().getFullYear()} Rest & Rx. Made with{" "}
          <FaHeart style={{ color: "var(--marigold)", display: "inline" }} /> for
          healthcare heroes.
        </p>
      </footer>
    </div>
  );
}
