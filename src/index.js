const { ArrayField, ObjectField } = require("./fields");

class Serializer {
  constructor(schema, options = {}) {
    this.schema = schema;
    this.many = false;
    this.context = {};
    this.mode = "";
    this.allowedModes = ["both", "input", "output"];
    this.errors = {};

    for (const [name, field] of Object.entries(schema)) {
      field.bind?.(this, name);
    }
  }

  serialize(input, options) {
    // option.MANY
    this.many = options.many ?? false;
    if (typeof this.many !== "boolean") {
      throw new TypeError(
        `Expected 'many' to be a boolean, got ${typeof this.many}`,
      );
    }

    // option.MODES
    this.mode = options.mode || "both";
    if (
      typeof this.mode !== "string" ||
      !this.allowedModes.includes(this.mode)
    ) {
      throw new TypeError(
        `Invalid mode: "${this.mode}". Allowed modes are: ${this.allowedModes.join(", ")}`,
      );
    }

    // option.CONTEXT
    this.context = options.context ?? options.ctx ?? {};
    if (
      typeof this.context !== "object" ||
      this.context === null ||
      Array.isArray(this.context)
    ) {
      throw new TypeError(
        `Expected 'context' to be a plain object, got ${this.context === null ? "null" : typeof this.context}`,
      );
    }

    this.errors = {};

    if (this.many) {
      if (!Array.isArray(input))
        throw new Error("Expected array when many=true");
      this.data = input.map((item, index) =>
        this._serializeItem(item, this.context, index, this.mode),
      );
    } else {
      this.data = this._serializeItem(input, this.context, null, this.mode);
    }
    return this;
  }

  _serializeItem(item, context = {}, index = null, mode) {
    const output = {};

    for (const key in this.schema) {
      const field = this.schema[key];
      const value = item?.[key];
      const path = index !== null ? `${index}.${key}` : key;

      const result = field.serialize(value, context, this, path, mode);
      if (!result.skip && result.value !== undefined) {
        output[key] = result.value;
      }
    }
    return output;
  }

  _addError(field, message) {
    this.errors[field] = message;
  }

  describe() {
    const out = {};
    for (const key in this.schema) {
      const field = this.schema[key];
      out[key] = {
        type: field.constructor.name,
        required: field.required,
        child:
          field instanceof ArrayField
            ? field.child instanceof Serializer
              ? "Serializer"
              : field.child.constructor.name
            : null,
        serializer:
          field instanceof ObjectField ? field.serializer.describe() : null,
      };
    }
    return out;
  }
}

module.exports = { Serializer };
