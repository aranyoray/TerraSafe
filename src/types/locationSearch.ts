export type LocationOption = {
  id: string
  label: string
  type: 'state' | 'county'
  state?: string
  fips?: string
}
