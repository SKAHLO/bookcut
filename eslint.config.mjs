import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat();

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      // Add any custom rules here
    },
  },
];
