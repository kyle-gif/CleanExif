import React from 'react';
import { Shield, FileText, Mail, ArrowLeft } from 'lucide-react';

const CONTACT_EMAIL = 'ryuhskyle@gmail.com';
const LAST_UPDATED = 'June 18, 2026';

const PageShell = ({ icon: Icon, title, subtitle, onBack, children }) => (
  <div className="max-w-3xl mx-auto w-full flex flex-col gap-8 py-4">
    {onBack && (
      <button onClick={onBack} className="self-start inline-flex items-center gap-2 text-sm text-leica-lightgray hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to the tool
      </button>
    )}
    <div className="flex flex-col gap-3">
      <div className="w-12 h-12 rounded-full bg-leica-darkgray border border-leica-gray flex items-center justify-center">
        <Icon className="text-leica-red" size={22} />
      </div>
      <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{title}</h1>
      {subtitle && <p className="text-leica-lightgray">{subtitle}</p>}
      <p className="text-xs text-gray-500">Last updated: {LAST_UPDATED}</p>
    </div>
    <div className="prose-leica flex flex-col gap-6 text-gray-300 leading-relaxed">
      {children}
    </div>
  </div>
);

const H = ({ children }) => <h2 className="text-xl font-bold text-white mt-2">{children}</h2>;

export const PrivacyPolicy = ({ onBack }) => (
  <PageShell
    icon={Shield}
    title="Privacy Policy"
    subtitle="How CleanExif handles your data — the short version: your photos never leave your device."
    onBack={onBack}
  >
    <section className="flex flex-col gap-2">
      <H>1. Image Processing Is Local</H>
      <p>
        CleanExif is a client-side application. When you open a photo, all metadata reading, EXIF
        removal, and pixel editing happen entirely inside your own web browser using standard Web APIs.
        Your images are <strong>never uploaded to, transmitted to, or stored on any server</strong> we operate.
        Closing or refreshing the tab permanently clears any image you were working on.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <H>2. Information We Do Not Collect</H>
      <p>
        We do not require accounts, and we do not collect your name, email, photos, or file contents.
        We do not sell or rent personal information, because we do not collect it in the first place.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <H>3. Cookies &amp; Advertising</H>
      <p>
        This site is supported by advertising served through Google AdSense. Third-party vendors,
        including Google, use cookies to serve ads based on a user's prior visits to this and other
        websites.
      </p>
      <ul className="list-disc pl-6 flex flex-col gap-2">
        <li>
          Google's use of advertising cookies enables it and its partners to serve ads based on your
          visit to this site and/or other sites on the Internet.
        </li>
        <li>
          You may opt out of personalized advertising by visiting{' '}
          <a className="text-leica-red hover:underline" href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer">Google Ads Settings</a>.
        </li>
        <li>
          For more options to opt out of third-party vendors' use of cookies for personalized
          advertising, visit{' '}
          <a className="text-leica-red hover:underline" href="https://www.aboutads.info/choices/" target="_blank" rel="noreferrer">www.aboutads.info/choices</a>.
        </li>
      </ul>
    </section>

    <section className="flex flex-col gap-2">
      <H>4. Third-Party Services</H>
      <p>
        When you use the “View EXIF” feature on a photo that contains GPS coordinates, those
        coordinates may be sent to the OpenStreetMap Nominatim service solely to display a
        human-readable place name. No image data is sent — only the latitude and longitude already
        embedded in your file, and only when you choose to view that tab.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <H>5. Children's Privacy</H>
      <p>
        CleanExif is a general-audience tool and is not directed to children under the age of 13.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <H>6. Changes &amp; Contact</H>
      <p>
        We may update this policy from time to time; material changes will be reflected by the
        “Last updated” date above. Questions about privacy can be sent to{' '}
        <a className="text-leica-red hover:underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </section>
  </PageShell>
);

export const TermsOfService = ({ onBack }) => (
  <PageShell
    icon={FileText}
    title="Terms of Service"
    subtitle="The basic terms for using CleanExif."
    onBack={onBack}
  >
    <section className="flex flex-col gap-2">
      <H>1. Acceptance</H>
      <p>
        By accessing or using CleanExif, you agree to these Terms of Service. If you do not agree,
        please discontinue use of the site.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <H>2. The Service</H>
      <p>
        CleanExif provides free, browser-based tools to view, remove, and edit image metadata and to
        apply basic photo adjustments. All processing occurs locally in your browser.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <H>3. Acceptable Use</H>
      <p>
        You agree to use CleanExif only with images you own or are authorized to modify, and not for
        any unlawful purpose. You are solely responsible for the files you process and the results you
        download.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <H>4. No Warranty</H>
      <p>
        The service is provided “as is” without warranties of any kind. While we strive for accurate
        metadata removal, we cannot guarantee that every metadata field in every file format is
        removed. Always verify sensitive images before sharing them publicly.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <H>5. Limitation of Liability</H>
      <p>
        To the maximum extent permitted by law, CleanExif and its operators are not liable for any
        damages arising from the use of, or inability to use, this service.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <H>6. Contact</H>
      <p>
        For questions about these terms, contact{' '}
        <a className="text-leica-red hover:underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </section>
  </PageShell>
);

export const AboutContact = ({ onBack }) => (
  <PageShell
    icon={Mail}
    title="About &amp; Contact"
    subtitle="What CleanExif is, who it's for, and how to reach us."
    onBack={onBack}
  >
    <section className="flex flex-col gap-2">
      <H>About CleanExif</H>
      <p>
        CleanExif is a free, privacy-first tool for managing the hidden metadata inside your photos.
        Every photo you take stores invisible EXIF data — camera model, timestamps, and often the
        exact GPS coordinates where the picture was taken. Before you share an image online, CleanExif
        lets you inspect that data, strip it out, or edit it, all without your file ever leaving your
        device.
      </p>
      <p>
        The tool runs entirely in your browser, which means it works offline, processes images
        instantly, and keeps your photos completely private. It's built for anyone who shares photos
        publicly and wants to control their digital footprint — from everyday social media users to
        journalists, activists, and professional photographers.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <H>What You Can Do</H>
      <ul className="list-disc pl-6 flex flex-col gap-2">
        <li><strong>View EXIF:</strong> Reveal the camera, exposure, date, and GPS data hidden in any photo.</li>
        <li><strong>Wipe EXIF:</strong> Remove all metadata from JPEG files with a single click.</li>
        <li><strong>Photo Editor:</strong> Apply color grading and adjustments locally.</li>
      </ul>
    </section>

    <section className="flex flex-col gap-2">
      <H>Contact Us</H>
      <p>
        We'd love your feedback, bug reports, and feature requests. Reach us anytime at{' '}
        <a className="text-leica-red hover:underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </section>
  </PageShell>
);
