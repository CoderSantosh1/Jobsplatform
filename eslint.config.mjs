import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: ["**/node_modules/**", ".next/**", "out/**", "dist/**", "build/**"],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-floating-promises": "off",
    },
  },
];

export default eslintConfig;