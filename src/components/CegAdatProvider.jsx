import { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { DEFAULT_CEGADAT, pickCegAdat } from '@/lib/cegadat';

const CegAdatContext = createContext(DEFAULT_CEGADAT);

export const useCegAdat = () => useContext(CegAdatContext);

export default function CegAdatProvider({ children }) {
  const [cegadat, setCegadat] = useState(DEFAULT_CEGADAT);

  useEffect(() => {
    let active = true;
    base44.entities.CegAdat.list({ sort: '-updated_date', limit: 1 })
      .then((page) => {
        if (!active) return;
        const items = page?.items || [];
        setCegadat(pickCegAdat(items[0]));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return <CegAdatContext.Provider value={cegadat}>{children}</CegAdatContext.Provider>;
}