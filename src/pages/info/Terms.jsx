import { InfoLayout, InfoSection } from "./InfoLayout";

export function TermsPage() {
  return (
    <InfoLayout
      eyebrow="Legal"
      title="Terms of Service"
      icon="mdi:file-document-outline"
      intro="By using Adventure.AI you agree to these terms. They're written plainly so you can actually read them."
    >
      <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle mb-8">
        Last updated · {new Date().getFullYear()}
      </p>

      <InfoSection title="The short version">
        <ul className="list-disc pl-5 space-y-2">
          <li>Adventure.AI is a trip-planning tool, not a booking agent.</li>
          <li>
            Itineraries are AI-generated suggestions — verify operating hours,
            road conditions, and permits before you go.
          </li>
          <li>Don't abuse the service or use it to harm others.</li>
          <li>We can change these terms; we'll note the date above.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Use of the service">
        <p>
          You can use Adventure.AI to generate, save, and share trip ideas for
          personal travel planning. You're responsible for the choices you make
          on the trail — weather, terrain, and logistics change quickly in the
          mountains.
        </p>
      </InfoSection>

      <InfoSection title="AI-generated content">
        <p>
          Itineraries, packing suggestions, and tips are produced by an AI model
          using publicly available information. We work hard to keep them
          accurate, but we can't guarantee every detail is current. Always
          cross-check critical info (visas, permits, road closures) with
          official sources.
        </p>
      </InfoSection>

      <InfoSection title="Acceptable use">
        <p>
          Don't use Adventure.AI to scrape data, run automated abuse, generate
          content for illegal activity, or attempt to break the service. We
          reserve the right to block traffic that does any of the above.
        </p>
      </InfoSection>

      <InfoSection title="Limitation of liability">
        <p>
          The service is provided "as is." We don't accept liability for travel
          decisions made based on AI suggestions, lost belongings, missed
          connections, or any indirect damages arising from your use of
          Adventure.AI. Travel insurance is your friend.
        </p>
      </InfoSection>

      <InfoSection title="Links to external sites">
        <p>
          Adventure.AI may link out to third-party sites for booking, official
          tourism info, or social channels. We don't control those sites and
          aren't responsible for their content.
        </p>
      </InfoSection>

      <InfoSection title="Governing law">
        <p>
          These terms are governed by the laws of Pakistan. Any dispute will be
          resolved in the courts of Islamabad.
        </p>
      </InfoSection>

      <InfoSection title="Contact">
        <p>
          Anything unclear? Email{" "}
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
