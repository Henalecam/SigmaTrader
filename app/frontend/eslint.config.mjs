import nextjs from "eslint-config-next";

export default [
  ...nextjs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
