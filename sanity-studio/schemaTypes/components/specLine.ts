import {defineType, defineField} from 'sanity'

// Die wichtigsten Eckdaten des Test-Bikes als kompakte Schnell-Spec (im Heft die Pipe-getrennte
// Zeile unter dem Hero-Foto). Bewusst strukturierte Felder statt Freitext: konsistente Darstellung
// über alle Bike-Tests, Einheiten-Lokalisierung später möglich, abfragbar ("alle Bikes < 25 kg").
export const specLine = defineType({
  name: 'specLine',
  title: 'Spec-Zeile (Schnell-Spec)',
  type: 'object',
  fields: [
    defineField({
      name: 'bikeName',
      title: 'Bike-/Produktname',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'motor',
      title: 'Antrieb / Akku',
      type: 'string',
      description: 'z. B. „Bosch Performance Line CX / 600 Wh"',
    }),
    defineField({name: 'travelFront_mm', title: 'Federweg vorn (mm)', type: 'number'}),
    defineField({name: 'travelRear_mm', title: 'Federweg hinten (mm)', type: 'number'}),
    defineField({name: 'weight_kg', title: 'Gewicht (kg)', type: 'number'}),
    defineField({
      name: 'weight_size',
      title: 'Gewicht in Größe',
      type: 'string',
      description: 'z. B. „M"',
    }),
    defineField({name: 'price_eur', title: 'Preis (€)', type: 'number'}),
    defineField({name: 'manufacturerLink', title: 'Hersteller-Link', type: 'url'}),
  ],
  preview: {
    select: {bikeName: 'bikeName', price: 'price_eur'},
    prepare({bikeName, price}) {
      return {title: 'Spec-Zeile', subtitle: [bikeName, price ? `${price} €` : null].filter(Boolean).join(' · ')}
    },
  },
})
