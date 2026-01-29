const { ArrayField, ObjectField } = require("./fields");

class Serializer {
  constructor(schema, options = {}) {
    this.schema = schema;
    this.many = !!options.many;
    this.errors = {};

    for (const [name, field] of Object.entries(schema)) {
      field.bind?.(this, name);
    }
  }

  serialize(input, context = {}, mode = "both") {
    this.errors = {};
    if (this.many) {
      if (!Array.isArray(input))
        throw new Error("Expected array when many=true");
      this.data = input.map((item, index) =>
        this._serializeItem(item, context, index, mode),
      );
    } else {
      this.data = this._serializeItem(input, context, null, mode);
    }
    return this;
  }

  _serializeItem(item, context = {}, index = null, mode = "both") {
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
