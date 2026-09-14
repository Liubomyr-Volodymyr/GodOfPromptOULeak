/**
 * API client barrel.
 *
 *   import { getPrompts, getPromptBySlug, type Prompt } from "@/lib/api";
 *
 * Always import from this barrel — never reach into `./prompts` etc.
 * directly. This is the seam for swapping backends, mocking in tests,
 * and tracing failures.
 */
export { API_BASE, COPILOT_API_BASE, COPILOT_WEB_URL } from "./base";
export {
  getPrompts, getPromptsPage, getPromptBySlug, getRelatedPrompts, searchPrompts, getPromptCount,
  getPromptsByCategory, getPromptsByType, getPromptsByTool,
  getOutputTypeCount, getOutputTypeCountForCategory,
} from "./prompts";
export type { PromptsQuery, Sort, Order } from "./prompts";
export { getFacets, facetCount } from "./facets";
export type { Facets, Facet, FacetsQuery } from "./facets";
export { qdrantSearch } from "./qdrant";
export type { SearchHit, SearchTaxonomy } from "./qdrant";
export type { Prompt, PromptTool, PromptCategory } from "./types";
export {
  getPosts, getPostBySlug, getRelatedPosts, getBlogCategories, getBlogCategoryBySlug, decodeEntities,
} from "./blog";
export type { BlogPost, BlogCategory, PostsQuery } from "./blog";
export { getGuides, guideModels, guideFormats } from "./guides";
export type { Guide, GuideBadge } from "./guides";
export { getBlogAuthors, getBlogAuthorBySlug } from "./blog-authors";
export type { BlogAuthor } from "./blog-authors";
export { getTools, getToolBySlug, getToolFacets, toolHasSubstance } from "./tools";
export type { Tool, ToolType } from "./tools";
export { getProducts, getProductBySlug } from "./products";
export type { Product } from "./products";
export { getLibraryCategories, getLibraryAudiences } from "./taxonomy";
export type { TaxonomyTerm } from "./taxonomy";
export { registerUser, verifyEmailCode, resendCode, loginUser, googleAuthUrl, AuthError } from "./auth";
export type { RegisterPayload } from "./auth";
export { fetchCurrentUser } from "./me";
export type { CurrentUser } from "./me";
export { createCustomPrompt, getGeneratorTaskStatus, GeneratorError } from "./generator";
export type { GeneratePayload, CheckoutSession, TaskStatus } from "./generator";
export { getReviews } from "./reviews";
export type { Review } from "./reviews";
export { fetchOptionCountMap, fetchOptionCounts } from "./counts";
export type { CountAxis } from "./counts";
