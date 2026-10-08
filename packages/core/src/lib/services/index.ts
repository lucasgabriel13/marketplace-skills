export { resolveCatalogRoot } from './catalog-locator.service.js'
export { scanCatalog, scanCategories, normalizeArtifactName } from './catalog.service.js'
export {
  buildRegistry,
  writeRegistry,
  loadRegistry,
  queryArtifacts,
  findArtifact,
  findArtifactsByName,
  categoriesFromRegistry,
  resolveArtifactSource,
  type ArtifactQuery,
} from './registry.service.js'
export {
  getLockDir,
  getLockPath,
  readLock,
  writeLock,
  addToLock,
  removeFromLock,
  listLock,
  getLockEntry,
} from './lockfile.service.js'
export {
  installArtifact,
  removeArtifact,
  isInstalled,
  resolveDestinationPath,
  type InstallableArtifact,
} from './installer.service.js'
export {
  planUpdates,
  type UpdatePlan,
  type UpdateItem,
  type UpdateReason,
  type InstalledRef,
} from './update.service.js'
export {
  listTargets,
  getTarget,
  isValidTarget,
  isTypeSupported,
  supportedTypes,
  resolveDestination,
  type ResolvedDestination,
} from './targets.service.js'
export {
  readConfig,
  writeConfig,
  getConfigPath,
  setDefaultTarget,
  setDefaultMethod,
  resolveActiveTarget,
  resolveActiveMethod,
  type JarvisConfig,
} from './config.service.js'
