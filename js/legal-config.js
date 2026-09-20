// Compléter les informations manquantes avant de publier les ventes.
export const LEGAL_VERSION = '2026-09-20';
export const SELLER = {
  name: 'DB Digital',
  siret: '10252726400018',
  email: 'dbartisandigital@gmail.com',
  legalName: '',
  legalForm: '',
  address: '',
  phone: '',
  registration: '',
  vat: '',
  director: '',
  mediatorName: '',
  mediatorAddress: '',
  mediatorUrl: ''
};
export function sellerComplete(s = SELLER) {
  return ['name','siret','email','legalName','legalForm','address','phone',
    'registration','vat','director','mediatorName','mediatorAddress','mediatorUrl']
    .every(key => typeof s[key] === 'string' && s[key].trim().length > 0);
}
