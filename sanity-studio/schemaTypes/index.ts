// i18n-Bausteine
import {localeString} from './objects/localeString'
import {localeText} from './objects/localeText'
import {localeBlockContent} from './objects/localeBlockContent'

// Globale Dokumente
import {magazine} from './documents/magazine'
import {issue} from './documents/issue'
import {person} from './documents/person'

// Artikel-Typen
import {articleEditorial} from './documents/articleEditorial'
import {article} from './documents/article'
import {advertisement} from './documents/advertisement'

// Body-Komponenten
import {titlePage} from './components/titlePage'
import {articleText} from './components/articleText'
import {fullbleedPhoto} from './components/fullbleedPhoto'
import {photoGrid} from './components/photoGrid'
import {pullQuote} from './components/pullQuote'
// Einzeltest-Bausteine (Nicolai S18 SWIFT)
import {specLine} from './components/specLine'
import {tuningTip} from './components/tuningTip'
import {ctaBlock} from './components/ctaBlock'
import {verdictPanel} from './components/verdictPanel'
import {hotspotImage} from './components/hotspotImage'
import {geometryOverlay} from './components/geometryOverlay'
import {interactiveBike} from './components/interactiveBike'
// Werbung
import {adImageWithZones} from './components/adImageWithZones'

export const schemaTypes = [
  // i18n
  localeString,
  localeText,
  localeBlockContent,
  // Globale Dokumente
  magazine,
  issue,
  person,
  // Artikel
  articleEditorial,
  article,
  advertisement,
  // Komponenten
  titlePage,
  articleText,
  fullbleedPhoto,
  photoGrid,
  pullQuote,
  specLine,
  tuningTip,
  ctaBlock,
  verdictPanel,
  hotspotImage,
  geometryOverlay,
  interactiveBike,
  adImageWithZones,
]
