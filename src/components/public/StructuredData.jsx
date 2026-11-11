import { useCegAdat } from '@/components/CegAdatProvider';
import { SITE_URL, openingHoursSpecification } from '@/lib/cegadat';

export default function StructuredData({ services = [] }) {
  const cegadat = useCegAdat();

  const data = {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    name: cegadat.name,
    url: SITE_URL,
    image: 'https://media.base44.com/images/public/6af4670961f92c12d456e3c5/0eab8ef47_generated_image.png',
    logo: 'https://media.base44.com/images/public/6af4670961f92c12d456e3c5/238570ceb_logo.png',
    telephone: cegadat.phone,
    email: cegadat.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: cegadat.address,
      addressLocality: cegadat.city,
      addressCountry: 'HU',
    },
    openingHoursSpecification: openingHoursSpecification(cegadat),
    makesOffer: services.map((service) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: service.name,
        description: service.short_description || '',
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}