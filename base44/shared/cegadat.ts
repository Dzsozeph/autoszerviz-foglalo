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