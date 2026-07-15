export type TravelPlanPresentation = 'active' | 'archived'

/**
 * A plan stays a plan after its travel date. The date only decides which lobby
 * section presents it; it never promotes the document into a travel memory.
 */
export function classifyTravelPlan(
  endDate: Date | string,
  currentDate: Date = new Date(),
): TravelPlanPresentation {
  return startOfDay(endDate) < startOfDay(currentDate) ? 'archived' : 'active'
}

function startOfDay(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value

  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
