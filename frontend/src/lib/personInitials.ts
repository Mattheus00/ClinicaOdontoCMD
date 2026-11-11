const PROFESSIONAL_TITLE = /^(dr\.?|dra\.?)\s+/i;

/** Remove prefixos Dr./Dra. (com ou sem ponto) para exibição e iniciais. */
export function stripProfessionalTitle(name: string): string {
  let rest = name.trim();
  while (PROFESSIONAL_TITLE.test(rest)) {
    rest = rest.replace(PROFESSIONAL_TITLE, '').trim();
  }
  return rest;
}

export function professionalInitial(name: string): string {
  const letter = stripProfessionalTitle(name).charAt(0);
  return letter ? letter.toLocaleUpperCase('pt-BR') : '?';
}
