import { registerEnumType } from 'type-graphql'

export enum GdtEntryType {
  FORM = 1,
  CVS = 2,
  ELOPAGE = 3,
  ELOPAGE_PUBLISHER = 4,
  DIGISTORE = 5,
  CVS2 = 6,
  GLOBAL_MODIFICATOR = 7,
}

registerEnumType(GdtEntryType, {
  name: 'GdtEntryType', // this one is mandatory
  description: 'Gdt Entry Source Type', // this one is optional
})
