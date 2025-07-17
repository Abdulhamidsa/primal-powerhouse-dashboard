module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    // Disable problematic rules for deployment
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/ban-ts-comment": "warn",
    "@next/next/no-img-element": "warn",
    "@next/next/no-html-link-for-pages": "warn",
    "react/no-unescaped-entities": "warn",
    "react-hooks/exhaustive-deps": "warn",
  },
};
