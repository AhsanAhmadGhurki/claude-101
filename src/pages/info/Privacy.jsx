import { InfoLayout, InfoSection } from "./InfoLayout";

export function PrivacyPage() {
  return (
    <InfoLayout
      eyebrow="Legal"
      title="Privacy Policy"
      icon="mdi:shield-lock-outline"
      intro="We keep this short and human. Adventure.AI is a trip-planning tool — we ask for as little as possible to make it work, and we never sell your data."
    >
      <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle mb-8">
        Last updated · {new Date().getFullYear()}
      </p>

      <InfoSection title="What we collect">
        <p>
          When you use Adventure.AI, we may collect the trip prompts you type
          into the planner, the destinations you save, and basic device info
          (browser, screen size) for analytics. If you subscribe to Trail Notes,
          we collect your email address.
        </p>
        <p>We do not collect your name, address, or payment details.</p>
      </InfoSection>

      <InfoSection title="How we use it">
        <ul className="list-disc pl-5 space-y-2">
          <li>Generate itineraries that match what you asked for.</li>
          <li>
            Improve the suggestions our AI returns — anonymized and aggregated.
          </li>
          <li>
            Send the occasional Trail Notes email if you subscribed (one-click
            unsubscribe in every email).
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="What we share">
        <p>
          We share data with two categories of third parties: hosting providers
          (so the site loads) and our AI provider (to generate itineraries). We
          do not sell your data to advertisers.
        </p>
      </InfoSection>

      <InfoSection title="Cookies & local storage">
        <p>
          We use browser local storage to remember your saved trips and theme
          preference. We use a single privacy-friendly analytics cookie to count
          page visits — no cross-site tracking.
        </p>
      </InfoSection>

      <InfoSection title="Your rights">
        <p>
          You can clear your saved trips from your browser at any time. To
          remove your email from Trail Notes, click the unsubscribe link in any
          email or write to us at the address below.
        </p>
      </InfoSection>

      <InfoSection title="Children">
        <p>
          Adventure.AI is not directed at children under 13. We don't knowingly
          collect data from children.
        </p>
      </InfoSection>

      <InfoSection title="Contact">
        <p>
          Questions about your data? Reach us at{" "}
          <a
            href="mailto:hello@adventure.ai"
            className="text-accent hover:underline"
          >
            hello@adventure.ai
          </a>
          .
        </p>
      </InfoSection>
    </InfoLayout>
  );
}
