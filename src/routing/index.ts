export type {
  CanonicalRouteDefinition,
  GuardDecision,
  LegacyAliasDefinition,
  PageKey,
  RouteAccessMetadata,
  RoutingSignal,
  WorkspaceKind,
} from './types';
export { CANONICAL_ROUTES, LEGACY_NAV_TO_ROUTE_ID, ROUTES_BY_ID, WORKSPACE_DEFAULT_ROUTE_ID } from './registry';
export { LEGACY_ALIASES } from './aliases';
export {
  UnknownRouteIdError,
  buildRoute,
  legacyNavIdForRoute,
  matchCanonicalPath,
  matchLegacyAlias,
  matchRoute,
  routeById,
  routeFromLegacyNavId,
  workspaceDefaultRoute,
} from './builders';
export { evaluateGuard } from './guards';
export { parseRouteParams } from './params';
export { sanitizeReturnTo, withReturnTo } from './returnTo';
export { documentTitleFor } from './titles';
export { reportRoutingSignal, readRoutingSignals, resetRoutingSignals } from './telemetry';
export { collectRegistryViolations } from './validateRegistry';
export { isPublicPath } from './publicPath';
export { navigateLegacyTab, routerNavigate } from './historyCompatibility';
export { AppRouter } from './AppRouter';
