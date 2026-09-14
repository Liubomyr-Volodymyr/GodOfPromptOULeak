export type CabinetSection =
  | "prompts"
  | "products"
  | "settings"
  | "notifications"
  | "support";

export type CabinetUser = {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
};

export type PromptCollection = {
  title: string;
  count?: number;
  kind: "liked" | "bookmarks" | "custom";
};

export type CabinetNotification = {
  id: string;
  author: string;
  age: string;
  caption: string;
  imageUrl?: string;
};
