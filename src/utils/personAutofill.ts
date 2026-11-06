import { DissolutionFormData, StockholderDirector } from '../types/dissolution';

export interface PersonProfile {
  name: string;
  normalizedName: string;
  nationality: string;
  address: string;
  tin: string;
  governmentId: string;
  roles: string[];
}

/**
 * Normalizes a name string for comparison (lowercased, multiple spaces collapsed)
 */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Extracts all unique persons found across the corporate secretary, president,
 * treasurer, authorized representative, and stockholders table.
 */
export function extractKnownPersons(data: DissolutionFormData): PersonProfile[] {
  const map = new Map<string, PersonProfile>();

  const register = (
    name: string,
    role: string,
    details: {
      nationality?: string;
      address?: string;
      tin?: string;
      governmentId?: string;
    }
  ) => {
    if (!name || !name.trim()) return;
    const norm = normalizeName(name);
    const existing = map.get(norm);

    if (existing) {
      if (!existing.roles.includes(role)) {
        existing.roles.push(role);
      }
      if (!existing.nationality && details.nationality) existing.nationality = details.nationality;
      if (!existing.address && details.address) existing.address = details.address;
      if (!existing.tin && details.tin) existing.tin = details.tin;
      if (!existing.governmentId && details.governmentId) existing.governmentId = details.governmentId;
      // Prefer capitalized name representation
      if (name.length > existing.name.length || (name === name.toUpperCase() && existing.name !== existing.name.toUpperCase())) {
        existing.name = name;
      }
    } else {
      map.set(norm, {
        name: name.trim(),
        normalizedName: norm,
        nationality: details.nationality || 'Filipino',
        address: details.address || '',
        tin: details.tin || '',
        governmentId: details.governmentId || '',
        roles: [role],
      });
    }
  };

  // 1. Corporate Secretary
  if (data.corporateSecretaryName) {
    register(data.corporateSecretaryName, 'Corporate Secretary', {
      nationality: data.corporateSecretaryNationality,
      address: data.corporateSecretaryAddress,
      tin: data.corporateSecretaryTin,
      governmentId: data.corporateSecretaryId,
    });
  }

  // 2. President
  if (data.presidentName) {
    register(data.presidentName, 'President', {
      nationality: data.presidentNationality,
      address: data.presidentAddress,
      tin: data.presidentTin,
      governmentId: data.presidentId,
    });
  }

  // 3. Treasurer
  if (data.treasurerName) {
    register(data.treasurerName, 'Treasurer', {
      nationality: data.treasurerNationality,
      address: data.treasurerAddress,
      tin: data.treasurerTin,
      governmentId: data.treasurerId,
    });
  }

  // 4. Authorized Representative
  if (data.authorizedRepName) {
    register(data.authorizedRepName, data.authorizedRepTitle || 'Authorized Representative', {
      address: data.authorizedRepAddress,
    });
  }

  // 5. Stockholders & Directors
  data.stockholders.forEach((s, idx) => {
    if (s.name) {
      register(s.name, `Stockholder / Director #${idx + 1}`, {
        address: s.address,
        tin: s.tin,
        governmentId: s.governmentId,
      });
    }
  });

  return Array.from(map.values());
}

/**
 * Searches for known details of a person by name, excluding a specific role if desired
 */
export function findPersonByName(name: string, data: DissolutionFormData): PersonProfile | null {
  if (!name || !name.trim()) return null;
  const norm = normalizeName(name);
  const allPersons = extractKnownPersons(data);
  return allPersons.find((p) => p.normalizedName === norm) || null;
}

/**
 * Syncs updated details for a given person across all places where their name appears
 */
export function syncPersonAcrossAllRoles(
  data: DissolutionFormData,
  targetPersonName: string,
  updatedDetails: {
    name?: string;
    nationality?: string;
    address?: string;
    tin?: string;
    governmentId?: string;
  }
): DissolutionFormData {
  if (!targetPersonName || !targetPersonName.trim()) return data;
  const normTarget = normalizeName(targetPersonName);
  const updated: DissolutionFormData = { ...data };

  const finalName = updatedDetails.name !== undefined ? updatedDetails.name : targetPersonName;

  // 1. Corporate Secretary
  if (normalizeName(updated.corporateSecretaryName) === normTarget) {
    if (updatedDetails.name !== undefined) updated.corporateSecretaryName = finalName;
    if (updatedDetails.nationality !== undefined) updated.corporateSecretaryNationality = updatedDetails.nationality;
    if (updatedDetails.address !== undefined) updated.corporateSecretaryAddress = updatedDetails.address;
    if (updatedDetails.tin !== undefined) updated.corporateSecretaryTin = updatedDetails.tin;
    if (updatedDetails.governmentId !== undefined) updated.corporateSecretaryId = updatedDetails.governmentId;
  }

  // 2. President
  if (normalizeName(updated.presidentName) === normTarget) {
    if (updatedDetails.name !== undefined) updated.presidentName = finalName;
    if (updatedDetails.nationality !== undefined) updated.presidentNationality = updatedDetails.nationality;
    if (updatedDetails.address !== undefined) updated.presidentAddress = updatedDetails.address;
    if (updatedDetails.tin !== undefined) updated.presidentTin = updatedDetails.tin;
    if (updatedDetails.governmentId !== undefined) updated.presidentId = updatedDetails.governmentId;
  }

  // 3. Treasurer
  if (normalizeName(updated.treasurerName) === normTarget) {
    if (updatedDetails.name !== undefined) updated.treasurerName = finalName;
    if (updatedDetails.nationality !== undefined) updated.treasurerNationality = updatedDetails.nationality;
    if (updatedDetails.address !== undefined) updated.treasurerAddress = updatedDetails.address;
    if (updatedDetails.tin !== undefined) updated.treasurerTin = updatedDetails.tin;
    if (updatedDetails.governmentId !== undefined) updated.treasurerId = updatedDetails.governmentId;
  }

  // 4. Authorized Representative
  if (normalizeName(updated.authorizedRepName) === normTarget) {
    if (updatedDetails.name !== undefined) updated.authorizedRepName = finalName;
    if (updatedDetails.address !== undefined) updated.authorizedRepAddress = updatedDetails.address;
  }

  // 5. Stockholders
  updated.stockholders = updated.stockholders.map((s) => {
    if (normalizeName(s.name) === normTarget) {
      return {
        ...s,
        name: updatedDetails.name !== undefined ? finalName : s.name,
        tin: updatedDetails.tin !== undefined ? updatedDetails.tin : s.tin,
        address: updatedDetails.address !== undefined ? updatedDetails.address : s.address,
        governmentId: updatedDetails.governmentId !== undefined ? updatedDetails.governmentId : s.governmentId,
      };
    }
    return s;
  });

  return updated;
}
