import { mzFilterPrecision, renderMolFormula, Dictionary } from './util';
import InputFilter from './components/InputFilter.vue';
import SingleSelectFilter from './components/SingleSelectFilter.vue';
import DatasetNameFilter from './components/DatasetNameFilter.vue';
import MzFilter from './components/MzFilter.vue';
import SearchBox from './components/SearchBox.vue';

// FIXME: hard-coded adducts
const ADDUCT_POLARITY: {[key: string]: string} = {
  '+H': 'POSITIVE',
  '+Na': 'POSITIVE',
  '+K': 'POSITIVE',
  '-H': 'NEGATIVE',
  '+Cl': 'NEGATIVE',
};

function formatAdduct (adduct: string | null): string {
  if (adduct === null)
    return '';
  else {
    return renderMolFormula('M', adduct, ADDUCT_POLARITY[adduct])
  }
}

type OptionList<T> = T[];

const fixed = <T>(opts: OptionList<T>) => (lists: any) => opts;

/*
   Extracts a list from fetchOptionListsQuery results (see api/metadata.ts)
*/
const extract = (field: string) => (lists: any) => lists[field];

type OptionFormatter<T> = (opt: T) => string;

enum FilterLevel {
  annotation = 'annotation',
  dataset = 'dataset'
}

enum FilterEncoding {
  list = 'list',
  json = 'json'
}

type GqlKind = 'annotation' | 'dataset' | 'fts';

interface GqlFilter<T> {
  kind: GqlKind
  partial(value: T): any // e.g. (adduct: string) => ({adduct})
}

type RuntimeGqlFilter = {
  [K in GqlKind]: any
}

interface CommonSpec<T> {
  type: any                  // component that shall render the filter
  name: string               // short name, wil be shown on the 'tags'
  description: string        // the corresponding dropdown menu entry
  levels: FilterLevel[]      // on what pages it is applicable
  removable?: boolean        // should 'remove' cross be visible?
  initialValue?: T           // value of the filter when it's added

  // e.g. gqlFilter = (adduct) => ({adduct})
  graphql: GqlFilter<T>
}

// this is necessary only for type = SingleSelectFilter
// (FIXME: MultiSelectFilter is currently broken with this typing)
interface ListSpec<T> {
  optionList?(optionLists: any): OptionList<T>
  filterable?: boolean

  optionFormatter?: OptionFormatter<T>
  valueFormatter?: OptionFormatter<T>
}

interface UrlSpec<T> {
  urlShortcut: string        // query parameter name
  encoding?: FilterEncoding  // see encodeParams in url.ts

  // default value when the application launches;
  // as long as the value doesn't deviate from it,
  // it is not reflected in the URL
  defaultValue?: T
}

interface FilterSpecification<T>
  extends CommonSpec<T>, ListSpec<T>, UrlSpec<T> {}

type Submitter = {
  name: string
  surname: string
};

// to save on typing
type FS<T = string | null> = FilterSpecification<T>;
const LevelsAnnotation = [FilterLevel.annotation];
const LevelsBoth = [FilterLevel.annotation, FilterLevel.dataset];

class DatabaseFilterSpec implements FS {
  type = SingleSelectFilter
  name = 'Database'
  description = 'Select database'
  levels = LevelsAnnotation
  removable = false
  initialValue = 'HMDB' // because we've agreed to process every dataset with it

  optionList(lists: any) {
    return lists.molecularDatabases.map((d: any) => d.name);
  }

  urlShortcut = 'db'
  defaultValue = 'HMDB'

  graphql = {
    kind: 'annotation' as GqlKind,
    partial: (database: string) => ({database})
  }
};

// FIXME DatasetNameFilter uses its own Apollo client to fetch data
class DatasetFilterSpec implements FS<string[]> {
  type = DatasetNameFilter
  name = 'Dataset'
  description = 'Select dataset'
  levels = LevelsBoth

  urlShortcut = 'ds'
  encoding = FilterEncoding.list

  graphql = {
    kind: 'dataset' as GqlKind,
    partial(ids: string[]) {
      return {ids: ids.length == 0 ? null : ids.join('|')};
    }
  }
};

class MSMFilterSpec implements FS<number> {
  type = InputFilter
  name = 'Min. MSM'
  description = 'Set minimum MSM score'
  levels = LevelsAnnotation
  initialValue = 0.0

  urlShortcut = 'msm'

  graphql = {
    kind: 'annotation' as GqlKind,
    partial(minMSM: number) {
      return {
        msmScoreFilter: {min: minMSM, max: 1.0}
      };
    }
  }
}

class CompoundFilterSpec implements FS {
  type = InputFilter
  name = 'Molecule'
  description = 'Search molecule'
  levels = LevelsAnnotation

  urlShortcut = 'mol'

  graphql = {
    kind: 'annotation' as GqlKind,
    partial(compoundName: string) {
      return {
        compoundQuery: compoundName
      };
    }
  }
}

class AdductFilterSpec implements FS {
  type = SingleSelectFilter
  name = 'Adduct'
  description = 'Select adduct'
  levels = LevelsAnnotation
  initialValue = null

  optionList = fixed([null, '+H', '-H', '+Na', '+Cl', '+K'])
  optionFormatter = formatAdduct
  valueFormatter = formatAdduct

  urlShortcut = 'add'

  graphql = {
    kind: 'annotation' as GqlKind,
    partial: (adduct: string) => ({adduct})
  }
}

class MzFilterSpec implements FS<number> {
  type = MzFilter
  name = 'm/z'
  description = 'Search by m/z'
  levels = LevelsAnnotation

  urlShortcut = 'mz'

  graphql = {
    kind: 'annotation' as GqlKind,
    partial(mz: number) {
      const deltaMz = parseFloat(mzFilterPrecision(mz));
      return {
        mzFilter: {
          min: mz - deltaMz,
          max: mz + deltaMz
        }
      }
    }
  }
}

