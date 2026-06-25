import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '5ul5gufv',
    dataset: 'production',
  },
  // Gehostetes Studio: https://magazin-41.sanity.studio
  // (Sanity-Hostnamen duerfen nicht mit Ziffer beginnen, daher nicht 41-magazin).
  studioHost: 'magazin-41',
  deployment: {
    appId: 'z2uk5t5sscxrh8qepd3a25b6',
  },
})
