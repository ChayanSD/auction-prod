import slugify from "slugify";

export const generateSlug = (text: string): string => {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid input for slug generation");
  }

  const baseSlug = slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });

  return baseSlug;
};
