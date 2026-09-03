import { request } from '../../shared/api/httpClient'
import type { NewHireProvisioningInput, NewHireProvisioningResult } from './newHireTypes'

export function provisionNewHire(input: NewHireProvisioningInput): Promise<NewHireProvisioningResult> {
  return request<NewHireProvisioningResult>('/hr/new-hires', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
