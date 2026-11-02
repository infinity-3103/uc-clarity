import { ApplianceType, City, Professional, ServiceRequest, SalesDeployment } from './types';

const ALL_CITIES: City[] = ['Mumbai', 'Delhi', 'Pune', 'Kolkata', 'Bengaluru'];
const ALL_APPLIANCES: ApplianceType[] = ['AC', 'FRIDGE', 'WASHER', 'GEYSER', 'PURIFIER'];

/**
 * Validates that every city x appliance pair (5 x 5 = 25 pairs) has at least 2 partners.
 * Throws a descriptive error listing all failing pairs if coverage is incomplete.
 */
export function validateCoverage(professionals: Professional[]): boolean {
  const missingPairs: string[] = [];

  for (const city of ALL_CITIES) {
    for (const appliance of ALL_APPLIANCES) {
      const count = professionals.filter(
        (p) => p.city === city && p.skills.includes(appliance)
      ).length;

      if (count < 2) {
        missingPairs.push(`${city} x ${appliance} (found: ${count}, required: >= 2)`);
      }
    }
  }

  if (missingPairs.length > 0) {
    throw new Error(
      `Coverage validation failed! Missing city x appliance pairs:\n${missingPairs.join('\n')}`
    );
  }

  return true;
}

export interface OpenableCheckState {
  professionals: Professional[];
  serviceRequests: ServiceRequest[];
  salesDeployments?: SalesDeployment[];
}

/**
 * Validates that every assigned partner in service requests and sales deployments
 * exists in the professionals list and can be opened in the demo selector under their city.
 */
export function assertAllAssignmentsOpenable(state: OpenableCheckState): boolean {
  const proMap = new Map<string, Professional>();
  for (const pro of state.professionals) {
    proMap.set(pro.id, pro);
  }

  // 1. Verify every ServiceRequest assigned technician exists
  for (const req of state.serviceRequests) {
    if (req.professionalId) {
      const pro = proMap.get(req.professionalId);
      if (!pro) {
        throw new Error(
          `Assignment error: ServiceRequest ${req.id} assigns professional ${req.professionalId} who does not exist in professionals list`
        );
      }
      if (!pro.city) {
        throw new Error(
          `Assignment error: Professional ${pro.id} (${pro.name}) has no city assigned for demo selector filtering`
        );
      }
    }
  }

  // 2. Verify every SalesDeployment partner exists
  if (state.salesDeployments) {
    for (const dep of state.salesDeployments) {
      const pro = proMap.get(dep.partnerId);
      if (!pro) {
        throw new Error(
          `Deployment error: SalesDeployment references partner ${dep.partnerId} who does not exist in professionals list`
        );
      }
      if (!pro.city) {
        throw new Error(
          `Deployment error: Professional ${pro.id} has no city assigned for demo selector filtering`
        );
      }
    }
  }

  return true;
}
