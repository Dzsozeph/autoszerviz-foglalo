export const CEGADAT_DEFAULTS = {
  name: 'Profi Autószerviz',
  address: '1117 Budapest, Minta utca 12.',
  city: 'Budapest',
  phone: '+36 1 234 5678',
  email: 'info@profiautoszerviz.hu',
  whatsapp: '+36 1 234 5678',
  hours_weekdays: '8:00 – 17:00',
  hours_saturday: '8:00 – 12:00',
  hours_sunday: 'zárva',
  google_maps_url:
    'https://www.google.com/maps/place/Aut%C3%B3ment%C3%A9s+0-24/@47.4099497,18.2691694,9z/data=!4m10!1m2!2m1!1zYXV0w7NzemVyZWzFkQ!3m6!1s0x4741c6bfc3ab8533:0x8c12eaf3493ebb9e!8m2!3d47.4983077!4d19.2864832!15sCg1hdXTDs3N6ZXJlbMWRkgEOdG93aW5nX3NlcnZpY2XgAQA!16s%2Fg%2F11ggzmrdty?entry=ttu&g_ep=EgoyMDI2MTExMC4wIKXMDSoASAFQAw%3D%3D',
};

const FIELDS = Object.keys(CEGADAT_DEFAULTS);

// A központi cégadatokat egyetlen rekord tárolja (CegAdat entitás).
export async function getCegAdat(base44) {
  const cegadat = { ...CEGADAT_DEFAULTS };
  try {
    const page = await base44.asServiceRole.entities.CegAdat.list('-updated_date', 1);
    const items = page && page.items ? page.items : page;
    const record = Array.isArray(items) ? items[0] : null;
    if (record) {
      FIELDS.forEach((key) => {
        const value = record[key];
        if (typeof value === 'string' && value.trim()) cegadat[key] = value.trim();
      });
    }
  } catch (error) {
    console.error('Cégadatok betöltése nem sikerült', { message: error && error.message });
  }
  return cegadat;
}

export function cegAdatEmailVars(cegadat) {
  return {
    shop_name: cegadat.name,
    shop_address: cegadat.address,
    shop_phone: cegadat.phone,
    shop_email: cegadat.email,
  };
}