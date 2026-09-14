"use client";

import Image from "next/image";
import Link from "@/components/ui/Link";
import { FormEvent, useState } from "react";

import Icon from "@/components/icon/Icon";
import CtaButton from "@/components/ui/CtaButton";

type ContactTab = "support" | "partnerships";

const FIELD_CLASS =
  "h-11 w-full rounded-xl border border-white/[0.04] bg-white/[0.04] px-4 " +
  "text-[14px] leading-5 text-[#f7f7f7] outline-none placeholder:text-white/75 " +
  "transition-colors focus:border-white/20";

const CONTACT_CONTENT: Record<
  ContactTab,
  {
    heading: string;
    cardTitle: string;
    cardSubtitle: string;
    nodeId: string;
  }
> = {
  support: {
    heading: "Support",
    cardTitle: "Talk to support",
    cardSubtitle: "Tell us what's going on and we'll get you sorted.",
    nodeId: "2152:18938",
  },
  partnerships: {
    heading: "Our Team",
    cardTitle: "Partner with us",
    cardSubtitle: "Tell us about your team and what you have in mind.",
    nodeId: "2152:19438",
  },
};

function ContactTabSwitch({
  activeTab,
  onChange,
}: {
  activeTab: ContactTab;
  onChange: (tab: ContactTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Contact type"
      className="relative inline-flex items-center rounded-full border border-[#2d2b2c]/10 bg-white p-1.5 shadow-[inset_0_-1.25px_0_rgba(47,43,67,0.1)]"
    >
      {(["support", "partnerships"] as const).map((tab) => {
        const active = activeTab === tab;
        const label = tab === "support" ? "Support" : "Partnerships";

        return (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`contact-tab-${tab}`}
            aria-controls="contact-tab-panel"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab)}
            className={[
              "relative inline-flex h-11 items-center justify-center rounded-full px-4 text-[18px] leading-6",
              "transition-[background,color,box-shadow] duration-200 focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-gop-gold focus-visible:ring-offset-2",
              active
                ? "border border-white/24 bg-[#242223] text-[#f7f7f7] shadow-[0_0_0_1px_#000]"
                : "text-[#4f4e4f] hover:bg-[#242223]/[0.04]",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ContactField({
  name,
  placeholder,
  type = "text",
}: {
  name: string;
  placeholder: string;
  type?: "text" | "email";
}) {
  return (
    <input
      className={FIELD_CLASS}
      type={type}
      name={name}
      placeholder={placeholder}
      aria-label={placeholder}
    />
  );
}

/** Where each tab's message is delivered. */
const CONTACT_RECIPIENT: Record<ContactTab, string> = {
  support: "info@godofprompt.ai",
  partnerships: "partner@godofprompt.ai",
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function ContactFormCard({ activeTab }: { activeTab: ContactTab }) {
  const content = CONTACT_CONTENT[activeTab];
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const firstName = String(data.get("firstName") ?? "").trim();
    const lastName = String(data.get("lastName") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const agreed = data.get("terms") != null;

    if (!firstName || !email || !message) {
      setError("Please add your name, email, and a message.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms of Use & Privacy Policy.");
      return;
    }
    setError(null);

    const to = CONTACT_RECIPIENT[activeTab];
    const name = `${firstName} ${lastName}`.trim();
    const subject =
      activeTab === "support"
        ? `Support request from ${name}`
        : `Partnership enquiry from ${name}`;
    const body = `${message}\n\n— ${name}\n${email}`;

    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSentTo(to);
  };

  return (
    <section
      aria-labelledby="contact-form-title"
      className={[
        "relative flex w-full flex-col items-center gap-6 overflow-hidden rounded-3xl px-12 py-6",
        "bg-gradient-to-b from-[#343333] to-[#242223] text-[#f7f7f7]",
        "shadow-[0_1px_2px_rgba(0,0,0,0.07),0_2px_4px_rgba(0,0,0,0.07),0_4px_8px_rgba(0,0,0,0.07),0_8px_16px_rgba(0,0,0,0.07),0_16px_32px_rgba(0,0,0,0.07),0_32px_64px_rgba(0,0,0,0.07)]",
        "max-[640px]:px-5",
      ].join(" ")}
    >
      <div className="flex w-full flex-col items-center gap-3 text-center">
        <Image
          src="/images/brand/face.svg"
          alt=""
          width={49}
          height={71}
          className="h-[71px] w-[49px]"
        />
        <div className="flex flex-col items-center gap-2">
          <h2
            id="contact-form-title"
            className="m-0 text-[24px] font-medium leading-7 tracking-[-0.5px]"
          >
            {content.cardTitle}
          </h2>
          <p className="m-0 text-[16px] leading-6 tracking-[-0.5px] text-white/75">
            {content.cardSubtitle}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-5">
        {activeTab === "support" && (
          <div className="flex h-5 w-full items-center gap-3">
            <span className="h-px min-w-0 flex-1 bg-white/12" />
            <span className="text-[14px] leading-5 text-[#a8a7a8]">Enter the details</span>
            <span className="h-px min-w-0 flex-1 bg-white/12" />
          </div>
        )}

        <div className="flex w-full flex-col gap-5">
          <div className="flex gap-2 max-[480px]:flex-col max-[480px]:gap-5">
            <ContactField name="firstName" placeholder="First name" />
            <ContactField name="lastName" placeholder="Last name" />
          </div>
          <ContactField name="email" placeholder="Email Address" type="email" />
          <textarea
            name="message"
            aria-label="Message"
            placeholder="Message"
            className={[FIELD_CLASS, "block h-24 resize-none py-4"].join(" ")}
          />
        </div>

        <label className="relative flex w-full cursor-pointer items-center gap-2.5 text-[16px] leading-6 text-[#a8a7a8]">
          <input
            type="checkbox"
            name="terms"
            defaultChecked
            className="peer size-[19px] shrink-0 appearance-none rounded-[5px] border border-[#6f6e6f] bg-[#6f6e6f] outline-none focus-visible:ring-2 focus-visible:ring-gop-gold"
          />
          <span className="pointer-events-none absolute left-[3.5px] top-[6px] inline-flex opacity-0 peer-checked:opacity-100">
            <Icon name="check" size={12} className="text-[#f7f7f7]" />
          </span>
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-[#f7f7f7] no-underline hover:underline">
              Terms of Use
            </Link>
            {" & "}
            <Link
              href="/privacy-policy"
              className="text-[#f7f7f7] no-underline hover:underline"
            >
              Privacy policy
            </Link>
          </span>
        </label>

        <CtaButton
          type="submit"
          variant="gold"
          size="md"
          className="w-full !text-[18px] !font-normal"
        >
          Submit
        </CtaButton>

        {error && (
          <p role="alert" className="m-0 w-full text-center text-[13px] leading-5 text-[#fc4a4a]">
            {error}
          </p>
        )}
        {sentTo && !error && (
          <p className="m-0 w-full text-center text-[13px] leading-5 text-white/75">
            Opening your email app to <span className="text-[#f7f7f7]">{sentTo}</span>… if nothing
            happens, email us there directly.
          </p>
        )}
      </form>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_4px_32px_rgba(222,222,222,0.12)]"
      />
    </section>
  );
}

function CompanyDetails() {
  return (
    <section
      aria-labelledby="company-details-title"
      className="flex w-full flex-col gap-6 overflow-hidden rounded-[18px] px-4 py-5 text-[#a8a7a8]"
    >
      <h2
        id="company-details-title"
        className="m-0 text-[20px] font-medium leading-6 tracking-[-0.5px] text-[#1b1a1a]"
      >
        God of Prompt provides AI automation and prompt engineering tools.
      </h2>

      <div className="h-px w-full bg-[#2d2b2c]/10" />

      <div className="flex flex-col gap-2 text-[16px] leading-6">
        <p className="m-0">Company details</p>
        <address className="not-italic">
          GOD OF PROMPT OÜ
          <br />
          Sepapaja tn 6, Lasnamäe linnaosa,
          <br />
          Tallinn, Harju maakond, 15551
          <br />
          Estonia
          <br />
          <br />
          VAT: EE102805158
        </address>
      </div>

      <div className="h-px w-full bg-[#2d2b2c]/10" />

      <div className="grid grid-cols-[1fr_auto_1fr] gap-8 text-[16px] leading-6 max-[560px]:grid-cols-1 max-[560px]:gap-5">
        <div className="flex flex-col gap-2">
          <p className="m-0">Location</p>
          <p className="m-0">Based in Tallinn, Estonia</p>
        </div>
        <div className="w-px self-stretch bg-[#2d2b2c]/10 max-[560px]:h-px max-[560px]:w-full" />
        <div className="flex flex-col gap-2">
          <p className="m-0">Email</p>
          <div>
            <a
              href="mailto:info@godofprompt.ai"
              className="text-[#a8a7a8] no-underline hover:text-[#4f4e4f]"
            >
              info@godofprompt.ai
            </a>
            <p className="m-0">Mon-Fri, 9AM - 10PM (GMT)</p>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-[#2d2b2c]/10" />
    </section>
  );
}

export default function ContactTabs() {
  const [activeTab, setActiveTab] = useState<ContactTab>("support");
  const content = CONTACT_CONTENT[activeTab];

  return (
    <section
      data-figma-node={content.nodeId}
      className="mx-auto flex w-full max-w-[629px] flex-col items-center px-5 pb-[300px] pt-20 max-[640px]:pb-28 max-[640px]:pt-14"
    >
      <header className="mb-6 flex flex-col items-center text-center">
        <h1 className="m-0 flex items-center justify-center gap-3 max-[640px]:gap-2">
          <span className="text-[56px] font-light leading-[80px] tracking-[-1.5px] text-[#2d2b2c] max-[640px]:text-[40px] max-[640px]:leading-12">
            Contact
          </span>
          <span className="bg-gradient-to-b from-[#4b4949] to-[#1b1a1a] bg-clip-text text-[56px] font-bold italic leading-[80px] tracking-[-2px] text-transparent [text-shadow:0_3px_8px_rgba(0,0,0,0.24)] max-[640px]:text-[40px] max-[640px]:leading-12">
            {content.heading}
          </span>
        </h1>
        <p className="m-0 text-[18px] leading-6 text-[#4f4e4f]">
          We respond in up to 3 business days.
        </p>
      </header>

      <div className="flex w-full flex-col items-center gap-6">
        <ContactTabSwitch activeTab={activeTab} onChange={setActiveTab} />
        <div
          id="contact-tab-panel"
          role="tabpanel"
          aria-labelledby={`contact-tab-${activeTab}`}
          className="flex w-full flex-col items-center gap-6"
        >
          <ContactFormCard key={activeTab} activeTab={activeTab} />
          <CompanyDetails />
        </div>
      </div>
    </section>
  );
}
