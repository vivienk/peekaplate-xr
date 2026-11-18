/** Explicit routes take precedence over the legacy AR-host landing page. */
export function usesSpectacles(location: Pick<Location, 'pathname'|'hostname'|'search'>): boolean {
  const path=location.pathname.replace(/\/+$/, '') || '/';
  if(path==='/xr')return false;
  if(path==='/xr/1')return true;
  return new URLSearchParams(location.search).get('spectacles')==='1'
    || (path==='/'&&location.hostname==='peekaplate-ar.vercel.app');
}
