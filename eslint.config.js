import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    rules: {
      // Ban returning envelope-like shapes from handlers (rough but effective).
      // Devs should return raw domain objects; wrapping is centralized.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "ReturnStatement > ObjectExpression > Property[key.name='data'], ReturnStatement > ObjectExpression > Property[key.name='error']",
          message:
            "Do not return {data: ...} or {error: ...}. Return raw domain object; errors must be thrown.",
        },
      ],
    },
  },
);
