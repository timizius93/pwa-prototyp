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

// Body-Komponenten (genau die 5, die das Editorial „Run, Forrest, run!" braucht)
import {titlePage} from './components/titlePage'
import {articleText} from './components/articleText'
import {fullbleedPhoto} from './components/fullbleedPhoto'
import {photoGrid} from './components/photoGrid'
import {pullQuote} from './components/pullQuote'

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
  // Komponenten
  titlePage,
  articleText,
  fullbleedPhoto,
  photoGrid,
  pullQuote,
]