const formatFDR = (fdr: number) => Math.round(fdr * 100) + '%';

class FDRFilterSpec implements FS<number> {
  type = SingleSelectFilter
  name = 'FDR'
  description = 'Select FDR level'
  levels = LevelsAnnotation
  removable = false
  initialValue = 0.1

  optionList = fixed([0.05, 0.1, 0.2, 0.5])
  filterable = false
  optionFormatter = formatFDR
  valueFormatter = formatFDR

  urlShortcut = 'fdr'
  defaultValue = 0.1

  graphql = {
    kind: 'annotation' as GqlKind,
    partial: (fdrLevel: number) => ({fdrLevel})
  }
}

class SubmitterFilterSpec implements FS<Submitter> {
  type = SingleSelectFilter
  name = 'Submitter'
  description = 'Select submitter'
  levels = LevelsBoth

  optionList(lists: any) {
    return lists.submitterNames.map((x: any) => {
      const {name, surname} = x;
      return {name, surname};
    });
  }

  optionFormatter = (x: Submitter) => x.name + ' ' + x.surname
  valueFormatter = (x: Submitter) => x.name + ' ' + x.surname

  urlShortcut = 'subm'
  encoding = FilterEncoding.json

  graphql = {
    kind: 'dataset' as GqlKind,
    partial: (submitter: Submitter) => ({submitter})
  }
}

class PolarityFilterSpec implements FS {
  type = SingleSelectFilter
  name = 'Polarity'
  description = 'Select polarity'
  levels = LevelsBoth

  // FIXME: this ideally should be taken straight from the JSON schema
  optionList = fixed(['Positive', 'Negative'])
  filterable = false

  urlShortcut = 'mode'

  graphql = {
    kind: 'dataset' as GqlKind,
    partial: (polarity: string) => polarity.toUpperCase()
  }
}

class FullTextSearchSpec implements FS {
  type = SearchBox
  name = 'Simple query'
  description = 'Search anything'
  levels = LevelsBoth
  removable = false

  urlShortcut = 'q'
  defaultValue = ''

  graphql = {
    kind: 'fts' as GqlKind,
    partial: (q: string) => q
  }
}

class SimpleFilterSpec implements FS {

  type = SingleSelectFilter
  name: string
  description: string
  levels = LevelsBoth
  optionList: (optionLists: any) => OptionList<string>;
  urlShortcut: string
  graphql: GqlFilter<string>

  constructor(
    graphqlFilterField: string,
    name: string,
    optionListName: string,
    urlShortcut: string,
    description?: string)
  {
    let generatedDescription = 'Select ' + name[0].toLowerCase() + name.slice(1);

    this.name = name
    this.description = description || generatedDescription
    this.optionList = extract(optionListName)
    this.urlShortcut = urlShortcut
    this.graphql = {
      kind: 'dataset' as GqlKind,
      partial: (value: string) => ({[graphqlFilterField]: value})
    }
  }
}

// Order of the fields determines the order to be used in the filter panel dropdown list
class FilterSpecMap {
  database = new DatabaseFilterSpec()

  fdrLevel = new FDRFilterSpec()

  institution = new SimpleFilterSpec('institution', 'Lab', 'institutionNames', 'lab')

  submitter = new SubmitterFilterSpec()

  datasetIds = new DatasetFilterSpec()

  compoundName = new CompoundFilterSpec()

  mz = new MzFilterSpec()

  polarity = new PolarityFilterSpec()

  adduct = new AdductFilterSpec()

  organism = new SimpleFilterSpec('organism', 'Organism', 'organisms', 'organism')

  organismPart = new SimpleFilterSpec('organismPart', 'Organism part', 'organismParts', 'part')

  condition = new SimpleFilterSpec('condition', 'Organism condition', 'conditions', 'cond')

  growthConditions = new SimpleFilterSpec(
    'growthConditions',
    'Sample growth conditions', 'growthConditions', 'grow')

  analyzerType = new SimpleFilterSpec(
    'analyzerType',
    'Analyzer type', 'analyzerTypes', 'instr', 'Select analyzer')

  ionisationSource = new SimpleFilterSpec(
    'ionisationSource',
    'Source', 'ionisationSources', 'src', 'Select ionisation source')

  maldiMatrix = new SimpleFilterSpec(
    'maldiMatrix',
    'Matrix', 'maldiMatrices', 'matrix', 'Select MALDI matrix')

  minMSM = new MSMFilterSpec()

  simpleQuery = new FullTextSearchSpec()
}

type FilterKey = keyof FilterSpecMap;
type Filter = {
  [P in FilterKey]?: any
}

let specs = new Map<FilterKey, FilterSpecification<any>>();
Object.entries(new FilterSpecMap()).forEach(([k, v]) => {
  specs.set(k as FilterKey, v);
})

function toGraphQLFilter(f: Filter): RuntimeGqlFilter {
  let result: RuntimeGqlFilter = {
    annotation: {},
    dataset: {},
    fts: ''
  };

  specs.forEach((spec, key) => {
    let kind = spec.graphql.kind,
        value = (key in f) ? f[key] : spec.defaultValue

    if (value === undefined && value === spec.defaultValue)
      return;

    result[kind] = Object.assign(result[kind], spec.graphql.partial(value));
  })

  return result;
}

const filterKeys: string[] = Array.from(specs.keys())

const filterComponents = {
  MzFilter,
  SearchBox,
  SingleSelectFilter,
  DatasetNameFilter,
  InputFilter
}

export {
  specs as default,
  filterComponents,
  FilterLevel,
  FilterEncoding,
  FilterKey,
  Filter,
  toGraphQLFilter
};
